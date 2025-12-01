<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetSerialNumber;
use App\Models\Borrowing;
use App\Models\Computer;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function analytics(Request $request)
    {
        $user = auth()->user();
        
        // Determine if user should see only their department's data
        $departmentId = null;
        if (!$user->hasRole('super-admin') && !$user->can('view all departments')) {
            $departmentId = $user->department_id;
        }
        
        // Allow admins to filter by specific department if requested
        if (($user->hasRole('super-admin') || $user->can('view all departments')) && $request->has('department_id')) {
            $departmentId = $request->department_id;
        }

        // Only return summary data for simplified dashboard
        return response()->json([
            'summary' => [
                'total_assets' => $this->getAssetCount($departmentId),
                'total_computers' => $this->getComputerCount($departmentId),
                'total_serial_numbers' => $this->getSerialNumberCount($departmentId),
                'active_borrowings' => $this->getActiveBorrowingsCount($departmentId),
            ],
        ]);
    }

    private function getAssetCount($departmentId = null)
    {
        $query = Asset::query();
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }
        return $query->sum('quantity');
    }

    private function getComputerCount($departmentId = null)
    {
        $query = Computer::query();
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }
        return $query->count();
    }

    private function getSerialNumberCount($departmentId = null)
    {
        $query = AssetSerialNumber::query();
        if ($departmentId) {
            $query->whereHas('asset', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }
        return $query->count();
    }

    private function getActiveBorrowingsCount($departmentId = null)
    {
        $query = Borrowing::where('status', 'active');
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }
        return $query->count();
    }
}
