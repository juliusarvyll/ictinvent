<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComputerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hostname' => $this->hostname,
            'department_id' => $this->department_id,
            'department' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                ];
            }),
            'manufacturer' => $this->manufacturer,
            'model' => $this->model,
            'serial_number' => $this->serial_number,
            'os_name' => $this->os_name,
            'os_version' => $this->os_version,
            'os_build' => $this->os_build,
            'cpu_name' => $this->cpu_name,
            'cpu_cores_physical' => $this->cpu_cores_physical,
            'cpu_cores_logical' => $this->cpu_cores_logical,
            'cpu_speed_mhz' => $this->cpu_speed_mhz,
            'ram_gb' => $this->ram_gb,
            'disks' => $this->disks,
            'gpus' => $this->gpus,
            'installed_software' => $this->installed_software,
            'ip_address' => $this->ip_address,
            'mac_address' => $this->mac_address,
            'discovered_via' => $this->discovered_via,
            'last_seen' => $this->last_seen,
            'notes' => $this->notes,
            'asset_serial' => $this->whenLoaded('assetSerial', function () {
                return [
                    'id' => $this->assetSerial->id,
                    'serial_number' => $this->assetSerial->serial_number,
                    'asset_tag' => $this->assetSerial->asset_tag,
                    'asset_id' => $this->assetSerial->asset_id,
                    'asset_name' => $this->assetSerial->asset->name ?? null,
                    'condition' => $this->assetSerial->condition,
                    'assigned_to' => $this->assetSerial->assigned_to,
                ];
            }),
            'peripherals' => ComputerPeripheralResource::collection($this->whenLoaded('peripherals')),
            'borrowings' => BorrowingResource::collection($this->whenLoaded('borrowings')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
