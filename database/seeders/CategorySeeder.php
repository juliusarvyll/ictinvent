<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Computers', 'description' => 'Desktop and laptop computers'],
            ['name' => 'Monitors', 'description' => 'Display monitors and screens'],
            ['name' => 'Keyboards', 'description' => 'Computer keyboards'],
            ['name' => 'Mice', 'description' => 'Computer mice and pointing devices'],
            ['name' => 'Headsets', 'description' => 'Audio headsets and headphones'],
            ['name' => 'Webcams', 'description' => 'Web cameras'],
            ['name' => 'Printers', 'description' => 'Printers and scanners'],
            ['name' => 'Network Equipment', 'description' => 'Routers, switches, and network devices'],
            ['name' => 'Storage Devices', 'description' => 'External hard drives and USB drives'],
            ['name' => 'Cables & Adapters', 'description' => 'Various cables and adapters'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
