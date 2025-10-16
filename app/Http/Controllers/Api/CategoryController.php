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
        $query = Category::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $categories = $query->paginate($request->get('per_page', 15));

        return CategoryResource::collection($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_peripheral' => 'boolean',
        ]);

        $category = Category::create($validated);
        
        // Audit log
        $this->logCreated('categories', $category);

        return new CategoryResource($category);
    }

    public function show(Category $category)
    {
        return new CategoryResource($category->load('assets'));
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_peripheral' => 'boolean',
        ]);

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
        // Audit log before deletion
        $this->logDeleted('categories', $category);
        
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
