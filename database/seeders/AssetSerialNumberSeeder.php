<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AssetSerialNumberSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Keyboards - Logitech K120 - IT Department
        for ($i = 1; $i <= 10; $i++) {
            \App\Models\AssetSerialNumber::create([
                'asset_id' => 4, // Logitech K120
                'serial_number' => 'KB-LOG-K120-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'asset_tag' => 'LOG-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'condition' => 'good',
                'status' => $i <= 7 ? 'available' : 'in_use',
                'assigned_to' => $i > 7 ? 'Employee ' . ($i - 7) : null,
                'notes' => 'Logitech K120 Keyboard',
            ]);
        }

        // Mice - Logitech M185 - IT Department
        for ($i = 1; $i <= 10; $i++) {
            \App\Models\AssetSerialNumber::create([
                'asset_id' => 6, // Logitech M185
                'serial_number' => 'MS-LOG-M185-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'asset_tag' => 'LOG-' . str_pad($i + 10, 4, '0', STR_PAD_LEFT),
                'condition' => 'good',
                'status' => $i <= 8 ? 'available' : 'in_use',
                'assigned_to' => $i > 8 ? 'Employee ' . ($i - 8) : null,
                'notes' => 'Logitech M185 Wireless Mouse',
            ]);
        }

        // Monitors - Dell 24" - IT Department
        for ($i = 1; $i <= 8; $i++) {
            \App\Models\AssetSerialNumber::create([
                'asset_id' => 2, // Dell 24" Monitor
                'serial_number' => 'MON-DELL-24-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'asset_tag' => 'DEL-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'condition' => 'good',
                'status' => $i <= 5 ? 'available' : 'in_use',
                'assigned_to' => $i > 5 ? 'Workstation ' . ($i - 5) : null,
                'notes' => 'Dell P2422H 24-inch Monitor',
            ]);
        }

        // Headsets - Logitech H390 - IT Department
        for ($i = 1; $i <= 5; $i++) {
            \App\Models\AssetSerialNumber::create([
                'asset_id' => 8, // Logitech H390
                'serial_number' => 'HS-LOG-H390-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'asset_tag' => 'LOG-' . str_pad($i + 20, 4, '0', STR_PAD_LEFT),
                'condition' => 'good',
                'status' => $i <= 3 ? 'available' : ($i == 4 ? 'in_use' : 'maintenance'),
                'assigned_to' => $i == 4 ? 'Support Team' : null,
                'notes' => 'Logitech H390 USB Headset',
            ]);
        }

        // Webcams - Logitech C920 - IT Department
        for ($i = 1; $i <= 5; $i++) {
            \App\Models\AssetSerialNumber::create([
                'asset_id' => 10, // Logitech C920
                'serial_number' => 'WC-LOG-C920-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'asset_tag' => 'LOG-' . str_pad($i + 25, 4, '0', STR_PAD_LEFT),
                'condition' => 'good',
                'status' => 'available',
                'assigned_to' => null,
                'notes' => 'Logitech C920 HD Pro Webcam',
            ]);
        }
    }
}
