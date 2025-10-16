import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Settings, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Roles() {
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [managingRole, setManagingRole] = useState<any>(null);
  const [viewingRole, setViewingRole] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await api.get('/permissions');
      return response.data;
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: string[] }) =>
      api.post(`/roles/${roleId}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Permissions updated successfully');
      setPermissionDialogOpen(false);
      setManagingRole(null);
    },
  });

  const handleManagePermissions = (role: any) => {
    setManagingRole(role);
    setSelectedPermissions(role.permissions?.map((p: any) => p.name) || []);
    setPermissionDialogOpen(true);
  };

  const handlePermissionToggle = (permissionName: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleSavePermissions = () => {
    if (managingRole) {
      updatePermissionsMutation.mutate({
        roleId: managingRole.id,
        permissions: selectedPermissions,
      });
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

  const getRoleDescription = (roleName: string) => {
    const descriptions: Record<string, string> = {
      'Super Admin': 'Full system access - can do everything including user and role management',
      'Admin': 'System management - can manage all resources except users and roles',
      'IT Manager': 'IT operations management - manages IT assets and approves borrowings',
      'IT Staff': 'IT operations - day-to-day IT operations and asset management',
      'Department Head': 'Department management - manages department resources and approvals',
      'Employee': 'Basic user - can view and borrow items',
      'Auditor': 'Read-only compliance - full read access for auditing purposes',
    };
    return descriptions[roleName] || 'Custom role';
  };

  // Group permissions by category
  const groupedPermissions = permissions?.data?.reduce((acc: any, perm: any) => {
    const parts = perm.name.split(' ');
    const category = parts[parts.length - 1];
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage system roles and their permissions</p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Role</TableHead>
              <TableHead className="min-w-[300px]">Description</TableHead>
              <TableHead className="min-w-[120px]">Permissions</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : roles?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No roles found</TableCell>
              </TableRow>
            ) : (
              roles?.data?.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(role.name)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {role.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getRoleDescription(role.name)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {role.permissions_count} permissions
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setViewingRole(role);
                        setViewDialogOpen(true);
                      }}
                      title="View Permissions"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleManagePermissions(role)}
                      title="Manage Permissions"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Permissions Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              <Badge className={getRoleBadgeColor(viewingRole?.name || '')}>
                <Shield className="h-3 w-3 mr-1" />
                {viewingRole?.name}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {getRoleDescription(viewingRole?.name || '')}
            </DialogDescription>
          </DialogHeader>
          {viewingRole && (
            <div className="h-[500px] overflow-y-auto pr-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Total Permissions: {viewingRole.permissions?.length || 0}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {viewingRole.permissions?.map((permission: any) => (
                    <div key={permission.id} className="flex items-center gap-2 p-2 border rounded">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm">{permission.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Manage Permissions - {managingRole?.name}
            </DialogTitle>
            <DialogDescription>
              Select permissions for this role. Changes will affect all users with this role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                Selected: {selectedPermissions.length} / {permissions?.data?.length || 0}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPermissions(permissions?.data?.map((p: any) => p.name) || [])}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPermissions([])}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <Tabs defaultValue={Object.keys(groupedPermissions)[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                {Object.keys(groupedPermissions).slice(0, 8).map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="h-[400px] overflow-y-auto mt-4">
                {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => (
                  <TabsContent key={category} value={category} className="space-y-2">
                    <div className="grid gap-2">
                      {perms.map((permission: any) => (
                        <div
                          key={permission.id}
                          className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={selectedPermissions.includes(permission.name)}
                            onCheckedChange={() => handlePermissionToggle(permission.name)}
                          />
                          <label
                            htmlFor={`perm-${permission.id}`}
                            className="flex-1 cursor-pointer text-sm font-medium"
                          >
                            {permission.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setPermissionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePermissions} disabled={updatePermissionsMutation.isPending}>
                {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
