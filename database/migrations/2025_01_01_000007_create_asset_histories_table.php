<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_histories', function (Blueprint $table) {
            $table->id();
            
            // Can track history for either asset serial or computer
            $table->foreignId('asset_serial_id')->nullable()->constrained('asset_serial_numbers')->onDelete('cascade');
            $table->foreignId('computer_id')->nullable()->constrained()->onDelete('cascade');
            
            $table->enum('action_type', ['created', 'updated', 'borrowed', 'returned', 'repaired', 'disposed']);
            $table->text('note')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_histories');
    }
};
