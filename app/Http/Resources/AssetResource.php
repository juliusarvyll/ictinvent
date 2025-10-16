<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'department_id' => $this->department_id,
            'department' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                    'logo' => $this->department->logo,
                ];
            }),
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'quantity' => $this->quantity,
            'serial_numbers' => AssetSerialNumberResource::collection($this->whenLoaded('serialNumbers')),
            'serial_numbers_count' => $this->whenCounted('serialNumbers'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
