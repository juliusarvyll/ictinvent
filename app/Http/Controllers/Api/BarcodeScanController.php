<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BarcodeScanController extends Controller
{
    public function scanBarcode(Request $request)
    {
        $request->validate([
            'image' => 'required|string', // base64 encoded image
        ]);

        // Try to get API key from database first, then fall back to config
        $apiKey = SystemSetting::get('groq_api_key') ?? config('services.groq.api_key');

        if (!$apiKey) {
            return response()->json([
                'error' => 'Groq API key not configured. Please contact your administrator to set the API key in system settings.'
            ], 500);
        }

        try {
            $imageData = $request->input('image');

            // Call Groq Vision API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'meta-llama/llama-4-scout-17b-16e-instruct',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => 'Extract ONLY the barcode number, serial number, or any alphanumeric code visible in this image. Return ONLY the code itself, nothing else. If multiple codes are visible, return the most prominent one. If no code is visible, return "NONE".'
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => $imageData
                                ]
                            ]
                        ]
                    ]
                ],
                'temperature' => 0.1,
                'max_tokens' => 100,
            ]);

            if (!$response->successful()) {
                Log::error('Groq API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return response()->json([
                    'error' => 'Failed to process image with Groq API',
                    'details' => $response->json()
                ], $response->status());
            }

            $data = $response->json();
            $extractedText = $data['choices'][0]['message']['content'] ?? null;

            if (!$extractedText || trim($extractedText) === 'NONE') {
                return response()->json([
                    'success' => false,
                    'message' => 'No barcode detected in the image'
                ]);
            }

            // Clean up the extracted text
            $serialNumber = preg_replace('/\s+/', '', strtoupper(trim($extractedText)));

            return response()->json([
                'success' => true,
                'serial_number' => $serialNumber,
                'raw_text' => $extractedText
            ]);

        } catch (\Exception $e) {
            Log::error('Barcode scan error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'An error occurred while processing the image',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
