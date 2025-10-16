<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Borrowing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'borrower_name',
        'department_id',
        'origin_department_id',
        'asset_serial_id',
        'computer_id',
        'borrow_date',
        'expected_return_date',
        'return_date',
        'status',
        'remarks',
    ];

    protected $casts = [
        'borrow_date' => 'date',
        'expected_return_date' => 'date',
        'return_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function originDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'origin_department_id');
    }

    public function assetSerial(): BelongsTo
    {
        return $this->belongsTo(AssetSerialNumber::class, 'asset_serial_id');
    }

    public function computer(): BelongsTo
    {
        return $this->belongsTo(Computer::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(BorrowingHistory::class)->orderBy('created_at', 'desc');
    }

    // Helper to get the borrowed item (either asset or computer)
    public function getBorrowedItem()
    {
        return $this->asset_serial_id ? $this->assetSerial : $this->computer;
    }
}
