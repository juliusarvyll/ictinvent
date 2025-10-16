<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetSerialNumberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'asset_id' => $this->asset_id,
            'asset' => new AssetResource($this->whenLoaded('asset')),
            'serial_number' => $this->serial_number,
            'asset_tag' => $this->asset_tag,
            'condition' => $this->condition,
            'status' => $this->status,
            'assigned_to' => $this->assigned_to,
            'notes' => $this->notes,
            'last_maintenance_date' => $this->last_maintenance_date?->format('Y-m-d'),
            'next_maintenance_date' => $this->next_maintenance_date?->format('Y-m-d'),
            'borrowings' => BorrowingResource::collection($this->whenLoaded('borrowings')),
            'computer_peripherals' => $this->whenLoaded('computerPeripherals', function () {
                return $this->computerPeripherals->map(function ($peripheral) {
                    return [
                        'id' => $peripheral->id,
                        'computer_id' => $peripheral->computer_id,
                        'computer' => $peripheral->computer ? [
                            'id' => $peripheral->computer->id,
                            'hostname' => $peripheral->computer->hostname,
                            'manufacturer' => $peripheral->computer->manufacturer,
                            'model' => $peripheral->computer->model,
                        ] : null,
                        'notes' => $peripheral->notes,
                        'assigned_date' => $peripheral->assigned_date?->format('Y-m-d'),
                    ];
                });
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
