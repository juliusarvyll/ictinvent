<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComputerPeripheralResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'computer_id' => $this->computer_id,
            'asset_serial_number_id' => $this->asset_serial_number_id,
            'asset_serial_number' => $this->whenLoaded('assetSerialNumber', function () {
                return [
                    'id' => $this->assetSerialNumber->id,
                    'serial_number' => $this->assetSerialNumber->serial_number,
                    'condition' => $this->assetSerialNumber->condition,
                    'asset' => [
                        'id' => $this->assetSerialNumber->asset->id ?? null,
                        'name' => $this->assetSerialNumber->asset->name ?? null,
                        'category' => $this->assetSerialNumber->asset->category->name ?? null,
                    ],
                ];
            }),
            'assigned_date' => $this->assigned_date,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
