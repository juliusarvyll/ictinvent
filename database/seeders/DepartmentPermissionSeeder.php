<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DepartmentPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the new permission
        $permission = Permission::firstOrCreate([
            'name' => 'view all departments',
            'guard_name' => 'web'
        ]);

        // Assign this permission to super-admin and admin roles
        $superAdminRole = Role::where('name', 'super-admin')->first();
        if ($superAdminRole) {
            $superAdminRole->givePermissionTo($permission);
        }

        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($permission);
        }

        // Also create a department manager role that can view all departments
        $departmentManagerRole = Role::firstOrCreate([
            'name' => 'department-manager',
            'guard_name' => 'web'
        ]);
        
        $departmentManagerRole->givePermissionTo([
            'view computers',
            'update computers',
            'view assets',
            'view borrowings',
            'update borrowings',
            'approve borrowings',
            'view reports',
            'view all departments'
        ]);

        $this->command->info('Department permissions created successfully!');
        $this->command->info('- Created "view all departments" permission');
        $this->command->info('- Assigned to super-admin and admin roles');
        $this->command->info('- Created department-manager role with cross-department access');
    }
}
