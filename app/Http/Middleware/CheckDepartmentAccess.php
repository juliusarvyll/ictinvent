<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckDepartmentAccess
{
    /**
     * Handle an incoming request.
     * 
     * This middleware ensures users can only access resources from their own department
     * unless they have admin privileges.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();
        
        // Allow super admin or users with 'view all departments' permission to access everything
        if ($user->hasRole('super-admin') || $user->can('view all departments')) {
            return $next($request);
        }

        // If user doesn't have a department assigned, deny access
        if (!$user->department_id) {
            return response()->json([
                'message' => 'Access denied. You must be assigned to a department to access this resource.'
            ], 403);
        }

        // For API requests, we'll handle department filtering in the controller
        // This middleware just ensures the user has department access rights
        return $next($request);
    }
}
