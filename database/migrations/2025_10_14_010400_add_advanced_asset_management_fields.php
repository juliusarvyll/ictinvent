<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            // Quantity Tracking
            $table->integer('quantity_available')->default(0)->after('quantity');
            $table->integer('quantity_in_use')->default(0)->after('quantity_available');
            $table->integer('quantity_maintenance')->default(0)->after('quantity_in_use');
            
            // Min/Max Quantity for reorder alerts
            $table->integer('min_quantity')->nullable()->after('quantity_maintenance');
            $table->integer('max_quantity')->nullable()->after('min_quantity');
            
            // Financial Tracking
            $table->decimal('purchase_price', 12, 2)->nullable()->after('max_quantity');
            $table->decimal('current_value', 12, 2)->nullable()->after('purchase_price');
            $table->decimal('depreciation_rate', 5, 2)->nullable()->after('current_value')->comment('Annual depreciation percentage');
            $table->date('purchase_date')->nullable()->after('depreciation_rate');
            
            // Lifecycle Management
            $table->integer('expected_lifespan_months')->nullable()->after('purchase_date');
            $table->date('retirement_date')->nullable()->after('expected_lifespan_months');
            $table->date('warranty_expiry_date')->nullable()->after('retirement_date');
            
            // Compliance Fields
            $table->boolean('requires_license')->default(false)->after('warranty_expiry_date');
            $table->text('license_details')->nullable()->after('requires_license');
            $table->boolean('requires_calibration')->default(false)->after('license_details');
            $table->date('last_calibration_date')->nullable()->after('requires_calibration');
            $table->date('next_calibration_date')->nullable()->after('last_calibration_date');
            $table->integer('calibration_interval_months')->nullable()->after('next_calibration_date');
        });

        Schema::table('asset_serial_numbers', function (Blueprint $table) {
            // Asset Tag - Physical label/sticker number (auto-generated)
            $table->string('asset_tag')->nullable()->unique()->after('serial_number');
            
            // Enhanced status tracking
            $table->enum('status', ['available', 'in_use', 'maintenance', 'retired', 'disposed'])->default('available')->after('condition');
            $table->date('last_maintenance_date')->nullable()->after('status');
            $table->date('next_maintenance_date')->nullable()->after('last_maintenance_date');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn([
                'quantity_available',
                'quantity_in_use',
                'quantity_maintenance',
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
            ]);
        });

        Schema::table('asset_serial_numbers', function (Blueprint $table) {
            $table->dropColumn([
                'asset_tag',
                'status',
                'last_maintenance_date',
                'next_maintenance_date',
            ]);
        });
    }
};
