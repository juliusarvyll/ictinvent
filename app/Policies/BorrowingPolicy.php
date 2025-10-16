<?php

namespace App\Policies;

use App\Models\Borrowing;
use App\Models\User;

class BorrowingPolicy
{
    /**
     * Determine if user can view any borrowings
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission([
            'view all borrowings',
            'view department borrowings',
            'view own borrowings'
        ]);
    }

    /**
     * Determine if user can view a specific borrowing
     */
    public function view(User $user, Borrowing $borrowing): bool
    {
        // Super Admin and Admin can view all
        if ($user->hasPermissionTo('view all borrowings')) {
            return true;
        }

        // Department borrowings - user's department matches borrowing department
        if ($user->hasPermissionTo('view department borrowings')) {
            return $user->department_id === $borrowing->department_id 
                || $user->department_id === $borrowing->origin_department_id;
        }

        // Own borrowings only
        if ($user->hasPermissionTo('view own borrowings')) {
            return $borrowing->user_id === $user->id;
        }

        return false;
    }

    /**
     * Determine if user can create borrowings
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create borrowings');
    }

    /**
     * Determine if user can create borrowings for others
     */
    public function createForOthers(User $user): bool
    {
        return $user->hasPermissionTo('create borrowings for others');
    }

    /**
     * Determine if user can update a borrowing
     */
    public function update(User $user, Borrowing $borrowing): bool
    {
        // Full edit permission
        if ($user->hasPermissionTo('edit borrowings')) {
            return true;
        }

        // Can edit own borrowings if status is pending
        if ($user->hasPermissionTo('edit own borrowings')) {
            return $borrowing->user_id === $user->id 
                && $borrowing->status === 'pending';
        }

        return false;
    }

    /**
     * Determine if user can delete a borrowing
     */
    public function delete(User $user, Borrowing $borrowing): bool
    {
        return $user->hasPermissionTo('delete borrowings');
    }

    /**
     * Determine if user can approve a borrowing request
     */
    public function approve(User $user, Borrowing $borrowing): bool
    {
        if (!$user->hasPermissionTo('approve borrowing requests')) {
            return false;
        }

        // Can only approve if status is pending
        if ($borrowing->status !== 'pending') {
            return false;
        }

        // Must be from the origin department (owner of the item)
        return $user->department_id === $borrowing->origin_department_id;
    }

    /**
     * Determine if user can reject a borrowing request
     */
    public function reject(User $user, Borrowing $borrowing): bool
    {
        if (!$user->hasPermissionTo('reject borrowing requests')) {
            return false;
        }

        // Can only reject if status is pending
        if ($borrowing->status !== 'pending') {
            return false;
        }

        // Must be from the origin department (owner of the item)
        return $user->department_id === $borrowing->origin_department_id;
    }

    /**
     * Determine if user can return a borrowed item
     */
    public function return(User $user, Borrowing $borrowing): bool
    {
        if (!$user->hasPermissionTo('return borrowed items')) {
            return false;
        }

        // Can only return if status is borrowed
        return $borrowing->status === 'borrowed';
    }

    /**
     * Determine if user can view borrowing history/audit
     */
    public function viewHistory(User $user, Borrowing $borrowing): bool
    {
        // Can view history if can view the borrowing
        if (!$this->view($user, $borrowing)) {
            return false;
        }

        return $user->hasPermissionTo('view borrowing history');
    }

    /**
     * Determine if user can export borrowings
     */
    public function export(User $user): bool
    {
        return $user->hasPermissionTo('export borrowings');
    }
}
