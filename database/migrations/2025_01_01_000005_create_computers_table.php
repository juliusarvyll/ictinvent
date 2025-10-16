<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('computers', function (Blueprint $table) {
            $table->id();
            $table->string('hostname')->unique();
            $table->string('manufacturer')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            
            // Operating System
            $table->string('os_name')->nullable();
            $table->string('os_version')->nullable();
            $table->string('os_build')->nullable();
            
            // CPU
            $table->string('cpu_name')->nullable();
            $table->integer('cpu_cores_physical')->nullable();
            $table->integer('cpu_cores_logical')->nullable();
            $table->integer('cpu_speed_mhz')->nullable();
            
            // Memory & Storage
            $table->decimal('ram_gb', 8, 2)->nullable();
            $table->json('disks')->nullable(); // Array of disk devices
            $table->json('gpus')->nullable(); // Array of GPUs
            $table->json('installed_software')->nullable(); // Array of installed software
            
            // Network
            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();
            
            // Discovery metadata
            $table->string('discovered_via')->nullable();
            $table->timestamp('last_seen')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('computers');
    }
};
