<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Skip - borrower_name already exists in create_borrowings_table migration
        if (!Schema::hasColumn('borrowings', 'borrower_name')) {
            Schema::table('borrowings', function (Blueprint $table) {
                $table->string('borrower_name')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('borrowings', function (Blueprint $table) {
            $table->dropColumn('borrower_name');
        });
    }
};
