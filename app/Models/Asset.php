<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'department_id',
        'name',
        'description',
        'quantity',
        'min_quantity',
        'max_quantity',
        'purchase_price',
        'current_value',
        'depreciation_rate',
        'purchase_date',
        'expected_lifespan_months',
        'retirement_date',
        'warranty_expiry_date',
        'requires_license',
        'license_details',
        'requires_calibration',
        'last_calibration_date',
        'next_calibration_date',
        'calibration_interval_months',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'min_quantity' => 'integer',
        'max_quantity' => 'integer',
        'purchase_price' => 'decimal:2',
        'current_value' => 'decimal:2',
        'depreciation_rate' => 'decimal:2',
        'purchase_date' => 'date',
        'retirement_date' => 'date',
        'warranty_expiry_date' => 'date',
        'requires_license' => 'boolean',
        'requires_calibration' => 'boolean',
        'last_calibration_date' => 'date',
        'next_calibration_date' => 'date',
        'calibration_interval_months' => 'integer',
        'expected_lifespan_months' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function serialNumbers(): HasMany
    {
        return $this->hasMany(AssetSerialNumber::class);
    }

    /**
     * Get count of serial numbers by status
     */
    public function getQuantityByStatus(string $status): int
    {
        return $this->serialNumbers()->where('status', $status)->count();
    }

    /**
     * Get available quantity (serial numbers with 'available' status)
     */
    public function getQuantityAvailableAttribute(): int
    {
        return $this->getQuantityByStatus('available');
    }

    /**
     * Get in-use quantity (serial numbers with 'in_use' status)
     */
    public function getQuantityInUseAttribute(): int
    {
        return $this->getQuantityByStatus('in_use');
    }

    /**
     * Get maintenance quantity (serial numbers with 'maintenance' status)
     */
    public function getQuantityMaintenanceAttribute(): int
    {
        return $this->getQuantityByStatus('maintenance');
    }

    /**
     * Get retired quantity (serial numbers with 'retired' status)
     */
    public function getQuantityRetiredAttribute(): int
    {
        return $this->getQuantityByStatus('retired');
    }

    /**
     * Get disposed quantity (serial numbers with 'disposed' status)
     */
    public function getQuantityDisposedAttribute(): int
    {
        return $this->getQuantityByStatus('disposed');
    }

    /**
     * Check if asset quantity is below minimum threshold
     */
    public function isLowStock(): bool
    {
        if ($this->min_quantity === null) {
            return false;
        }
        return $this->quantity_available <= $this->min_quantity;
    }

    /**
     * Check if asset quantity exceeds maximum threshold
     */
    public function isOverStock(): bool
    {
        if ($this->max_quantity === null) {
            return false;
        }
        return $this->quantity >= $this->max_quantity;
    }

    /**
     * Calculate depreciated value based on purchase price and depreciation rate
     */
    public function calculateDepreciatedValue(): ?float
    {
        if (!$this->purchase_price || !$this->depreciation_rate || !$this->purchase_date) {
            return null;
        }

        $yearsSincePurchase = now()->diffInYears($this->purchase_date);
        $depreciationAmount = $this->purchase_price * ($this->depreciation_rate / 100) * $yearsSincePurchase;
        $depreciatedValue = max(0, $this->purchase_price - $depreciationAmount);

        return round($depreciatedValue, 2);
    }

    /**
     * Check if warranty is still valid
     */
    public function isUnderWarranty(): bool
    {
        if (!$this->warranty_expiry_date) {
            return false;
        }
        return now()->lte($this->warranty_expiry_date);
    }

    /**
     * Check if calibration is due
     */
    public function isCalibrationDue(): bool
    {
        if (!$this->requires_calibration || !$this->next_calibration_date) {
            return false;
        }
        return now()->gte($this->next_calibration_date);
    }

    /**
     * Check if asset is approaching retirement
     */
    public function isNearingRetirement(): bool
    {
        if (!$this->retirement_date) {
            return false;
        }
        // Alert if within 3 months of retirement
        return now()->diffInMonths($this->retirement_date, false) <= 3 && now()->lte($this->retirement_date);
    }
}
