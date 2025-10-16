<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            ['name' => 'IT Department', 'description' => 'Information Technology and Systems'],
            ['name' => 'Human Resources', 'description' => 'HR and Personnel Management'],
            ['name' => 'Finance', 'description' => 'Finance and Accounting'],
            ['name' => 'Marketing', 'description' => 'Marketing and Communications'],
            ['name' => 'Sales', 'description' => 'Sales and Business Development'],
            ['name' => 'Operations', 'description' => 'Operations and Logistics'],
            ['name' => 'Customer Support', 'description' => 'Customer Service and Support'],
            ['name' => 'Research & Development', 'description' => 'R&D and Innovation'],
        ];

        foreach ($departments as $department) {
            \App\Models\Department::create($department);
        }
    }
}
