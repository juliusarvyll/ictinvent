<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetSerialNumber extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'serial_number',
        'asset_tag',
        'condition',
        'status',
        'assigned_to',
        'notes',
        'last_maintenance_date',
        'next_maintenance_date',
    ];

    protected $casts = [
        'last_maintenance_date' => 'date',
        'next_maintenance_date' => 'date',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class, 'asset_serial_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(AssetHistory::class);
    }

    public function computerPeripherals(): HasMany
    {
        return $this->hasMany(ComputerPeripheral::class);
    }
}
