<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComputerPeripheral extends Model
{
    use HasFactory;

    protected $fillable = [
        'computer_id',
        'asset_serial_number_id',
        'assigned_date',
        'notes',
    ];

    protected $casts = [
        'assigned_date' => 'date',
    ];

    public function computer(): BelongsTo
    {
        return $this->belongsTo(Computer::class);
    }

    public function assetSerialNumber(): BelongsTo
    {
        return $this->belongsTo(AssetSerialNumber::class);
    }
}
