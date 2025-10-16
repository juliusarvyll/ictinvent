<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\LogsAudit;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    use LogsAudit;
    /**
     * Get all roles with their permissions
     */
    public function index()
    {
        $roles = Role::with('permissions')->orderBy('name')->get();

        return response()->json([
            'data' => $roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'guard_name' => $role->guard_name,
                    'permissions' => $role->permissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                        ];
                    }),
                    'permissions_count' => $role->permissions->count(),
                ];
            }),
        ]);
    }

    /**
     * Get a specific role with permissions
     */
    public function show(Role $role)
    {
        $role->load('permissions');

        return response()->json([
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'permissions' => $role->permissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                    ];
                }),
                'permissions_count' => $role->permissions->count(),
            ],
        ]);
    }

    /**
     * Update role permissions
     */
    public function updatePermissions(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $oldPermissions = $role->permissions->pluck('name')->toArray();
        
        // Sync permissions (removes old permissions and assigns new ones)
        $role->syncPermissions($validated['permissions']);

        // Audit log
        $this->logAction('permissions_updated', 'roles', [
            'role_id' => $role->id,
            'role_name' => $role->name,
            'old_permissions' => $oldPermissions,
            'new_permissions' => $validated['permissions'],
        ]);

        $role->load('permissions');

        return response()->json([
            'message' => 'Permissions updated successfully',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                    ];
                }),
                'permissions_count' => $role->permissions->count(),
            ],
        ]);
    }

    /**
     * Get all available permissions
     */
    public function permissions()
    {
        $permissions = Permission::orderBy('name')->get();

        // Group permissions by category
        $grouped = [];
        foreach ($permissions as $permission) {
            // Extract category from permission name (e.g., "view assets" -> "assets")
            $parts = explode(' ', $permission->name);
            $category = end($parts);
            
            if (!isset($grouped[$category])) {
                $grouped[$category] = [];
            }
            
            $grouped[$category][] = [
                'id' => $permission->id,
                'name' => $permission->name,
            ];
        }

        return response()->json([
            'data' => $permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                ];
            }),
            'grouped' => $grouped,
        ]);
    }
}
