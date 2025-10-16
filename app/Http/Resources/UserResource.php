<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'department_id' => $this->department_id,
            'department' => $this->when($this->relationLoaded('department') && $this->department, [
                'id' => $this->department?->id,
                'name' => $this->department?->name,
                'code' => $this->department?->code,
            ]),
            'roles' => $this->when($this->relationLoaded('roles'), 
                $this->roles->map(function ($role) {
                    $roleData = [
                        'id' => $role->id,
                        'name' => $role->name,
                    ];
                    
                    // Check if permissions are loaded on the role
                    if ($role->relationLoaded('permissions')) {
                        $roleData['permissions'] = $role->permissions->map(function ($permission) {
                            return [
                                'id' => $permission->id,
                                'name' => $permission->name,
                            ];
                        })->toArray();
                    }
                    
                    return $roleData;
                })->toArray()
            ),
            'borrowings' => BorrowingResource::collection($this->whenLoaded('borrowings')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
