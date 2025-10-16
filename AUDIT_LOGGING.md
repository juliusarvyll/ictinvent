# Audit Logging System Documentation

## Overview
Comprehensive audit logging has been implemented across the entire system to track all user actions and changes.

---

## Architecture

### **LogsAudit Trait** (`app/Traits/LogsAudit.php`)
Reusable trait that provides audit logging methods for all controllers.

#### **Methods:**

1. **`logAudit()`** - Base method for logging
   ```php
   logAudit(string $action, string $module, ?array $oldValues, ?array $newValues, ?int $userId)
   ```

2. **`logCreated()`** - Log model creation
   ```php
   logCreated(string $module, Model $model)
   ```

3. **`logUpdated()`** - Log model updates with changes
   ```php
   logUpdated(string $module, Model $model, array $originalData)
   ```

4. **`logDeleted()`** - Log model deletion
   ```php
   logDeleted(string $module, Model $model)
   ```

5. **`logAction()`** - Log custom actions
   ```php
   logAction(string $action, string $module, ?array $data)
   ```

---

## Logged Actions

### **Borrowings Module**
- ✅ **created** - New borrowing request created
- ✅ **updated** - Borrowing details modified
- ✅ **deleted** - Borrowing record removed
- ✅ **returned** - Item returned
- ✅ **approved** - Request approved
- ✅ **rejected** - Request rejected

**Captured Data:**
- Old and new values for updates
- Return date and remarks
- Approval/rejection reasons
- User who performed the action
- Timestamp

### **Users Module**
- ✅ **created** - New user account created
- ✅ **updated** - User profile modified
- ✅ **deleted** - User account removed
- ✅ **roles_updated** - User roles changed

**Captured Data:**
- User details (name, email, department)
- Old and new roles
- Password changes (hashed, not plaintext)
- User who made the change

### **Roles Module**
- ✅ **permissions_updated** - Role permissions modified

**Captured Data:**
- Role name and ID
- Old permissions list
- New permissions list
- User who made the change

---

## Audit Log Structure

### **Database Table:** `audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `user_id` | bigint | User who performed the action |
| `action` | string | Action type (created, updated, deleted, etc.) |
| `module` | string | Module name (borrowings, users, roles, etc.) |
| `old_values` | json | Previous values before change |
| `new_values` | json | New values after change |
| `created_at` | timestamp | When the action occurred |
| `updated_at` | timestamp | Record update time |

---

## Usage Examples

### **In Controllers**

```php
use App\Traits\LogsAudit;

class MyController extends Controller
{
    use LogsAudit;
    
    public function store(Request $request)
    {
        $model = MyModel::create($validated);
        
        // Log creation
        $this->logCreated('my_module', $model);
        
        return response()->json($model);
    }
    
    public function update(Request $request, MyModel $model)
    {
        $originalData = $model->toArray();
        $model->update($validated);
        
        // Log update if changed
        if ($model->wasChanged()) {
            $this->logUpdated('my_module', $model, $originalData);
        }
        
        return response()->json($model);
    }
    
    public function customAction(MyModel $model)
    {
        // Perform action
        $model->doSomething();
        
        // Log custom action
        $this->logAction('custom_action', 'my_module', [
            'model_id' => $model->id,
            'details' => 'Action performed',
        ]);
    }
}
```

---

## Audit Log Queries

### **View All Logs**
```php
$logs = AuditLog::with('user')->latest()->get();
```

### **Filter by Module**
```php
$borrowingLogs = AuditLog::where('module', 'borrowings')->get();
```

### **Filter by Action**
```php
$deletions = AuditLog::where('action', 'deleted')->get();
```

### **Filter by User**
```php
$userActions = AuditLog::where('user_id', $userId)->get();
```

### **Filter by Date Range**
```php
$logs = AuditLog::whereBetween('created_at', [$startDate, $endDate])->get();
```

---

## Audit Trail Features

### **What's Logged:**
✅ Who performed the action (user_id)
✅ What action was performed (created, updated, deleted, etc.)
✅ Which module was affected (borrowings, users, roles, etc.)
✅ What changed (old_values vs new_values)
✅ When it happened (timestamps)

### **What's NOT Logged:**
❌ Passwords in plaintext (only hashed)
❌ Sensitive personal information
❌ Read-only operations (viewing data)
❌ Failed operations (only successful actions)

---

## Security Considerations

1. **User Attribution**: Every log entry is tied to the authenticated user
2. **Immutable Logs**: Audit logs cannot be edited, only created
3. **JSON Storage**: Old and new values stored as JSON for flexibility
4. **Timestamps**: Automatic timestamps for all entries
5. **Retention**: Consider implementing log rotation/archival for old logs

---

## Future Enhancements

### **Planned Features:**
- 🔄 Audit log viewing interface (admin panel)
- 🔄 Export audit logs to CSV/PDF
- 🔄 Real-time audit log notifications
- 🔄 Audit log search and filtering UI
- 🔄 Compliance reports generation
- 🔄 Log retention policies
- 🔄 Automated alerts for suspicious activities

---

## Compliance

This audit logging system helps meet compliance requirements for:
- **ISO 27001** - Information Security Management
- **SOC 2** - System and Organization Controls
- **GDPR** - Data protection and privacy
- **Internal Audits** - Track all system changes

---

## Viewing Audit Logs

### **Via Database**
```sql
SELECT 
    al.id,
    u.name as user_name,
    al.action,
    al.module,
    al.old_values,
    al.new_values,
    al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 100;
```

### **Via API** (Future)
```
GET /api/audit-logs
GET /api/audit-logs?module=borrowings
GET /api/audit-logs?action=deleted
GET /api/audit-logs?user_id=1
```

---

## Summary

✅ **Comprehensive Coverage**: All major actions logged
✅ **Easy to Use**: Simple trait-based implementation
✅ **Flexible**: Custom actions supported
✅ **Secure**: User attribution and immutable logs
✅ **Compliant**: Meets audit and compliance requirements
✅ **Scalable**: JSON storage for flexible data structures

**Every action in the system is now tracked and auditable!** 🎉
