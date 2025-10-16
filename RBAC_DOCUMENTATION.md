# Role-Based Access Control (RBAC) Documentation

## Overview
This system implements comprehensive Role-Based Access Control using Spatie Laravel Permission package.

## Roles Hierarchy

### 1. Super Admin
**Full System Access** - Can do everything including user and role management
- All permissions granted
- Typically assigned to system administrators

### 2. Admin
**System Management** - Can manage all resources except users and roles
- Full CRUD on assets, computers, categories, departments
- Full borrowing management including approvals
- Access to all analytics and reports
- View audit logs

### 3. IT Manager
**IT Operations Management** - Manages IT assets and approves borrowings
- Create and edit assets, computers, serial numbers
- Approve/reject borrowing requests
- View system analytics
- Access to reports and audit logs

### 4. IT Staff
**IT Operations** - Day-to-day IT operations
- Create assets and serial numbers
- Manage peripherals
- Process borrowing returns
- View department analytics

### 5. Department Head
**Department Management** - Manages department resources and borrowings
- View department assets
- Create borrowings for department members
- Approve borrowing requests from their department
- View department analytics

### 6. Employee
**Basic User** - Can view and borrow items
- View available assets and computers
- Create borrowing requests
- View own borrowings

### 7. Auditor
**Read-Only Compliance** - Full read access for auditing
- View all resources (read-only)
- Access to all audit logs
- Export reports and logs

---

## Permission Categories

### Asset Permissions
- `view assets` - View all assets
- `view own department assets` - View only department assets
- `create assets` - Create new assets
- `edit assets` - Edit any asset
- `edit own department assets` - Edit department assets only
- `delete assets` - Delete assets
- `bulk import assets` - Import assets from file
- `export assets` - Export asset data

### Serial Number Permissions
- `view serial numbers` - View serial numbers
- `create serial numbers` - Create serial numbers
- `edit serial numbers` - Edit serial numbers
- `delete serial numbers` - Delete serial numbers
- `bulk scan serial numbers` - Bulk scan feature
- `print asset tags` - Print asset tag stickers

### Computer Permissions
- `view computers` - View computers
- `create computers` - Create computers
- `edit computers` - Edit computers
- `delete computers` - Delete computers
- `manage peripherals` - Manage computer peripherals
- `view computer history` - View computer history

### Category Permissions
- `view categories` - View categories
- `create categories` - Create categories
- `edit categories` - Edit categories
- `delete categories` - Delete categories

### Department Permissions
- `view departments` - View all departments
- `view own department` - View own department only
- `create departments` - Create departments
- `edit departments` - Edit departments
- `delete departments` - Delete departments
- `manage department logo` - Upload/change department logo

### Borrowing Permissions
- `view all borrowings` - View all borrowing records
- `view own borrowings` - View only own borrowings
- `view department borrowings` - View department borrowings
- `create borrowings` - Create borrowing requests
- `create borrowings for others` - Create on behalf of others
- `edit borrowings` - Edit borrowing records
- `edit own borrowings` - Edit own borrowings only
- `delete borrowings` - Delete borrowing records
- `approve borrowing requests` - Approve pending requests
- `reject borrowing requests` - Reject pending requests
- `return borrowed items` - Process returns
- `view borrowing history` - View audit history
- `export borrowings` - Export borrowing data

### User Permissions
- `view users` - View users
- `create users` - Create users
- `edit users` - Edit users
- `delete users` - Delete users
- `manage roles` - Manage roles
- `assign roles` - Assign roles to users
- `view user activity` - View user activity logs

### Dashboard & Analytics
- `view dashboard` - Access dashboard
- `view analytics` - View analytics
- `view department analytics` - View department analytics
- `view system analytics` - View system-wide analytics

### Reports
- `view reports` - View reports
- `create reports` - Create custom reports
- `export reports` - Export reports
- `schedule reports` - Schedule automated reports

### Audit & Logs
- `view audit logs` - View system audit logs
- `view borrowing audit` - View borrowing audit trail
- `export audit logs` - Export audit logs

### System Settings
- `manage settings` - Manage system settings
- `manage notifications` - Configure notifications
- `manage integrations` - Manage integrations

---

## Usage in Controllers

### Check Single Permission
```php
if (auth()->user()->can('create assets')) {
    // User can create assets
}
```

### Check Multiple Permissions (OR)
```php
if (auth()->user()->hasAnyPermission(['edit assets', 'delete assets'])) {
    // User can edit OR delete
}
```

### Check Multiple Permissions (AND)
```php
if (auth()->user()->hasAllPermissions(['view assets', 'edit assets'])) {
    // User can view AND edit
}
```

### Check Role
```php
if (auth()->user()->hasRole('Super Admin')) {
    // User is Super Admin
}
```

### Middleware Protection
```php
// In routes
Route::middleware(['permission:create assets'])->group(function () {
    // Protected routes
});

// Multiple permissions (OR)
Route::middleware(['permission:edit assets|delete assets'])->group(function () {
    // Routes
});

// Role-based
Route::middleware(['role:Admin'])->group(function () {
    // Admin only routes
});
```

---

## Usage in Blade/Frontend

### Check Permission
```php
@can('create assets')
    <button>Create Asset</button>
@endcan
```

### Check Role
```php
@role('Admin')
    <div>Admin Panel</div>
@endrole
```

---

## Best Practices

1. **Principle of Least Privilege**: Assign minimum permissions needed
2. **Use Permissions, Not Roles**: Check permissions in code, not roles
3. **Department Scoping**: Use department-specific permissions where applicable
4. **Audit Trail**: All permission changes should be logged
5. **Regular Review**: Periodically review and update permissions

---

## Adding New Permissions

1. Add permission to seeder:
```php
'new permission name',
```

2. Assign to appropriate roles:
```php
$role->givePermissionTo('new permission name');
```

3. Run seeder:
```bash
php artisan db:seed --class=RolePermissionSeeder
```

4. Use in controller:
```php
$this->authorize('new permission name');
```

---

## Resetting Permissions

To reset all permissions and roles:
```bash
php artisan permission:cache-reset
php artisan db:seed --class=RolePermissionSeeder
```

---

## Security Notes

- Permissions are cached for performance
- Clear cache after permission changes
- Super Admin bypasses all permission checks
- Always validate user input even with permissions
- Use policies for complex authorization logic
