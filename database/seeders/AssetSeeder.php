<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $assets = [
            // Computers - IT Department
            ['category_id' => 1, 'department_id' => 1, 'name' => 'Computer', 'description' => 'Desktop/Laptop Computer', 'quantity' => 50],
            
            // Monitors - IT Department
            ['category_id' => 2, 'department_id' => 1, 'name' => 'Dell 24" Monitor', 'description' => 'Dell P2422H 24-inch Full HD Monitor', 'quantity' => 30],
            ['category_id' => 2, 'department_id' => 1, 'name' => 'LG 27" Monitor', 'description' => 'LG 27UK850-W 27-inch 4K Monitor', 'quantity' => 15],
            
            // Keyboards - IT Department
            ['category_id' => 3, 'department_id' => 1, 'name' => 'Logitech K120', 'description' => 'Logitech K120 Wired Keyboard', 'quantity' => 50],
            ['category_id' => 3, 'department_id' => 1, 'name' => 'Microsoft Ergonomic Keyboard', 'description' => 'Microsoft Ergonomic Keyboard', 'quantity' => 20],
            
            // Mice - IT Department
            ['category_id' => 4, 'department_id' => 1, 'name' => 'Logitech M185', 'description' => 'Logitech M185 Wireless Mouse', 'quantity' => 50],
            ['category_id' => 4, 'department_id' => 1, 'name' => 'Microsoft Bluetooth Mouse', 'description' => 'Microsoft Bluetooth Mouse', 'quantity' => 25],
            
            // Headsets - IT Department
            ['category_id' => 5, 'department_id' => 1, 'name' => 'Logitech H390', 'description' => 'Logitech H390 USB Headset', 'quantity' => 30],
            ['category_id' => 5, 'department_id' => 1, 'name' => 'Jabra Evolve 40', 'description' => 'Jabra Evolve 40 Stereo Headset', 'quantity' => 15],
            
            // Webcams - IT Department
            ['category_id' => 6, 'department_id' => 1, 'name' => 'Logitech C920', 'description' => 'Logitech C920 HD Pro Webcam', 'quantity' => 20],
            
            // Printers - Finance Department
            ['category_id' => 7, 'department_id' => 3, 'name' => 'HP LaserJet Pro', 'description' => 'HP LaserJet Pro M404dn', 'quantity' => 5],
            ['category_id' => 7, 'department_id' => 4, 'name' => 'Canon Pixma', 'description' => 'Canon Pixma G6020 Wireless Printer', 'quantity' => 3],
        ];

        foreach ($assets as $asset) {
            \App\Models\Asset::create($asset);
        }
    }
}
