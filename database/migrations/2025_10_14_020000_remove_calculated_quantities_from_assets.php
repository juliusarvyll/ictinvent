<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * These fields should be calculated from serial number statuses, not stored.
     */
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn([
                'quantity_available',
                'quantity_in_use',
                'quantity_maintenance',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->integer('quantity_available')->default(0)->after('quantity');
            $table->integer('quantity_in_use')->default(0)->after('quantity_available');
            $table->integer('quantity_maintenance')->default(0)->after('quantity_in_use');
        });
    }
};
