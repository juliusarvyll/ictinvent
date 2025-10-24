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

        // Total counts
        $totalAssets = $this->getAssetCount($departmentId);
        $totalComputers = $this->getComputerCount($departmentId);
        $totalSerialNumbers = $this->getSerialNumberCount($departmentId);
        $activeBorrowings = $this->getActiveBorrowingsCount($departmentId);

        // Asset status breakdown
        $assetsByStatus = $this->getAssetsByStatus($departmentId);

        // Borrowing status breakdown
        $borrowingsByStatus = $this->getBorrowingsByStatus($departmentId);

        // Assets by category (top 5)
        $assetsByCategory = $this->getAssetsByCategory($departmentId);

        // Recent borrowings
        $recentBorrowings = $this->getRecentBorrowings($departmentId);

        // Assets by department (for admins)
        $assetsByDepartment = ($user->hasRole('super-admin') || $user->can('view all departments')) ? $this->getAssetsByDepartment() : null;

        // Low stock alerts
        $lowStockAssets = $this->getLowStockAssets($departmentId);

        // Overdue borrowings
        $overdueBorrowings = $this->getOverdueBorrowings($departmentId);

        // Unassigned serial numbers
        $unassignedSerialNumbers = $this->getUnassignedSerialNumbers($departmentId);

        return response()->json([
            'summary' => [
                'total_assets' => $totalAssets,
                'total_computers' => $totalComputers,
                'total_serial_numbers' => $totalSerialNumbers,
                'active_borrowings' => $activeBorrowings,
            ],
            'assets_by_status' => $assetsByStatus,
            'borrowings_by_status' => $borrowingsByStatus,
            'assets_by_category' => $assetsByCategory,
            'assets_by_department' => $assetsByDepartment,
            'recent_borrowings' => $recentBorrowings,
            'low_stock_assets' => $lowStockAssets,
            'overdue_borrowings' => $overdueBorrowings,
            'unassigned_serial_numbers' => $unassignedSerialNumbers,
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

    private function getAssetsByStatus($departmentId = null)
    {
        // Get status from serial numbers, not assets
        $query = AssetSerialNumber::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status');
        
        if ($departmentId) {
            $query->whereHas('asset', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        return $query->get()->map(function ($item) {
            return [
                'status' => $item->status,
                'count' => (int) $item->count,
            ];
        });
    }

    private function getBorrowingsByStatus($departmentId = null)
    {
        $query = Borrowing::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status');
        
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        return $query->get()->map(function ($item) {
            return [
                'status' => $item->status,
                'count' => (int) $item->count,
            ];
        });
    }

    private function getAssetsByCategory($departmentId = null)
    {
        $query = Asset::join('categories', 'assets.category_id', '=', 'categories.id')
            ->select('categories.name as category_name', DB::raw('SUM(assets.quantity) as count'))
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('count')
            ->limit(5);
        
        if ($departmentId) {
            $query->where('assets.department_id', $departmentId);
        }

        return $query->get()->map(function ($item) {
            return [
                'category' => $item->category_name ?? 'Unknown',
                'count' => (int) $item->count,
            ];
        });
    }

    private function getAssetsByDepartment()
    {
        return Asset::join('departments', 'assets.department_id', '=', 'departments.id')
            ->select('departments.name as department_name', DB::raw('SUM(assets.quantity) as count'))
            ->whereNotNull('assets.department_id')
            ->groupBy('departments.id', 'departments.name')
            ->orderByDesc('count')
            ->get()
            ->map(function ($item) {
                return [
                    'department' => $item->department_name ?? 'Unknown',
                    'count' => (int) $item->count,
                ];
            });
    }

    private function getRecentBorrowings($departmentId = null)
    {
        $query = Borrowing::with(['user', 'assetSerial.asset', 'computer'])
            ->orderBy('created_at', 'desc')
            ->limit(5);
        
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        return $query->get()->map(function ($borrowing) {
            return [
                'id' => $borrowing->id,
                'user' => $borrowing->user?->name ?? 'Unknown User',
                'item' => $borrowing->assetSerial 
                    ? ($borrowing->assetSerial->asset?->name ?? 'Unknown Asset')
                    : ($borrowing->computer?->hostname ?? 'Unknown'),
                'status' => $borrowing->status,
                'borrow_date' => $borrowing->borrow_date->format('Y-m-d'),
                'expected_return_date' => $borrowing->expected_return_date?->format('Y-m-d'),
            ];
        });
    }

    private function getLowStockAssets($departmentId = null)
    {
        // Check assets where available serial numbers are low
        $query = Asset::with('category')
            ->withCount(['serialNumbers as available_count' => function ($query) {
                $query->where('status', 'available');
            }])
            ->having('available_count', '<=', 5)
            ->having('available_count', '>', 0)
            ->orderBy('available_count', 'asc');
        
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        return $query->get()->map(function ($asset) {
            return [
                'id' => $asset->id,
                'name' => $asset->name,
                'category' => $asset->category->name ?? 'Unknown',
                'quantity' => $asset->available_count,
            ];
        });
    }

    private function getOverdueBorrowings($departmentId = null)
    {
        $query = Borrowing::with(['user', 'assetSerial.asset', 'computer'])
            ->where('status', 'active')
            ->where('expected_return_date', '<', now())
            ->orderBy('expected_return_date', 'asc');
        
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        return $query->get()->map(function ($borrowing) {
            $daysOverdue = now()->diffInDays($borrowing->expected_return_date);
            
            return [
                'id' => $borrowing->id,
                'user' => $borrowing->user?->name ?? 'Unknown User',
                'item' => $borrowing->assetSerial 
                    ? ($borrowing->assetSerial->asset?->name ?? 'Unknown Asset')
                    : ($borrowing->computer?->hostname ?? 'Unknown'),
                'expected_return_date' => $borrowing->expected_return_date->format('Y-m-d'),
                'days_overdue' => $daysOverdue,
            ];
        });
    }

    private function getUnassignedSerialNumbers($departmentId = null)
    {
        // Get assets where serial number count is less than quantity
        $query = Asset::with('category')
            ->withCount('serialNumbers')
            ->havingRaw('serial_numbers_count < quantity')
            ->orderByRaw('quantity - serial_numbers_count DESC');
        
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        return $query->get()->map(function ($asset) {
            $missing = $asset->quantity - $asset->serial_numbers_count;
            
            return [
                'id' => $asset->id,
                'name' => $asset->name,
                'category' => $asset->category->name ?? 'Unknown',
                'quantity' => $asset->quantity,
                'registered' => $asset->serial_numbers_count,
                'missing' => $missing,
            ];
        });
    }
}
