<?php
/**
 * Test script to verify GROUP BY fixes
 * Run this with: php artisan tinker < test_groupby_fix.php
 */

echo "Testing GROUP BY fixes...\n";

try {
    // Test 1: Assets by Category (fixed query)
    echo "1. Testing Assets by Category...\n";
    $categoryResults = \App\Models\Asset::join('categories', 'assets.category_id', '=', 'categories.id')
        ->select('categories.name as category_name', DB::raw('SUM(assets.quantity) as count'))
        ->groupBy('categories.id', 'categories.name')
        ->orderByDesc('count')
        ->limit(5)
        ->get();
    echo "   ✓ Assets by Category query successful\n";
    
    // Test 2: Assets by Department (fixed query)
    echo "2. Testing Assets by Department...\n";
    $departmentResults = \App\Models\Asset::join('departments', 'assets.department_id', '=', 'departments.id')
        ->select('departments.name as department_name', DB::raw('SUM(assets.quantity) as count'))
        ->whereNotNull('assets.department_id')
        ->groupBy('departments.id', 'departments.name')
        ->orderByDesc('count')
        ->get();
    echo "   ✓ Assets by Department query successful\n";
    
    // Test 3: Asset Serial Numbers by Status
    echo "3. Testing Asset Serial Numbers by Status...\n";
    $statusResults = \App\Models\AssetSerialNumber::select('status', DB::raw('COUNT(*) as count'))
        ->groupBy('status')
        ->get();
    echo "   ✓ Asset Serial Numbers by Status query successful\n";
    
    // Test 4: Borrowings by Status
    echo "4. Testing Borrowings by Status...\n";
    $borrowingResults = \App\Models\Borrowing::select('status', DB::raw('COUNT(*) as count'))
        ->groupBy('status')
        ->get();
    echo "   ✓ Borrowings by Status query successful\n";
    
    echo "\n✅ All GROUP BY queries are working correctly!\n";
    echo "The quantity grouping errors should now be resolved.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}
