<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrowings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('borrower_name')->nullable();

            // Polymorphic relationship - can borrow either asset serial or computer
            $table->foreignId('asset_serial_id')->nullable()->constrained('asset_serial_numbers')->onDelete('cascade');
            $table->foreignId('computer_id')->nullable()->constrained()->onDelete('cascade');

            $table->date('borrow_date');
            $table->date('expected_return_date');
            $table->date('return_date')->nullable();
            $table->enum('status', ['borrowed', 'returned', 'lost'])->default('borrowed');
            $table->text('remarks')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('borrowings');
    }
};
