<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\LogsAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use LogsAudit;
    public function index(Request $request)
    {
        $query = User::with(['roles.permissions', 'department']);

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->paginate($request->get('per_page', 15));

        return UserResource::collection($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'department_id' => 'nullable|exists:departments,id',
            'roles' => 'nullable|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $roles = $validated['roles'] ?? [];
        unset($validated['roles']);

        $user = User::create($validated);
        
        if (!empty($roles)) {
            $user->assignRole($roles);
        }
        
        // Audit log
        $this->logCreated('users', $user);

        return new UserResource($user->load(['roles', 'department']));
    }

    public function show(User $user)
    {
        return new UserResource($user->load(['borrowings', 'roles.permissions', 'department']));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $originalData = $user->toArray();
        $user->update($validated);
        
        // Audit log
        if ($user->wasChanged()) {
            $this->logUpdated('users', $user, $originalData);
        }

        return new UserResource($user->load(['roles', 'department']));
    }

    public function destroy(User $user)
    {
        // Audit log before deletion
        $this->logDeleted('users', $user);
        
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Assign roles to a user
     */
    public function assignRoles(Request $request, User $user)
    {
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $oldRoles = $user->roles->pluck('name')->toArray();
        
        // Sync roles (removes old roles and assigns new ones)
        $user->syncRoles($validated['roles']);
        
        // Audit log
        $this->logAction('roles_updated', 'users', [
            'user_id' => $user->id,
            'old_roles' => $oldRoles,
            'new_roles' => $validated['roles'],
        ]);

        return new UserResource($user->load(['roles.permissions', 'department']));
    }
}
