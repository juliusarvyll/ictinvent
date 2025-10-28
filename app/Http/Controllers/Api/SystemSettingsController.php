<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SystemSettingsController extends Controller
{
    /**
     * Get all system settings (only for Super Admin)
     */
    public function index()
    {
        // Get all settings but mask encrypted values
        $settings = SystemSetting::all()->map(function ($setting) {
            return [
                'id' => $setting->id,
                'key' => $setting->key,
                'value' => $setting->is_encrypted ? '********' : $setting->value,
                'type' => $setting->type,
                'description' => $setting->description,
                'is_encrypted' => $setting->is_encrypted,
                'updated_at' => $setting->updated_at,
            ];
        });

        return response()->json($settings);
    }

    /**
     * Get a specific setting by key
     */
    public function show(string $key)
    {
        $setting = SystemSetting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'message' => 'Setting not found',
            ], 404);
        }

        return response()->json([
            'id' => $setting->id,
            'key' => $setting->key,
            'value' => $setting->is_encrypted ? '********' : $setting->value,
            'type' => $setting->type,
            'description' => $setting->description,
            'is_encrypted' => $setting->is_encrypted,
            'updated_at' => $setting->updated_at,
        ]);
    }

    /**
     * Update or create a system setting
     */
    public function update(Request $request, string $key)
    {
        $validated = $request->validate([
            'value' => 'required|string',
            'description' => 'nullable|string',
        ]);

        // Determine if this setting should be encrypted
        $encryptedKeys = ['groq_api_key', 'api_key', 'secret', 'password'];
        $shouldEncrypt = collect($encryptedKeys)->contains(fn($k) => str_contains(strtolower($key), $k));

        $setting = SystemSetting::set(
            $key,
            $validated['value'],
            'string',
            $shouldEncrypt,
            $validated['description'] ?? null
        );

        // Log the action
        Log::info('System setting updated', [
            'user_id' => auth()->id(),
            'key' => $key,
            'encrypted' => $shouldEncrypt,
        ]);

        return response()->json([
            'message' => 'Setting updated successfully',
            'setting' => [
                'id' => $setting->id,
                'key' => $setting->key,
                'value' => $setting->is_encrypted ? '********' : $setting->value,
                'type' => $setting->type,
                'description' => $setting->description,
                'is_encrypted' => $setting->is_encrypted,
                'updated_at' => $setting->updated_at,
            ],
        ]);
    }

    /**
     * Delete a system setting
     */
    public function destroy(string $key)
    {
        $setting = SystemSetting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'message' => 'Setting not found',
            ], 404);
        }

        $setting->delete();

        // Log the action
        Log::info('System setting deleted', [
            'user_id' => auth()->id(),
            'key' => $key,
        ]);

        return response()->json([
            'message' => 'Setting deleted successfully',
        ]);
    }

    /**
     * Test Groq API connection
     */
    public function testGroqConnection(Request $request)
    {
        $request->validate([
            'api_key' => 'required|string',
        ]);

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $request->api_key,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'meta-llama/llama-4-scout-17b-16e-instruct',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => 'Hello'
                    ]
                ],
                'max_tokens' => 10,
            ]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Groq API connection successful',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Groq API connection failed',
                'error' => $response->json()['error']['message'] ?? 'Unknown error',
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection test failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
