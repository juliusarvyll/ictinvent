<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Computer extends Model
{
    use HasFactory;

    protected $fillable = [
        'hostname',
        'department_id',
        'manufacturer',
        'model',
        'serial_number',
        'os_name',
        'os_version',
        'os_build',
        'cpu_name',
        'cpu_cores_physical',
        'cpu_cores_logical',
        'cpu_speed_mhz',
        'ram_gb',
        'disks',
        'gpus',
        'installed_software',
        'ip_address',
        'mac_address',
        'discovered_via',
        'last_seen',
        'notes',
    ];

    protected $casts = [
        'disks' => 'array',
        'gpus' => 'array',
        'installed_software' => 'array',
        'last_seen' => 'datetime',
        'ram_gb' => 'decimal:2',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(AssetHistory::class);
    }

    public function assetSerial(): HasOne
    {
        return $this->hasOne(AssetSerialNumber::class, 'serial_number', 'serial_number');
    }

    public function peripherals(): HasMany
    {
        return $this->hasMany(ComputerPeripheral::class);
    }
}
