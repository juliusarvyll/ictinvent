<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

trait LogsAudit
{
    /**
     * Log an audit entry
     */
    protected function logAudit(string $action, string $module, ?array $oldValues = null, ?array $newValues = null, ?int $userId = null): void
    {
        AuditLog::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'module' => $module,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }

    /**
     * Log model creation
     */
    protected function logCreated(string $module, Model $model): void
    {
        $this->logAudit(
            'created',
            $module,
            null,
            $model->toArray()
        );
    }

    /**
     * Log model update
     */
    protected function logUpdated(string $module, Model $model, array $originalData): void
    {
        $changes = [];
        $original = [];
        
        // Compare original data with current model data
        $currentData = $model->toArray();
        
        foreach ($currentData as $key => $newValue) {
            // Skip timestamps and compare values
            if (in_array($key, ['created_at', 'updated_at'])) {
                continue;
            }
            
            // Check if value changed
            if (array_key_exists($key, $originalData) && $originalData[$key] != $newValue) {
                $original[$key] = $originalData[$key];
                $changes[$key] = $newValue;
            }
        }

        if (!empty($changes)) {
            $this->logAudit(
                'updated',
                $module,
                $original,
                $changes
            );
        }
    }

    /**
     * Log model deletion
     */
    protected function logDeleted(string $module, Model $model): void
    {
        $this->logAudit(
            'deleted',
            $module,
            $model->toArray(),
            null
        );
    }

    /**
     * Log custom action
     */
    protected function logAction(string $action, string $module, ?array $data = null): void
    {
        $this->logAudit(
            $action,
            $module,
            null,
            $data
        );
    }
}
