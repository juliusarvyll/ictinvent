<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_serial_id',
        'computer_id',
        'action_type',
        'note',
    ];

    public function assetSerial(): BelongsTo
    {
        return $this->belongsTo(AssetSerialNumber::class, 'asset_serial_id');
    }

    public function computer(): BelongsTo
    {
        return $this->belongsTo(Computer::class);
    }
}
