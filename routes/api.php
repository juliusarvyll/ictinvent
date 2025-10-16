<?php

use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AssetSerialNumberController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarcodeScanController;
use App\Http\Controllers\Api\BorrowingController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ComputerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Inventory endpoint (public for Python client to send data)
Route::post('/inventory/report', [ComputerController::class, 'receiveInventory']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard Analytics
    Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);

    // Barcode Scanning
    Route::post('/barcode/scan', [BarcodeScanController::class, 'scanBarcode']);

    // Categories - require view categories permission
    Route::apiResource('categories', CategoryController::class)->middleware('permission:view categories');

    // Departments - require view departments permission
    Route::apiResource('departments', DepartmentController::class)->middleware('permission:view departments');

    // Assets - require view assets permission
    Route::apiResource('assets', AssetController::class)->middleware('permission:view assets');

    // Asset Serial Numbers - require view assets permission
    Route::apiResource('asset-serial-numbers', AssetSerialNumberController::class)->middleware('permission:view assets');

    // Computers - require view computers permission
    Route::apiResource('computers', ComputerController::class)->middleware('permission:view computers');
    Route::post('/inventory/computers', [ComputerController::class, 'store']); // Special endpoint for hardware discovery
    Route::post('computers/{computer}/peripherals', [ComputerController::class, 'attachPeripheral'])->middleware('permission:update computers');
    Route::delete('computers/{computer}/peripherals/{peripheral}', [ComputerController::class, 'detachPeripheral'])->middleware('permission:update computers');

    // Borrowings - require view borrowings permission
    Route::apiResource('borrowings', BorrowingController::class)->middleware('permission:view borrowings');
    Route::post('borrowings/{borrowing}/return', [BorrowingController::class, 'returnItem'])->middleware('permission:update borrowings');
    Route::post('borrowings/{borrowing}/approve', [BorrowingController::class, 'approveRequest'])->middleware('permission:approve borrowings');
    Route::post('borrowings/{borrowing}/reject', [BorrowingController::class, 'rejectRequest'])->middleware('permission:approve borrowings');

    // Users - require view users permission
    Route::apiResource('users', UserController::class)->middleware('permission:view users');
    Route::post('users/{user}/roles', [UserController::class, 'assignRoles'])->middleware('permission:update users');
    
    // Roles - require view users permission (roles are part of user management)
    Route::get('roles', [RoleController::class, 'index'])->middleware('permission:view users');
    Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:view users');
    Route::post('roles/{role}/permissions', [RoleController::class, 'updatePermissions'])->middleware('permission:update users');
    
    // Permissions - require view users permission
    Route::get('permissions', [RoleController::class, 'permissions'])->middleware('permission:view users');
    
    // Audit Logs - require view logs permission
    Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('permission:view logs');
    Route::get('audit-logs/modules', [AuditLogController::class, 'modules'])->middleware('permission:view logs');
    Route::get('audit-logs/actions', [AuditLogController::class, 'actions'])->middleware('permission:view logs');
});
