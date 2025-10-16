<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AssetSerialNumberResource;
use App\Models\AssetSerialNumber;
use App\Models\Asset;
use App\Traits\LogsAudit;
use Illuminate\Http\Request;

class AssetSerialNumberController extends Controller
{
    use LogsAudit;

    public function index(Request $request)
    {
        $query = AssetSerialNumber::with(['asset.category', 'asset.department']);

        if ($request->has('search')) {
            $query->where('serial_number', 'like', '%' . $request->search . '%');
        }

        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        $serialNumbers = $query->paginate($request->get('per_page', 15));

        return AssetSerialNumberResource::collection($serialNumbers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'serial_number' => 'required|string|unique:asset_serial_numbers,serial_number',
            'condition' => 'nullable|string',
            'status' => 'nullable|in:available,in_use,maintenance,retired,disposed',
            'assigned_to' => 'nullable|string',
            'notes' => 'nullable|string',
            'last_maintenance_date' => 'nullable|date',
            'next_maintenance_date' => 'nullable|date',
        ]);

        // Get the asset for validation and auto-generation
        $asset = Asset::findOrFail($validated['asset_id']);

        // Auto-generate asset tag if not provided
        if (empty($validated['asset_tag'])) {
            $assetPrefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $asset->name), 0, 3));
            $count = AssetSerialNumber::where('asset_id', $validated['asset_id'])->count() + 1;
            $validated['asset_tag'] = $assetPrefix . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        }

        // Check if adding this serial number will exceed the asset quantity
        $currentCount = AssetSerialNumber::where('asset_id', $validated['asset_id'])->count();

        if ($currentCount >= $asset->quantity) {
            return response()->json([
                'message' => "Cannot add serial number. Asset '{$asset->name}' has a quantity of {$asset->quantity} but already has {$currentCount} serial numbers registered. Please update the asset quantity first or remove existing serial numbers.",
                'current_count' => $currentCount,
                'max_quantity' => $asset->quantity,
            ], 422);
        }

        $serialNumber = AssetSerialNumber::create($validated);
        
        // Audit log
        $this->logCreated('asset_serial_numbers', $serialNumber);

        return response()->json([
            'data' => new AssetSerialNumberResource($serialNumber->load('asset')),
        ], 201);
    }

    public function show(AssetSerialNumber $assetSerialNumber)
    {
        return new AssetSerialNumberResource($assetSerialNumber->load(['asset.category', 'borrowings', 'computerPeripherals.computer']));
    }

    public function update(Request $request, AssetSerialNumber $assetSerialNumber)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'serial_number' => 'required|string|unique:asset_serial_numbers,serial_number,' . $assetSerialNumber->id,
            'asset_tag' => 'nullable|string|unique:asset_serial_numbers,asset_tag,' . $assetSerialNumber->id,
            'condition' => 'nullable|string',
            'status' => 'nullable|in:available,in_use,maintenance,retired,disposed',
            'assigned_to' => 'nullable|string',
            'notes' => 'nullable|string',
            'last_maintenance_date' => 'nullable|date',
            'next_maintenance_date' => 'nullable|date',
        ]);

        // If asset_id changed, check if the new asset has capacity
        if ($validated['asset_id'] != $assetSerialNumber->asset_id) {
            $asset = Asset::findOrFail($validated['asset_id']);

            // Check if the new asset has capacity
            $currentCount = AssetSerialNumber::where('asset_id', $validated['asset_id'])->count();

            if ($currentCount >= $asset->quantity) {
                return response()->json([
                    'message' => "Cannot move serial number to '{$asset->name}'. This asset has a quantity of {$asset->quantity} but already has {$currentCount} serial numbers registered.",
                    'current_count' => $currentCount,
                    'max_quantity' => $asset->quantity,
                ], 422);
            }
        }

        $originalData = $assetSerialNumber->toArray();
        $assetSerialNumber->update($validated);
        
        // Audit log
        if ($assetSerialNumber->wasChanged()) {
            $this->logUpdated('asset_serial_numbers', $assetSerialNumber, $originalData);
        }

        return new AssetSerialNumberResource($assetSerialNumber->load('asset'));
    }

    public function destroy(AssetSerialNumber $assetSerialNumber)
    {
        // Audit log before deletion
        $this->logDeleted('asset_serial_numbers', $assetSerialNumber);
        
        $assetSerialNumber->delete();

        return response()->json(['message' => 'Serial number deleted successfully']);
    }
}
