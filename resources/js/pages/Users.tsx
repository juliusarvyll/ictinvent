import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Eye, Shield, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Users() {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department_id: '', roles: [] as string[] });
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const response = await api.get('/users', { params: { search } });
      return response.data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ userId, roles }: { userId: number; roles: string[] }) => 
      api.post(`/users/${userId}/roles`, { roles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Roles updated successfully');
      setRoleDialogOpen(false);
      setManagingUser(null);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', department_id: '', roles: [] });
    setEditing(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (editing && !submitData.password) {
      delete (submitData as any).password;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleManageRoles = (user: any) => {
    setManagingUser(user);
    setSelectedRoles(user.roles?.map((r: any) => r.name) || []);
    setRoleDialogOpen(true);
  };

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleName) 
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSaveRoles = () => {
    if (managingUser) {
      assignRolesMutation.mutate({ userId: managingUser.id, roles: selectedRoles });
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'Super Admin': 'bg-purple-500 text-white hover:bg-purple-600',
      'Admin': 'bg-red-500 text-white hover:bg-red-600',
      'IT Manager': 'bg-blue-500 text-white hover:bg-blue-600',
      'IT Staff': 'bg-cyan-500 text-white hover:bg-cyan-600',
      'Department Head': 'bg-green-500 text-white hover:bg-green-600',
      'Employee': 'bg-gray-500 text-white hover:bg-gray-600',
      'Auditor': 'bg-orange-500 text-white hover:bg-orange-600',
    };
    return colors[roleName] || 'bg-gray-500 text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit' : 'Add'} User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="department_id">Department</Label>
                <Select
                  value={formData.department_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments?.data?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Password {editing && '(leave blank to keep current)'}</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editing} />
              </div>
              <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[150px] hidden md:table-cell">Department</TableHead>
              <TableHead className="min-w-[200px] hidden lg:table-cell">Roles</TableHead>
              <TableHead className="text-right min-w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">No users found</TableCell></TableRow>
            ) : (
              data?.data?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.department ? (
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {user.department.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">No department</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.length > 0 ? (
                        user.roles.map((role: any) => (
                          <Badge key={role.id} className={getRoleBadgeColor(role.name)}>
                            {role.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setViewing(user); setViewOpen(true); }} title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleManageRoles(user)} title="Manage Roles">
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { 
                      setEditing(user); 
                      setFormData({ 
                        name: user.name, 
                        email: user.email, 
                        password: '', 
                        department_id: user.department_id?.toString() || '',
                        roles: user.roles?.map((r: any) => r.name) || []
                      }); 
                      setOpen(true); 
                    }} title="Edit User">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        toast.warning(`Delete user "${user.name}"?`, {
                          action: {
                            label: 'Delete',
                            onClick: () => deleteMutation.mutate(user.id),
                          },
                        });
                      }}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-lg font-medium">{viewing.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{viewing.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  {viewing.department ? (
                    <Badge variant="outline" className="gap-1 mt-1">
                      <Building2 className="h-3 w-3" />
                      {viewing.department.name}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">No department</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="text-sm text-muted-foreground">{viewing.created_at || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground mb-2 block">Assigned Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {viewing.roles?.length > 0 ? (
                    viewing.roles.map((role: any) => (
                      <Badge key={role.id} className={getRoleBadgeColor(role.name)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No roles assigned</p>
                  )}
                </div>
              </div>

              {viewing.roles?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Permissions Summary</Label>
                  <div className="bg-muted/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {viewing.roles.flatMap((role: any) => role.permissions || [])
                        .filter((perm: any, index: number, self: any[]) => 
                          self.findIndex(p => p.id === perm.id) === index
                        )
                        .slice(0, 20)
                        .map((permission: any) => (
                          <div key={permission.id} className="flex items-center gap-1">
                            <span className="text-green-600">✓</span>
                            <span>{permission.name}</span>
                          </div>
                        ))}
                    </div>
                    {viewing.roles.flatMap((role: any) => role.permissions || []).length > 20 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        And {viewing.roles.flatMap((role: any) => role.permissions || []).length - 20} more permissions...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Roles - {managingUser?.name}</DialogTitle>
            <DialogDescription>
              Assign or remove roles for this user. Each role comes with a predefined set of permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              {roles?.data?.map((role: any) => (
                <div key={role.id} className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.name)}
                    onCheckedChange={() => handleRoleToggle(role.name)}
                  />
                  <div className="flex-1">
                    <label htmlFor={`role-${role.id}`} className="cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getRoleBadgeColor(role.name)}>
                          {role.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {role.permissions?.length || 0} permissions
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.name === 'Super Admin' && 'Full system access - can do everything'}
                        {role.name === 'Admin' && 'Manage all resources except users and roles'}
                        {role.name === 'IT Manager' && 'IT operations management and borrowing approvals'}
                        {role.name === 'IT Staff' && 'Day-to-day IT operations'}
                        {role.name === 'Department Head' && 'Department management and approval authority'}
                        {role.name === 'Employee' && 'Basic user access - view and borrow items'}
                        {role.name === 'Auditor' && 'Read-only access for compliance and auditing'}
                      </p>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoles} disabled={assignRolesMutation.isPending}>
                {assignRolesMutation.isPending ? 'Saving...' : 'Save Roles'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
