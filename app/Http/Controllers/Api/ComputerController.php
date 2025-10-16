<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ComputerResource;
use App\Http\Resources\ComputerPeripheralResource;
use App\Models\Computer;
use App\Models\ComputerPeripheral;
use App\Models\Asset;
use App\Models\AssetSerialNumber;
use App\Models\Category;
use App\Traits\LogsAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ComputerController extends Controller
{
    use LogsAudit;
    
    public function index(Request $request)
    {
        $query = Computer::query()->with(['assetSerial.asset', 'peripherals.assetSerialNumber.asset.category', 'department']);

        // For borrowing purposes, show computers from all departments
        // Only filter by department if specifically requested
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('hostname', 'like', '%' . $request->search . '%')
                  ->orWhere('ip_address', 'like', '%' . $request->search . '%')
                  ->orWhere('serial_number', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $computers = $query->paginate($request->get('per_page', 15));

        return ComputerResource::collection($computers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hostname' => 'required|string|unique:computers,hostname',
            'manufacturer' => 'nullable|string',
            'model' => 'nullable|string',
            'serial_number' => 'nullable|string',
            'os_name' => 'nullable|string',
            'os_version' => 'nullable|string',
            'os_build' => 'nullable|string',
            'cpu_name' => 'nullable|string',
            'cpu_cores_physical' => 'nullable|integer',
            'cpu_cores_logical' => 'nullable|integer',
            'cpu_speed_mhz' => 'nullable|integer',
            'ram_gb' => 'nullable|numeric',
            'disks' => 'nullable|array',
            'gpus' => 'nullable|array',
            'installed_software' => 'nullable|array',
            'ip_address' => 'nullable|string',
            'mac_address' => 'nullable|string',
            'discovered_via' => 'nullable|string',
            'last_seen' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $computer = Computer::create($validated);
        
        // Audit log
        $this->logCreated('computers', $computer);

        return new ComputerResource($computer);
    }

    public function show(Computer $computer)
    {
        return new ComputerResource($computer->load(['borrowings', 'assetSerial.asset', 'peripherals.assetSerialNumber.asset.category']));
    }

    public function update(Request $request, Computer $computer)
    {
        $validated = $request->validate([
            'hostname' => 'required|string|unique:computers,hostname,' . $computer->id,
            'manufacturer' => 'nullable|string',
            'model' => 'nullable|string',
            'serial_number' => 'nullable|string',
            'os_name' => 'nullable|string',
            'os_version' => 'nullable|string',
            'os_build' => 'nullable|string',
            'cpu_name' => 'nullable|string',
            'cpu_cores_physical' => 'nullable|integer',
            'cpu_cores_logical' => 'nullable|integer',
            'cpu_speed_mhz' => 'nullable|integer',
            'ram_gb' => 'nullable|numeric',
            'disks' => 'nullable|array',
            'gpus' => 'nullable|array',
            'installed_software' => 'nullable|array',
            'ip_address' => 'nullable|string',
            'mac_address' => 'nullable|string',
            'discovered_via' => 'nullable|string',
            'last_seen' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $originalData = $computer->toArray();
        $computer->update($validated);
        
        // Audit log
        if ($computer->wasChanged()) {
            $this->logUpdated('computers', $computer, $originalData);
        }

        return new ComputerResource($computer);
    }

    public function destroy(Computer $computer)
    {
        // Audit log before deletion
        $this->logDeleted('computers', $computer);
        
        $computer->delete();

        return response()->json(['message' => 'Computer deleted successfully']);
    }

    /**
     * Receive inventory data from Python client
     */
    public function receiveInventory(Request $request)
    {
        $validated = $request->validate([
            'hostname' => 'required|string',
            'manufacturer' => 'nullable|string',
            'model' => 'nullable|string',
            'serial_number' => 'nullable|string',
            'os' => 'nullable|string',
            'cpu' => 'nullable|string',
            'ram_gb' => 'nullable|numeric',
            'disks' => 'nullable|array',
            'disks.*.model' => 'nullable|string',
            'disks.*.size_gb' => 'nullable|numeric',
            'gpus' => 'nullable|array',
            'ip' => 'nullable|string',
            'installed_software' => 'nullable|array',
            'installed_software.*.name' => 'nullable|string',
            'installed_software.*.version' => 'nullable|string',
        ]);

        // Map the incoming JSON structure to database fields
        $computerData = [
            'hostname' => $validated['hostname'],
            'manufacturer' => $validated['manufacturer'] ?? null,
            'model' => $validated['model'] ?? null,
            'serial_number' => $validated['serial_number'] ?? null,
            'os_name' => $validated['os'] ?? null,
            'cpu_name' => $validated['cpu'] ?? null,
            'ram_gb' => $validated['ram_gb'] ?? null,
            'disks' => $validated['disks'] ?? null,
            'gpus' => $validated['gpus'] ?? null,
            'ip_address' => $validated['ip'] ?? null,
            'installed_software' => $validated['installed_software'] ?? null,
            'discovered_via' => 'python_client',
            'last_seen' => now(),
        ];

        // Update or create computer record
        $computer = Computer::updateOrCreate(
            ['hostname' => $validated['hostname']],
            $computerData
        );

        // Automatically create asset serial number if serial_number is provided
        if (!empty($validated['serial_number'])) {
            DB::transaction(function () use ($validated, $computer) {
                // Get or create "Computers" category
                $category = Category::firstOrCreate(
                    ['name' => 'Computers'],
                    ['description' => 'Computer hardware assets']
                );

                // Get or create "Computer" asset
                $asset = Asset::firstOrCreate(
                    [
                        'name' => 'Computer',
                        'category_id' => $category->id,
                    ],
                    [
                        'description' => 'Desktop/Laptop Computer',
                        'status' => 'available',
                    ]
                );

                // Create or update asset serial number
                AssetSerialNumber::updateOrCreate(
                    ['serial_number' => $validated['serial_number']],
                    [
                        'asset_id' => $asset->id,
                        'condition' => 'good',
                        'assigned_to' => $validated['hostname'] ?? null,
                        'notes' => sprintf(
                            'Auto-created from inventory scan. Hostname: %s, Model: %s %s',
                            $validated['hostname'],
                            $validated['manufacturer'] ?? 'Unknown',
                            $validated['model'] ?? ''
                        ),
                    ]
                );
            });
        }

        return response()->json([
            'message' => 'Computer inventory received successfully',
            'computer' => new ComputerResource($computer),
            'asset_serial_created' => !empty($validated['serial_number']),
        ], 200);
    }

    public function attachPeripheral(Request $request, Computer $computer)
    {
        $validated = $request->validate([
            'asset_serial_number_id' => 'required|exists:asset_serial_numbers,id',
            'assigned_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        // Check if already attached
        $exists = ComputerPeripheral::where('computer_id', $computer->id)
            ->where('asset_serial_number_id', $validated['asset_serial_number_id'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'This peripheral is already attached to this computer'], 422);
        }

        $peripheral = ComputerPeripheral::create([
            'computer_id' => $computer->id,
            'asset_serial_number_id' => $validated['asset_serial_number_id'],
            'assigned_date' => $validated['assigned_date'] ?? now(),
            'notes' => $validated['notes'] ?? null,
        ]);

        return new ComputerPeripheralResource($peripheral->load('assetSerialNumber.asset.category'));
    }

    public function detachPeripheral(Computer $computer, ComputerPeripheral $peripheral)
    {
        if ($peripheral->computer_id !== $computer->id) {
            return response()->json(['message' => 'Peripheral does not belong to this computer'], 404);
        }

        $peripheral->delete();

        return response()->json(['message' => 'Peripheral detached successfully']);
    }
}
