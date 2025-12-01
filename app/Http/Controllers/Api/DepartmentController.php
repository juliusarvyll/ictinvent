<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Traits\LogsAudit;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    use LogsAudit;
    
    /**
     * Public index method for inventory client (no authentication required)
     * Returns simple list of departments with id and name only
     */
    public function publicIndex()
    {
        $departments = Department::select('id', 'name')->orderBy('name')->get();
        
        return response()->json([
            'data' => $departments
        ]);
    }
    
    public function index(Request $request)
    {
        $query = Department::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $departments = $query->paginate($request->get('per_page', 15));

        return DepartmentResource::collection($departments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'description' => 'nullable|string',
        ]);

        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('logos', 'public');
            $validated['logo'] = '/storage/' . $logoPath;
        }

        $department = Department::create($validated);
        
        // Audit log
        $this->logCreated('departments', $department);

        return new DepartmentResource($department);
    }

    public function show(Department $department)
    {
        return new DepartmentResource($department);
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'description' => 'nullable|string',
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($department->logo) {
                $oldLogoPath = str_replace('/storage/', '', $department->logo);
                \Storage::disk('public')->delete($oldLogoPath);
            }
            
            $logoPath = $request->file('logo')->store('logos', 'public');
            $validated['logo'] = '/storage/' . $logoPath;
        }

        $originalData = $department->toArray();
        $department->update($validated);
        
        // Audit log
        if ($department->wasChanged()) {
            $this->logUpdated('departments', $department, $originalData);
        }

        return new DepartmentResource($department);
    }

    public function destroy(Department $department)
    {
        // Audit log before deletion
        $this->logDeleted('departments', $department);
        
        $department->delete();

        return response()->json(['message' => 'Department deleted successfully']);
    }
}
