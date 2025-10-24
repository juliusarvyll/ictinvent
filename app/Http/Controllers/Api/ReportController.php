<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetSerialNumber;
use App\Models\Borrowing;
use App\Models\Category;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * Generate asset inventory report
     */
    public function assetInventory(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        $query = Asset::with(['category', 'department', 'serialNumbers']);
        
        // Apply department filter for non-super admins
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhereNull('department_id');
            });
        }
        
        // Apply filters
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        
        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }
        
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        
        $assets = $query->get();
        
        $summary = [
            'total_assets' => $assets->count(),
            'total_quantity' => $assets->sum('quantity'),
            'total_value' => $assets->sum('current_value'),
            'available' => $assets->sum('quantity_available'),
            'in_use' => $assets->sum('quantity_in_use'),
            'maintenance' => $assets->sum('quantity_maintenance'),
        ];
        
        return response()->json([
            'summary' => $summary,
            'assets' => $assets,
        ]);
    }
    
    /**
     * Generate asset valuation report
     */
    public function assetValuation(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        $query = Asset::with(['category', 'department'])
            ->whereNotNull('current_value');
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhereNull('department_id');
            });
        }
        
        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }
        
        $assets = $query->get();
        
        $byCategory = $assets->groupBy('category.name')->map(function ($items) {
            return [
                'count' => $items->count(),
                'total_value' => $items->sum('current_value'),
                'purchase_value' => $items->sum('purchase_price'),
            ];
        });
        
        $byDepartment = $assets->groupBy('department.name')->map(function ($items) {
            return [
                'count' => $items->count(),
                'total_value' => $items->sum('current_value'),
            ];
        });
        
        return response()->json([
            'summary' => [
                'total_current_value' => $assets->sum('current_value'),
                'total_purchase_value' => $assets->sum('purchase_price'),
                'depreciation' => $assets->sum('purchase_price') - $assets->sum('current_value'),
            ],
            'by_category' => $byCategory,
            'by_department' => $byDepartment,
            'assets' => $assets,
        ]);
    }
    
    /**
     * Generate borrowing report
     */
    public function borrowings(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        $query = Borrowing::with(['asset', 'user', 'department', 'originDepartment']);
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhere('origin_department_id', $user->department_id);
            });
        }
        
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('borrowed_at', '>=', $request->date_from);
        }
        
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('borrowed_at', '<=', $request->date_to);
        }
        
        $borrowings = $query->orderBy('borrowed_at', 'desc')->get();
        
        $summary = [
            'total' => $borrowings->count(),
            'active' => $borrowings->where('status', 'borrowed')->count(),
            'returned' => $borrowings->where('status', 'returned')->count(),
            'overdue' => $borrowings->where('status', 'overdue')->count(),
        ];
        
        return response()->json([
            'summary' => $summary,
            'borrowings' => $borrowings,
        ]);
    }
    
    /**
     * Generate maintenance report
     */
    public function maintenance(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        $query = AssetSerialNumber::with(['asset.category', 'asset.department'])
            ->where('status', 'maintenance');
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->whereHas('asset', function($q) use ($user) {
                $q->where(function($subQ) use ($user) {
                    $subQ->where('department_id', $user->department_id)
                         ->orWhereNull('department_id');
                });
            });
        }
        
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('last_maintenance_date', '>=', $request->date_from);
        }
        
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('last_maintenance_date', '<=', $request->date_to);
        }
        
        $items = $query->get();
        
        return response()->json([
            'summary' => [
                'total_in_maintenance' => $items->count(),
                'upcoming_maintenance' => AssetSerialNumber::whereNotNull('next_maintenance_date')
                    ->whereDate('next_maintenance_date', '<=', now()->addDays(30))
                    ->count(),
            ],
            'items' => $items,
        ]);
    }
    
    /**
     * Generate low stock alert report
     */
    public function lowStock(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        $query = Asset::with(['category', 'department'])
            ->whereNotNull('min_quantity')
            ->whereRaw('quantity_available < min_quantity');
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhereNull('department_id');
            });
        }
        
        $assets = $query->get();
        
        return response()->json([
            'summary' => [
                'total_low_stock' => $assets->count(),
                'critical' => $assets->filter(function($asset) {
                    return $asset->quantity_available == 0;
                })->count(),
            ],
            'assets' => $assets,
        ]);
    }
    
    /**
     * Generate asset lifecycle report
     */
    public function lifecycle(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        $query = Asset::with(['category', 'department'])
            ->whereNotNull('purchase_date');
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhereNull('department_id');
            });
        }
        
        $assets = $query->get();
        
        $expiringSoon = $assets->filter(function($asset) {
            return $asset->warranty_expiry_date && 
                   now()->diffInDays($asset->warranty_expiry_date, false) <= 30 &&
                   now()->diffInDays($asset->warranty_expiry_date, false) >= 0;
        });
        
        $needsRetirement = $assets->filter(function($asset) {
            return $asset->retirement_date && 
                   now()->diffInDays($asset->retirement_date, false) <= 90 &&
                   now()->diffInDays($asset->retirement_date, false) >= 0;
        });
        
        return response()->json([
            'summary' => [
                'total_assets' => $assets->count(),
                'warranty_expiring_soon' => $expiringSoon->count(),
                'needs_retirement_soon' => $needsRetirement->count(),
            ],
            'warranty_expiring' => $expiringSoon->values(),
            'needs_retirement' => $needsRetirement->values(),
        ]);
    }
    
    /**
     * Get available report types
     */
    public function types()
    {
        return response()->json([
            'types' => [
                [
                    'id' => 'inventory',
                    'name' => 'Asset Inventory Report',
                    'description' => 'Complete inventory of all assets with quantities and status',
                ],
                [
                    'id' => 'valuation',
                    'name' => 'Asset Valuation Report',
                    'description' => 'Financial valuation and depreciation of assets',
                ],
                [
                    'id' => 'borrowings',
                    'name' => 'Borrowing Report',
                    'description' => 'History and status of asset borrowings',
                ],
                [
                    'id' => 'maintenance',
                    'name' => 'Maintenance Report',
                    'description' => 'Assets currently in maintenance and upcoming schedules',
                ],
                [
                    'id' => 'low-stock',
                    'name' => 'Low Stock Alert Report',
                    'description' => 'Assets below minimum quantity threshold',
                ],
                [
                    'id' => 'lifecycle',
                    'name' => 'Asset Lifecycle Report',
                    'description' => 'Warranty expiration and retirement planning',
                ],
            ],
        ]);
    }
    
    /**
     * Export report as PDF
     */
    public function exportPdf(Request $request, $type)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        // Get report data based on type
        $reportData = $this->getReportData($type, $request, $user, $isSuperAdmin);
        
        // Generate PDF
        $pdf = Pdf::loadView('reports.pdf', [
            'type' => $type,
            'data' => $reportData,
            'user' => $user,
            'isSuperAdmin' => $isSuperAdmin,
            'filters' => $request->all(),
            'generatedAt' => now()->format('F d, Y h:i A'),
        ]);
        
        $filename = $type . '-report-' . now()->format('Y-m-d') . '.pdf';
        
        return $pdf->download($filename);
    }
    
    /**
     * Get report data based on type
     */
    private function getReportData($type, Request $request, $user, $isSuperAdmin)
    {
        switch ($type) {
            case 'inventory':
                return $this->getInventoryData($request, $user, $isSuperAdmin);
            case 'valuation':
                return $this->getValuationData($request, $user, $isSuperAdmin);
            case 'borrowings':
                return $this->getBorrowingsData($request, $user, $isSuperAdmin);
            case 'maintenance':
                return $this->getMaintenanceData($request, $user, $isSuperAdmin);
            case 'low-stock':
                return $this->getLowStockData($request, $user, $isSuperAdmin);
            case 'lifecycle':
                return $this->getLifecycleData($request, $user, $isSuperAdmin);
            default:
                return [];
        }
    }
    
    private function getInventoryData($request, $user, $isSuperAdmin)
    {
        $query = Asset::with(['category', 'department', 'serialNumbers']);
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhereNull('department_id');
            });
        }
        
        if ($request->has('category_id') && $request->category_id && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }
        
        if ($request->has('department_id') && $request->department_id && $request->department_id !== 'all') {
            $query->where('department_id', $request->department_id);
        }
        
        $assets = $query->get();
        
        return [
            'assets' => $assets,
            'summary' => [
                'total_assets' => $assets->count(),
                'total_quantity' => $assets->sum('quantity'),
                'total_value' => $assets->sum('current_value'),
                'available' => $assets->sum('quantity_available'),
                'in_use' => $assets->sum('quantity_in_use'),
                'maintenance' => $assets->sum('quantity_maintenance'),
            ],
        ];
    }
    
    private function getValuationData($request, $user, $isSuperAdmin)
    {
        $query = Asset::with(['category', 'department'])->whereNotNull('current_value');
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhereNull('department_id');
            });
        }
        
        if ($request->has('department_id') && $request->department_id && $request->department_id !== 'all') {
            $query->where('department_id', $request->department_id);
        }
        
        $assets = $query->get();
        
        return [
            'assets' => $assets,
            'summary' => [
                'total_current_value' => $assets->sum('current_value'),
                'total_purchase_value' => $assets->sum('purchase_price'),
                'depreciation' => $assets->sum('purchase_price') - $assets->sum('current_value'),
            ],
        ];
    }
    
    private function getBorrowingsData($request, $user, $isSuperAdmin)
    {
        $query = Borrowing::with(['asset', 'user', 'department', 'originDepartment']);
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhere('origin_department_id', $user->department_id);
            });
        }
        
        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('borrowed_at', '>=', $request->date_from);
        }
        
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('borrowed_at', '<=', $request->date_to);
        }
        
        $borrowings = $query->orderBy('borrowed_at', 'desc')->get();
        
        return [
            'borrowings' => $borrowings,
            'summary' => [
                'total' => $borrowings->count(),
                'active' => $borrowings->where('status', 'borrowed')->count(),
                'returned' => $borrowings->where('status', 'returned')->count(),
                'overdue' => $borrowings->where('status', 'overdue')->count(),
            ],
        ];
    }
    
    private function getMaintenanceData($request, $user, $isSuperAdmin)
    {
        $query = AssetSerialNumber::with(['asset.category', 'asset.department'])
            ->where('status', 'maintenance');
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->whereHas('asset', function($q) use ($user) {
                $q->where(function($subQ) use ($user) {
                    $subQ->where('department_id', $user->department_id)
                         ->orWhereNull('department_id');
                });
            });
        }
        
        $items = $query->get();
        
        return [
            'items' => $items,
            'summary' => [
                'total_in_maintenance' => $items->count(),
            ],
        ];
    }
    
    private function getLowStockData($request, $user, $isSuperAdmin)
    {
        $query = Asset::with(['category', 'department'])
            ->whereNotNull('min_quantity')
            ->whereRaw('quantity_available < min_quantity');
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhereNull('department_id');
            });
        }
        
        $assets = $query->get();
        
        return [
            'assets' => $assets,
            'summary' => [
                'total_low_stock' => $assets->count(),
                'critical' => $assets->filter(function($asset) {
                    return $asset->quantity_available == 0;
                })->count(),
            ],
        ];
    }
    
    private function getLifecycleData($request, $user, $isSuperAdmin)
    {
        $query = Asset::with(['category', 'department'])->whereNotNull('purchase_date');
        
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhereNull('department_id');
            });
        }
        
        $assets = $query->get();
        
        $expiringSoon = $assets->filter(function($asset) {
            return $asset->warranty_expiry_date && 
                   now()->diffInDays($asset->warranty_expiry_date, false) <= 30 &&
                   now()->diffInDays($asset->warranty_expiry_date, false) >= 0;
        });
        
        $needsRetirement = $assets->filter(function($asset) {
            return $asset->retirement_date && 
                   now()->diffInDays($asset->retirement_date, false) <= 90 &&
                   now()->diffInDays($asset->retirement_date, false) >= 0;
        });
        
        return [
            'warranty_expiring' => $expiringSoon->values(),
            'needs_retirement' => $needsRetirement->values(),
            'summary' => [
                'total_assets' => $assets->count(),
                'warranty_expiring_soon' => $expiringSoon->count(),
                'needs_retirement_soon' => $needsRetirement->count(),
            ],
        ];
    }
}
