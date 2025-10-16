<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Asset permissions
            'view assets',
            'view own department assets',
            'create assets',
            'edit assets',
            'edit own department assets',
            'delete assets',
            'bulk import assets',
            'export assets',
            
            // Asset Serial Number permissions
            'view serial numbers',
            'create serial numbers',
            'edit serial numbers',
            'delete serial numbers',
            'bulk scan serial numbers',
            'print asset tags',
            
            // Computer permissions
            'view computers',
            'create computers',
            'edit computers',
            'delete computers',
            'manage peripherals',
            'view computer history',
            
            // Category permissions
            'view categories',
            'create categories',
            'edit categories',
            'delete categories',
            
            // Department permissions
            'view departments',
            'view own department',
            'create departments',
            'edit departments',
            'delete departments',
            'manage department logo',
            
            // Borrowing permissions
            'view all borrowings',
            'view own borrowings',
            'view department borrowings',
            'create borrowings',
            'create borrowings for others',
            'edit borrowings',
            'edit own borrowings',
            'delete borrowings',
            'approve borrowing requests',
            'reject borrowing requests',
            'return borrowed items',
            'view borrowing history',
            'export borrowings',
            
            // User permissions
            'view users',
            'create users',
            'edit users',
            'delete users',
            'manage roles',
            'assign roles',
            'view user activity',
            
            // Dashboard & Analytics
            'view dashboard',
            'view analytics',
            'view department analytics',
            'view system analytics',
            
            // Reports
            'view reports',
            'create reports',
            'export reports',
            'schedule reports',
            
            // Audit & Logs
            'view audit logs',
            'view borrowing audit',
            'export audit logs',
            
            // System Settings
            'manage settings',
            'manage notifications',
            'manage integrations',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Super Admin - has all permissions
        $superAdmin = Role::create(['name' => 'Super Admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin - can manage everything except users and roles
        $admin = Role::create(['name' => 'Admin']);
        $admin->givePermissionTo([
            // Assets
            'view assets', 'create assets', 'edit assets', 'delete assets', 'bulk import assets', 'export assets',
            // Serial Numbers
            'view serial numbers', 'create serial numbers', 'edit serial numbers', 'delete serial numbers', 'bulk scan serial numbers', 'print asset tags',
            // Computers
            'view computers', 'create computers', 'edit computers', 'delete computers', 'manage peripherals', 'view computer history',
            // Categories
            'view categories', 'create categories', 'edit categories', 'delete categories',
            // Departments
            'view departments', 'create departments', 'edit departments', 'delete departments', 'manage department logo',
            // Borrowings
            'view all borrowings', 'create borrowings', 'create borrowings for others', 'edit borrowings', 'delete borrowings', 
            'approve borrowing requests', 'reject borrowing requests', 'return borrowed items', 'view borrowing history', 'export borrowings',
            // Dashboard & Reports
            'view dashboard', 'view analytics', 'view system analytics', 'view reports', 'create reports', 'export reports',
            // Audit
            'view audit logs', 'view borrowing audit', 'export audit logs',
        ]);

        // IT Manager - can manage assets, computers, and approve borrowings
        $itManager = Role::create(['name' => 'IT Manager']);
        $itManager->givePermissionTo([
            // Assets
            'view assets', 'create assets', 'edit assets', 'bulk import assets', 'export assets',
            // Serial Numbers
            'view serial numbers', 'create serial numbers', 'edit serial numbers', 'bulk scan serial numbers', 'print asset tags',
            // Computers
            'view computers', 'create computers', 'edit computers', 'manage peripherals', 'view computer history',
            // Categories & Departments
            'view categories', 'view departments',
            // Borrowings
            'view all borrowings', 'create borrowings', 'create borrowings for others', 'edit borrowings', 
            'approve borrowing requests', 'reject borrowing requests', 'return borrowed items', 'view borrowing history', 'export borrowings',
            // Dashboard & Reports
            'view dashboard', 'view analytics', 'view system analytics', 'view reports', 'export reports',
            // Audit
            'view audit logs', 'view borrowing audit',
        ]);

        // IT Staff - can view and create, limited editing
        $itStaff = Role::create(['name' => 'IT Staff']);
        $itStaff->givePermissionTo([
            // Assets
            'view assets', 'create assets', 'edit own department assets',
            // Serial Numbers
            'view serial numbers', 'create serial numbers', 'bulk scan serial numbers', 'print asset tags',
            // Computers
            'view computers', 'create computers', 'manage peripherals',
            // Categories & Departments
            'view categories', 'view departments',
            // Borrowings
            'view department borrowings', 'create borrowings', 'return borrowed items', 'view borrowing history',
            // Dashboard & Reports
            'view dashboard', 'view department analytics', 'view reports',
        ]);

        // Department Head - can view and borrow items for their department, approve requests
        $deptHead = Role::create(['name' => 'Department Head']);
        $deptHead->givePermissionTo([
            // Assets
            'view assets', 'view own department assets',
            // Serial Numbers
            'view serial numbers',
            // Computers
            'view computers',
            // Categories & Departments
            'view categories', 'view departments', 'view own department',
            // Borrowings
            'view department borrowings', 'create borrowings', 'create borrowings for others', 
            'approve borrowing requests', 'return borrowed items', 'view borrowing history',
            // Dashboard & Reports
            'view dashboard', 'view department analytics', 'view reports',
        ]);

        // Employee - basic user, can only view and borrow
        $employee = Role::create(['name' => 'Employee']);
        $employee->givePermissionTo([
            // Assets
            'view assets',
            // Computers
            'view computers',
            // Borrowings
            'view own borrowings', 'create borrowings',
            // Dashboard
            'view dashboard',
        ]);
        
        // Auditor - read-only access to everything for compliance
        $auditor = Role::create(['name' => 'Auditor']);
        $auditor->givePermissionTo([
            'view assets', 'view serial numbers', 'view computers', 'view categories', 'view departments',
            'view all borrowings', 'view borrowing history', 'view borrowing audit',
            'view dashboard', 'view analytics', 'view system analytics',
            'view reports', 'export reports', 'view audit logs', 'export audit logs',
        ]);

        // Assign roles to existing users
        $adminUser = User::where('email', 'admin@ictinvent.com')->first();
        if ($adminUser) {
            $adminUser->assignRole('Super Admin');
        }

        $testUser = User::where('email', 'test@example.com')->first();
        if ($testUser) {
            $testUser->assignRole('Employee');
        }

        $john = User::where('email', 'john@ictinvent.com')->first();
        if ($john) {
            $john->assignRole('IT Manager');
        }

        $jane = User::where('email', 'jane@ictinvent.com')->first();
        if ($jane) {
            $jane->assignRole('IT Staff');
        }

        $bob = User::where('email', 'bob@ictinvent.com')->first();
        if ($bob) {
            $bob->assignRole('Department Head');
        }

        $alice = User::where('email', 'alice@ictinvent.com')->first();
        if ($alice) {
            $alice->assignRole('Department Head');
        }

        $charlie = User::where('email', 'charlie@ictinvent.com')->first();
        if ($charlie) {
            $charlie->assignRole('Employee');
        }
    }
}
