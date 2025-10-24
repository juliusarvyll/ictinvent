<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Traits\LogsAudit;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use LogsAudit;
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        $query = Category::query()->with('department');

        // Filter by department unless user is Super Admin
        if (!$isSuperAdmin && $user && $user->department_id) {
            $query->where(function($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhereNull('department_id'); // Include categories without department
            });
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $categories = $query->paginate($request->get('per_page', 15));

        return CategoryResource::collection($categories);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_peripheral' => 'boolean',
            'department_id' => 'nullable|exists:departments,id',
        ]);
        
        // Non-super admins must create categories for their own department
        if (!$isSuperAdmin && $user && $user->department_id) {
            $validated['department_id'] = $user->department_id;
        }

        $category = Category::create($validated);
        
        // Audit log
        $this->logCreated('categories', $category);

        return new CategoryResource($category);
    }

    public function show(Category $category)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        // Check if user has access to this category
        if (!$isSuperAdmin && $user && $user->department_id) {
            if ($category->department_id && $category->department_id !== $user->department_id) {
                abort(403, 'You do not have permission to view this category.');
            }
        }
        
        return new CategoryResource($category->load(['assets', 'department']));
    }

    public function update(Request $request, Category $category)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        // Check if user has access to update this category
        if (!$isSuperAdmin && $user && $user->department_id) {
            if ($category->department_id && $category->department_id !== $user->department_id) {
                abort(403, 'You do not have permission to update this category.');
            }
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_peripheral' => 'boolean',
            'department_id' => 'nullable|exists:departments,id',
        ]);
        
        // Non-super admins cannot change department_id or must set it to their own department
        if (!$isSuperAdmin && $user && $user->department_id) {
            $validated['department_id'] = $user->department_id;
        }

        $originalData = $category->toArray();
        $category->update($validated);
        
        // Audit log
        if ($category->wasChanged()) {
            $this->logUpdated('categories', $category, $originalData);
        }

        return new CategoryResource($category);
    }

    public function destroy(Category $category)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->hasRole('Super Admin');
        
        // Check if user has access to delete this category
        if (!$isSuperAdmin && $user && $user->department_id) {
            if ($category->department_id && $category->department_id !== $user->department_id) {
                abort(403, 'You do not have permission to delete this category.');
            }
        }
        
        // Audit log before deletion
        $this->logDeleted('categories', $category);
        
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
