<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ComputerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $computers = [
            [
                'hostname' => 'DESK-IT-001',
                'department_id' => 1, // IT Department
                'manufacturer' => 'Dell',
                'model' => 'OptiPlex 7090',
                'serial_number' => 'DELL-SN-001234',
                'os_name' => 'Windows',
                'os_version' => '11 Pro',
                'os_build' => '22000.1',
                'cpu_name' => 'Intel Core i7-11700',
                'cpu_cores_physical' => 8,
                'cpu_cores_logical' => 16,
                'cpu_speed_mhz' => 2500,
                'ram_gb' => 16,
                'disks' => json_encode([
                    ['model' => 'Samsung SSD 970 EVO Plus', 'size_gb' => 512]
                ]),
                'gpus' => json_encode(['Intel UHD Graphics 750']),
                'installed_software' => json_encode([
                    ['name' => 'Microsoft Office 365', 'version' => '16.0'],
                    ['name' => 'Google Chrome', 'version' => '120.0'],
                ]),
                'ip_address' => '192.168.1.101',
                'mac_address' => '00:1A:2B:3C:4D:01',
                'discovered_via' => 'manual',
                'last_seen' => now(),
                'notes' => 'IT Department workstation',
            ],
            [
                'hostname' => 'DESK-HR-001',
                'department_id' => 2, // HR Department
                'manufacturer' => 'HP',
                'model' => 'EliteDesk 800 G8',
                'serial_number' => 'HP-SN-002345',
                'os_name' => 'Windows',
                'os_version' => '11 Pro',
                'os_build' => '22000.1',
                'cpu_name' => 'Intel Core i5-11500',
                'cpu_cores_physical' => 6,
                'cpu_cores_logical' => 12,
                'cpu_speed_mhz' => 2700,
                'ram_gb' => 16,
                'disks' => json_encode([
                    ['model' => 'WD Blue SN570', 'size_gb' => 500]
                ]),
                'gpus' => json_encode(['Intel UHD Graphics 730']),
                'installed_software' => json_encode([
                    ['name' => 'Microsoft Office 365', 'version' => '16.0'],
                    ['name' => 'Zoom', 'version' => '5.16'],
                ]),
                'ip_address' => '192.168.1.102',
                'mac_address' => '00:1A:2B:3C:4D:02',
                'discovered_via' => 'manual',
                'last_seen' => now(),
                'notes' => 'HR Department workstation',
            ],
            [
                'hostname' => 'LAPTOP-SALES-001',
                'department_id' => 5, // Sales Department
                'manufacturer' => 'Lenovo',
                'model' => 'ThinkPad X1 Carbon Gen 9',
                'serial_number' => 'LEN-SN-003456',
                'os_name' => 'Windows',
                'os_version' => '11 Pro',
                'os_build' => '22000.1',
                'cpu_name' => 'Intel Core i7-1165G7',
                'cpu_cores_physical' => 4,
                'cpu_cores_logical' => 8,
                'cpu_speed_mhz' => 2800,
                'ram_gb' => 16,
                'disks' => json_encode([
                    ['model' => 'Samsung PM9A1', 'size_gb' => 512]
                ]),
                'gpus' => json_encode(['Intel Iris Xe Graphics']),
                'installed_software' => json_encode([
                    ['name' => 'Microsoft Office 365', 'version' => '16.0'],
                    ['name' => 'Salesforce', 'version' => '1.0'],
                ]),
                'ip_address' => '192.168.1.103',
                'mac_address' => '00:1A:2B:3C:4D:03',
                'discovered_via' => 'manual',
                'last_seen' => now(),
                'notes' => 'Sales team laptop',
            ],
        ];

        foreach ($computers as $computer) {
            \App\Models\Computer::create($computer);
        }
    }
}
