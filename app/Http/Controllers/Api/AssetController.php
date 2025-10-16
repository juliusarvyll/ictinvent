<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use App\Traits\LogsAudit;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    use LogsAudit;
    public function index(Request $request)
    {
        $query = Asset::with(['category', 'department'])->withCount('serialNumbers');

        // Filter by department if user is not Super Admin or Admin
        $user = auth()->user();
        if ($user && !$user->hasAnyRole(['Super Admin', 'Admin'])) {
            if ($user->department_id) {
                $query->where('department_id', $user->department_id);
            } else {
                // If user has no department, show nothing
                $query->whereRaw('1 = 0');
            }
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $assets = $query->paginate($request->get('per_page', 15));

        return AssetResource::collection($assets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'required|integer|min:0',
            'min_quantity' => 'nullable|integer|min:0',
            'max_quantity' => 'nullable|integer|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'depreciation_rate' => 'nullable|numeric|min:0|max:100',
            'purchase_date' => 'nullable|date',
            'expected_lifespan_months' => 'nullable|integer|min:0',
            'retirement_date' => 'nullable|date',
            'warranty_expiry_date' => 'nullable|date',
            'requires_license' => 'nullable|boolean',
            'license_details' => 'nullable|string',
            'requires_calibration' => 'nullable|boolean',
            'last_calibration_date' => 'nullable|date',
            'next_calibration_date' => 'nullable|date',
            'calibration_interval_months' => 'nullable|integer|min:0',
        ]);

        $asset = Asset::create($validated);
        
        // Audit log
        $this->logCreated('assets', $asset);

        return new AssetResource($asset->load('category'));
    }

    public function show(Asset $asset)
    {
        return new AssetResource($asset->load(['category', 'department', 'serialNumbers']));
    }

    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'required|integer|min:0',
            'min_quantity' => 'nullable|integer|min:0',
            'max_quantity' => 'nullable|integer|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'depreciation_rate' => 'nullable|numeric|min:0|max:100',
            'purchase_date' => 'nullable|date',
            'expected_lifespan_months' => 'nullable|integer|min:0',
            'retirement_date' => 'nullable|date',
            'warranty_expiry_date' => 'nullable|date',
            'requires_license' => 'nullable|boolean',
            'license_details' => 'nullable|string',
            'requires_calibration' => 'nullable|boolean',
            'last_calibration_date' => 'nullable|date',
            'next_calibration_date' => 'nullable|date',
            'calibration_interval_months' => 'nullable|integer|min:0',
        ]);

        $originalData = $asset->toArray();
        $asset->update($validated);
        
        // Audit log
        if ($asset->wasChanged()) {
            $this->logUpdated('assets', $asset, $originalData);
        }

        return new AssetResource($asset->load('category'));
    }

    public function destroy(Asset $asset)
    {
        // Audit log before deletion
        $this->logDeleted('assets', $asset);
        
        $asset->delete();

        return response()->json(['message' => 'Asset deleted successfully']);
    }
}
