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
            ['name' => 'IT Department', 'description' => ''],
            ['name' => 'SITE Department', 'description' => ''],
            ['name' => 'SNAHS Department', 'description' => ''],
            ['name' => 'SBAHM Department', 'description' => ''],
            ['name' => 'Graduate School', 'description' => ''],
            ['name' => 'OSA', 'description' => ''],
            ['name' => 'CPRINT', 'description' => ''],
            ['name' => 'BEU Department', 'description' => ''],
            ['name' => 'SOM Department', 'description' => ''],
        ];

        foreach ($departments as $department) {
            \App\Models\Department::create($department);
        }
    }
}
