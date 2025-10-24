import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Eye, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: number;
  name: string;
  description: string;
  is_peripheral: boolean;
  department_id: number | null;
  department?: { id: number; name: string };
}

export default function Categories() {
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_peripheral: false, department_id: '' });
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['categories', search],
    queryFn: async () => {
      const response = await api.get('/categories', { params: { search } });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: () => toast.error('Failed to delete category'),
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', is_peripheral: false, department_id: '' });
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      description: category.description, 
      is_peripheral: category.is_peripheral || false,
      department_id: category.department_id?.toString() || ''
    });
    setOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    toast.warning(`Delete category "${name}"?`, {
      action: {
        label: 'Delete',
        onClick: () => deleteMutation.mutate(id),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              {isSuperAdmin() && (
                <div>
                  <Label htmlFor="department_id">Department (Optional)</Label>
                  <Select
                    value={formData.department_id || 'none'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department_id: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments?.data?.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_peripheral"
                  checked={formData.is_peripheral}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_peripheral: checked as boolean })
                  }
                />
                <Label htmlFor="is_peripheral" className="cursor-pointer">
                  Computer Peripheral (can be attached to computers)
                </Label>
              </div>
              <Button type="submit" className="w-full">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[200px] hidden md:table-cell">Description</TableHead>
              {isSuperAdmin() && (
                <TableHead className="min-w-[120px] hidden sm:table-cell">Department</TableHead>
              )}
              <TableHead className="min-w-[120px] hidden lg:table-cell">Type</TableHead>
              <TableHead className="text-right min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin() ? 5 : 4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin() ? 5 : 4} className="text-center">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((category: Category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{category.description}</TableCell>
                  {isSuperAdmin() && (
                    <TableCell className="hidden sm:table-cell">
                      {category.department ? (
                        <span className="text-sm">{category.department.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="hidden lg:table-cell">
                    {category.is_peripheral ? (
                      <Badge variant="secondary" className="gap-1">
                        <Monitor className="h-3 w-3" />
                        Peripheral
                      </Badge>
                    ) : (
                      <Badge variant="outline">Standard</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setViewing(category); setViewOpen(true); }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id, category.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-lg font-medium">{viewing.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 rounded-lg border p-3">{viewing.description || 'No description'}</p>
              </div>
              {isSuperAdmin() && (
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="mt-1">{viewing.department?.name || 'Not assigned'}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <div className="mt-1">
                  {viewing.is_peripheral ? (
                    <Badge variant="secondary" className="gap-1">
                      <Monitor className="h-3 w-3" />
                      Computer Peripheral
                    </Badge>
                  ) : (
                    <Badge variant="outline">Standard Asset</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
