<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default system settings
        $settings = [
            [
                'key' => 'groq_api_key',
                'value' => env('GROQ_API_KEY', ''),
                'type' => 'string',
                'description' => 'Groq API key for barcode scanning and AI features',
                'is_encrypted' => true,
            ],
        ];

        foreach ($settings as $setting) {
            if ($setting['value']) {
                SystemSetting::set(
                    $setting['key'],
                    $setting['value'],
                    $setting['type'],
                    $setting['is_encrypted'],
                    $setting['description']
                );
            }
        }
    }
}
