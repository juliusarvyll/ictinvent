<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BorrowingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Calculate duration
        $borrowDate = $this->borrow_date;
        $returnDate = $this->return_date ?? now();
        $expectedReturnDate = $this->expected_return_date;
        
        // Use diffInDays with absolute=false and round to whole days
        $daysBorrowed = $borrowDate ? (int) round($borrowDate->diffInDays($returnDate, false)) : 0;
        $isOverdue = $this->status !== 'returned' && $expectedReturnDate && now()->isAfter($expectedReturnDate);
        $daysOverdue = $isOverdue ? (int) round(now()->diffInDays($expectedReturnDate, false)) : 0;

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'borrower_name' => $this->borrower_name,
            'department_id' => $this->department_id,
            'department' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                ];
            }),
            'origin_department_id' => $this->origin_department_id,
            'origin_department' => $this->whenLoaded('originDepartment', function () {
                return [
                    'id' => $this->originDepartment->id,
                    'name' => $this->originDepartment->name,
                ];
            }),
            'asset_serial_id' => $this->asset_serial_id,
            'asset_serial' => new AssetSerialNumberResource($this->whenLoaded('assetSerial')),
            'computer_id' => $this->computer_id,
            'computer' => new ComputerResource($this->whenLoaded('computer')),
            'borrow_date' => $this->borrow_date?->format('Y-m-d'),
            'expected_return_date' => $this->expected_return_date?->format('Y-m-d'),
            'return_date' => $this->return_date?->format('Y-m-d'),
            'status' => $this->status,
            'remarks' => $this->remarks,
            'days_borrowed' => $daysBorrowed,
            'is_overdue' => $isOverdue,
            'days_overdue' => $daysOverdue,
            'histories' => BorrowingHistoryResource::collection($this->whenLoaded('histories')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
