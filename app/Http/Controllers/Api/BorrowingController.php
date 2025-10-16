<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BorrowingResource;
use App\Models\Borrowing;
use App\Models\BorrowingHistory;
use App\Traits\LogsAudit;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class BorrowingController extends Controller
{
    use AuthorizesRequests, LogsAudit;
    private function logBorrowingHistory(Borrowing $borrowing, string $action, ?string $oldStatus = null, ?string $newStatus = null, ?string $notes = null, ?array $changes = null)
    {
        BorrowingHistory::create([
            'borrowing_id' => $borrowing->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'notes' => $notes,
            'changes' => $changes,
        ]);
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Borrowing::class);
        
        $query = Borrowing::with(['user', 'assetSerial.asset', 'computer', 'department', 'originDepartment']);

        // Filter based on permissions
        $user = auth()->user();
        
        if ($user->hasPermissionTo('view all borrowings')) {
            // No filter - can see all
        } elseif ($user->hasPermissionTo('view department borrowings')) {
            // Filter by department
            if ($user->department_id) {
                $query->where(function($q) use ($user) {
                    $q->where('department_id', $user->department_id)
                      ->orWhere('origin_department_id', $user->department_id);
                });
            }
        } elseif ($user->hasPermissionTo('view own borrowings')) {
            // Filter by user
            $query->where('user_id', $user->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $borrowings = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return BorrowingResource::collection($borrowings);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Borrowing::class);
        
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'borrower_name' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id', // requester's dept
            'asset_serial_id' => 'nullable|exists:asset_serial_numbers,id',
            'computer_id' => 'nullable|exists:computers,id',
            'includes_peripherals' => 'nullable|boolean',
            'borrow_date' => 'required|date',
            'expected_return_date' => 'required|date|after_or_equal:borrow_date',
            'return_date' => 'nullable|date',
            'status' => 'in:pending,borrowed,returned,lost,rejected',
            'remarks' => 'nullable|string',
        ]);

        // Check if borrower info is provided (either user_id or borrower_name)
        if (empty($validated['user_id']) && empty($validated['borrower_name'])) {
            return response()->json(['message' => 'Either user_id or borrower_name is required'], 422);
        }

        if (!$validated['asset_serial_id'] && !$validated['computer_id']) {
            return response()->json(['message' => 'Either asset_serial_id or computer_id is required'], 422);
        }

        // Find owner/origin department
        $originDepartmentId = null;
        if ($validated['asset_serial_id']) {
            $serial = \App\Models\AssetSerialNumber::find($validated['asset_serial_id']);
            $originDepartmentId = $serial?->department_id;
        } elseif ($validated['computer_id']) {
            $computer = \App\Models\Computer::find($validated['computer_id']);
            $originDepartmentId = $computer?->department_id;
        }

        // Set pending status if borrowing from another department
        $borrowerDept = $validated['department_id'] ?? null;
        $status = $validated['status'] ?? 'borrowed';
        if ($originDepartmentId && $borrowerDept && $originDepartmentId != $borrowerDept) {
            $status = 'pending';
        }
        $borrowing = Borrowing::create([
            ...$validated,
            'origin_department_id' => $originDepartmentId,
            'status' => $status,
        ]);
        
        // Log the creation
        $this->logBorrowingHistory(
            $borrowing,
            'created',
            null,
            $status,
            'Borrowing request created'
        );
        
        // Audit log
        $this->logCreated('borrowings', $borrowing);
        
        return new BorrowingResource($borrowing->load(['user', 'assetSerial.asset', 'computer']));
    }

    public function show(Borrowing $borrowing)
    {
        $this->authorize('view', $borrowing);
        
        return new BorrowingResource($borrowing->load(['user', 'assetSerial.asset', 'computer', 'department', 'originDepartment', 'histories.user']));
    }

    public function update(Request $request, Borrowing $borrowing)
    {
        $this->authorize('update', $borrowing);
        
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'borrower_name' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'asset_serial_id' => 'nullable|exists:asset_serial_numbers,id',
            'computer_id' => 'nullable|exists:computers,id',
            'includes_peripherals' => 'nullable|boolean',
            'borrow_date' => 'required|date',
            'expected_return_date' => 'required|date|after_or_equal:borrow_date',
            'return_date' => 'nullable|date',
            'status' => 'in:pending,borrowed,returned,lost,rejected',
            'remarks' => 'nullable|string',
        ]);

        // Check if borrower info is provided (either user_id or borrower_name)
        if (empty($validated['user_id']) && empty($validated['borrower_name'])) {
            return response()->json(['message' => 'Either user_id or borrower_name is required'], 422);
        }

        if (!$validated['asset_serial_id'] && !$validated['computer_id']) {
            return response()->json(['message' => 'Either asset_serial_id or computer_id is required'], 422);
        }
        // Find owner/origin department
        $originDepartmentId = null;
        if ($validated['asset_serial_id']) {
            $serial = \App\Models\AssetSerialNumber::find($validated['asset_serial_id']);
            $originDepartmentId = $serial?->department_id;
        } elseif ($validated['computer_id']) {
            $computer = \App\Models\Computer::find($validated['computer_id']);
            $originDepartmentId = $computer?->department_id;
        }
        // Track changes
        $oldStatus = $borrowing->status;
        $originalData = $borrowing->toArray(); // Capture original data before update
        $changes = [];
        foreach ($validated as $key => $value) {
            if ($borrowing->$key != $value) {
                $changes[$key] = ['old' => $borrowing->$key, 'new' => $value];
            }
        }
        
        // Only allow status update from pending to borrowed by staff from the origin department
        if ($borrowing->status === 'pending' && ($validated['status'] ?? '') === 'borrowed') {
            // Optionally, check permissions here
            $validated['status'] = 'borrowed';
        }
        
        $borrowing->update($validated);
        
        // Log changes if any
        if ($borrowing->wasChanged()) {
            $this->logBorrowingHistory(
                $borrowing,
                'updated',
                $oldStatus,
                $borrowing->status,
                'Borrowing details updated',
                $changes
            );
            
            // Audit log
            $this->logUpdated('borrowings', $borrowing, $originalData);
        }
        
        return new BorrowingResource($borrowing->load(['user', 'assetSerial.asset', 'computer']));
    }

    public function destroy(Borrowing $borrowing)
    {
        $this->authorize('delete', $borrowing);
        
        // Audit log before deletion
        $this->logDeleted('borrowings', $borrowing);
        
        $borrowing->delete();

        return response()->json(['message' => 'Borrowing record deleted successfully']);
    }

    public function returnItem(Request $request, Borrowing $borrowing)
    {
        $this->authorize('return', $borrowing);
        
        $validated = $request->validate([
            'return_date' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        $oldStatus = $borrowing->status;
        
        $borrowing->update([
            'return_date' => $validated['return_date'],
            'status' => 'returned',
            'remarks' => $validated['remarks'] ?? $borrowing->remarks,
        ]);
        
        // Log the return
        $this->logBorrowingHistory(
            $borrowing,
            'returned',
            $oldStatus,
            'returned',
            $validated['remarks'] ?? 'Item returned'
        );
        
        // Audit log
        $this->logAction('returned', 'borrowings', [
            'borrowing_id' => $borrowing->id,
            'return_date' => $validated['return_date'],
            'remarks' => $validated['remarks'] ?? null,
        ]);

        return new BorrowingResource($borrowing->load(['user', 'assetSerial.asset', 'computer']));
    }

    public function approveRequest(Request $request, Borrowing $borrowing)
    {
        $this->authorize('approve', $borrowing);

        $validated = $request->validate([
            'remarks' => 'nullable|string',
        ]);

        $borrowing->update([
            'status' => 'borrowed',
            'remarks' => $validated['remarks'] ?? $borrowing->remarks,
        ]);
        
        // Log the approval
        $this->logBorrowingHistory(
            $borrowing,
            'approved',
            'pending',
            'borrowed',
            $validated['remarks'] ?? 'Request approved'
        );
        
        // Audit log
        $this->logAction('approved', 'borrowings', [
            'borrowing_id' => $borrowing->id,
            'remarks' => $validated['remarks'] ?? null,
        ]);

        return new BorrowingResource($borrowing->load(['user', 'assetSerial.asset', 'computer', 'department', 'originDepartment']));
    }

    public function rejectRequest(Request $request, Borrowing $borrowing)
    {
        $this->authorize('reject', $borrowing);

        $validated = $request->validate([
            'remarks' => 'required|string',
        ]);

        $borrowing->update([
            'status' => 'rejected',
            'remarks' => $validated['remarks'],
        ]);
        
        // Log the rejection
        $this->logBorrowingHistory(
            $borrowing,
            'rejected',
            'pending',
            'rejected',
            $validated['remarks']
        );
        
        // Audit log
        $this->logAction('rejected', 'borrowings', [
            'borrowing_id' => $borrowing->id,
            'remarks' => $validated['remarks'],
        ]);

        return new BorrowingResource($borrowing->load(['user', 'assetSerial.asset', 'computer', 'department', 'originDepartment']));
    }
}
