<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Call seeders in correct order - departments must be created first
        $this->call([
            CategorySeeder::class,
            DepartmentSeeder::class,
        ]);

        // Create admin user
        User::firstOrCreate(
            ['email' => 'admin@ictinvent.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create test user
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create additional users with departments
        $users = [
            ['name' => 'John Doe', 'email' => 'john@ictinvent.com', 'department_id' => 1], // IT Department
            ['name' => 'Jane Smith', 'email' => 'jane@ictinvent.com', 'department_id' => 1], // IT Department
            ['name' => 'Bob Johnson', 'email' => 'bob@ictinvent.com', 'department_id' => 2], // HR
            ['name' => 'Alice Williams', 'email' => 'alice@ictinvent.com', 'department_id' => 3], // Finance
            ['name' => 'Charlie Brown', 'email' => 'charlie@ictinvent.com', 'department_id' => 4], // Marketing
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'department_id' => $userData['department_id'],
                ]
            );
        }

        // Call remaining seeders
        $this->call([
            AssetSeeder::class,
            AssetSerialNumberSeeder::class,
            ComputerSeeder::class,
            RolePermissionSeeder::class,
        ]);
    }
}
