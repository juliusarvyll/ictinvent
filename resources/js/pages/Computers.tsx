import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Eye, Monitor } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Computers() {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [peripheralsOpen, setPeripheralsOpen] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [managingPeripherals, setManagingPeripherals] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [newPeripheral, setNewPeripheral] = useState({ asset_serial_number_id: '', notes: '' });
  const [formData, setFormData] = useState({
    hostname: '', manufacturer: '', model: '', serial_number: '',
    os_name: '', os_version: '', cpu_name: '', ram_gb: '',
    ip_address: '', mac_address: '', notes: ''
  });
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['computers', search],
    queryFn: async () => {
      const response = await api.get('/computers', { params: { search } });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/computers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computers'] });
      toast.success('Computer created');
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/computers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computers'] });
      toast.success('Computer updated');
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/computers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computers'] });
      toast.success('Computer deleted');
    },
  });

  const { data: availableSerials } = useQuery({
    queryKey: ['asset-serial-numbers-available'],
    queryFn: async () => {
      const response = await api.get('/asset-serial-numbers');
      return response.data;
    },
    enabled: peripheralsOpen,
  });

  const attachPeripheralMutation = useMutation({
    mutationFn: ({ computerId, data }: { computerId: number; data: any }) => 
      api.post(`/computers/${computerId}/peripherals`, data),
    onSuccess: async (response, variables) => {
      // Invalidate the computers list
      await queryClient.invalidateQueries({ queryKey: ['computers'] });
      
      // Refetch the specific computer to update the dialog
      if (managingPeripherals) {
        const updatedComputer = await api.get(`/computers/${variables.computerId}`);
        setManagingPeripherals(updatedComputer.data.data);
      }
      
      toast.success('Peripheral attached');
      setNewPeripheral({ asset_serial_number_id: '', notes: '' });
    },
  });

  const detachPeripheralMutation = useMutation({
    mutationFn: ({ computerId, peripheralId }: { computerId: number; peripheralId: number }) => 
      api.delete(`/computers/${computerId}/peripherals/${peripheralId}`),
    onSuccess: async (response, variables) => {
      // Invalidate the computers list
      await queryClient.invalidateQueries({ queryKey: ['computers'] });
      
      // Refetch the specific computer to update the dialog
      if (managingPeripherals) {
        const updatedComputer = await api.get(`/computers/${variables.computerId}`);
        setManagingPeripherals(updatedComputer.data.data);
      }
      
      toast.success('Peripheral detached');
    },
  });

  const resetForm = () => {
    setFormData({
      hostname: '', manufacturer: '', model: '', serial_number: '',
      os_name: '', os_version: '', cpu_name: '', ram_gb: '',
      ip_address: '', mac_address: '', notes: ''
    });
    setEditing(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Computers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />Add Computer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit' : 'Add'} Computer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hostname *</Label>
                  <Input value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })} required />
                </div>
                <div>
                  <Label>Manufacturer</Label>
                  <Input value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                </div>
                <div>
                  <Label>Serial Number</Label>
                  <Input value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} />
                </div>
                <div>
                  <Label>OS Name</Label>
                  <Input value={formData.os_name} onChange={(e) => setFormData({ ...formData, os_name: e.target.value })} />
                </div>
                <div>
                  <Label>OS Version</Label>
                  <Input value={formData.os_version} onChange={(e) => setFormData({ ...formData, os_version: e.target.value })} />
                </div>
                <div>
                  <Label>CPU Name</Label>
                  <Input value={formData.cpu_name} onChange={(e) => setFormData({ ...formData, cpu_name: e.target.value })} />
                </div>
                <div>
                  <Label>RAM (GB)</Label>
                  <Input type="number" step="0.01" value={formData.ram_gb} onChange={(e) => setFormData({ ...formData, ram_gb: e.target.value })} />
                </div>
                <div>
                  <Label>IP Address</Label>
                  <Input value={formData.ip_address} onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })} />
                </div>
                <div>
                  <Label>MAC Address</Label>
                  <Input value={formData.mac_address} onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Search computers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Hostname</TableHead>
              <TableHead className="min-w-[120px] hidden lg:table-cell">Manufacturer</TableHead>
              <TableHead className="min-w-[120px] hidden md:table-cell">Model</TableHead>
              <TableHead className="min-w-[150px] hidden xl:table-cell">CPU</TableHead>
              <TableHead className="min-w-[80px] hidden sm:table-cell">RAM</TableHead>
              <TableHead className="min-w-[150px] hidden lg:table-cell">OS</TableHead>
              <TableHead className="min-w-[120px] hidden md:table-cell">IP Address</TableHead>
              <TableHead className="text-right min-w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center">No computers found</TableCell></TableRow>
            ) : (
              data?.data?.map((computer: any) => (
                <TableRow key={computer.id}>
                  <TableCell className="font-medium">{computer.hostname}</TableCell>
                  <TableCell className="hidden lg:table-cell">{computer.manufacturer}</TableCell>
                  <TableCell className="hidden md:table-cell">{computer.model}</TableCell>
                  <TableCell className="text-sm hidden xl:table-cell">{computer.cpu_name ? computer.cpu_name.substring(0, 30) + (computer.cpu_name.length > 30 ? '...' : '') : 'N/A'}</TableCell>
                  <TableCell className="hidden sm:table-cell">{computer.ram_gb ? `${computer.ram_gb} GB` : 'N/A'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{computer.os_name} {computer.os_version}</TableCell>
                  <TableCell className="hidden md:table-cell">{computer.ip_address}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setViewing(computer); setViewOpen(true); }} title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setManagingPeripherals(computer); setPeripheralsOpen(true); }} title="Manage Peripherals">
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(computer); setFormData({ hostname: computer.hostname, manufacturer: computer.manufacturer || '', model: computer.model || '', serial_number: computer.serial_number || '', os_name: computer.os_name || '', os_version: computer.os_version || '', cpu_name: computer.cpu_name || '', ram_gb: computer.ram_gb || '', ip_address: computer.ip_address || '', mac_address: computer.mac_address || '', notes: computer.notes || '' }); setOpen(true); }} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        toast.warning(`Delete computer "${computer.computer_name}"?`, {
                          action: {
                            label: 'Delete',
                            onClick: () => deleteMutation.mutate(computer.id),
                          },
                        });
                      }}
                      title="Delete"
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Computer Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-6">
              {/* System Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">System Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Hostname</Label>
                    <p className="font-medium">{viewing.hostname}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Manufacturer</Label>
                    <p className="font-medium">{viewing.manufacturer || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Model</Label>
                    <p className="font-medium">{viewing.model || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Serial Number</Label>
                    <p className="font-medium">{viewing.serial_number || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Discovered Via</Label>
                    <p className="font-medium">{viewing.discovered_via || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Seen</Label>
                    <p className="font-medium">{viewing.last_seen || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Operating System */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Operating System</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">OS Name</Label>
                    <p className="font-medium">{viewing.os_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">OS Version</Label>
                    <p className="font-medium">{viewing.os_version || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">OS Build</Label>
                    <p className="font-medium">{viewing.os_build || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Hardware Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">CPU</Label>
                    <p className="font-medium">{viewing.cpu_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Physical Cores</Label>
                    <p className="font-medium">{viewing.cpu_cores_physical || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Logical Cores</Label>
                    <p className="font-medium">{viewing.cpu_cores_logical || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">CPU Speed</Label>
                    <p className="font-medium">{viewing.cpu_speed_mhz ? `${viewing.cpu_speed_mhz} MHz` : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">RAM</Label>
                    <p className="font-medium">{viewing.ram_gb ? `${viewing.ram_gb} GB` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Network Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Network Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">IP Address</Label>
                    <p className="font-medium">{viewing.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">MAC Address</Label>
                    <p className="font-medium">{viewing.mac_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Storage Devices */}
              {viewing.disks && Array.isArray(viewing.disks) && viewing.disks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Storage Devices ({viewing.disks.length})</h3>
                  <div className="space-y-2">
                    {viewing.disks.map((disk: any, idx: number) => (
                      <div key={idx} className="rounded-lg border p-3 bg-muted/30">
                        <p className="font-medium">{disk.model}</p>
                        <p className="text-sm text-muted-foreground">{disk.size_gb} GB</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Graphics Cards */}
              {viewing.gpus && Array.isArray(viewing.gpus) && viewing.gpus.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Graphics Cards ({viewing.gpus.length})</h3>
                  <div className="space-y-2">
                    {viewing.gpus.map((gpu: string, idx: number) => (
                      <div key={idx} className="rounded-lg border p-3 bg-muted/30">
                        <p className="font-medium">{gpu}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Installed Software */}
              {viewing.installed_software && Array.isArray(viewing.installed_software) && viewing.installed_software.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Installed Software ({viewing.installed_software.length})</h3>
                  <div className="max-h-60 overflow-y-auto space-y-1 rounded-lg border p-2 bg-muted/30">
                    {viewing.installed_software.map((software: any, idx: number) => (
                      <div key={idx} className="flex justify-between rounded border bg-background p-2 text-sm">
                        <span className="font-medium">{software.name}</span>
                        <span className="text-muted-foreground">{software.version}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Asset Serial Information */}
              {viewing.asset_serial && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Asset Registration</h3>
                  <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Asset Type</Label>
                        <p className="font-medium">{viewing.asset_serial.asset_name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Serial Number</Label>
                        <p className="font-medium">{viewing.asset_serial.serial_number}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Condition</Label>
                        <p className="font-medium capitalize">{viewing.asset_serial.condition}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Assigned To</Label>
                        <p className="font-medium">{viewing.asset_serial.assigned_to || 'Unassigned'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Peripherals */}
              {viewing.peripherals && viewing.peripherals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Attached Peripherals ({viewing.peripherals.length})</h3>
                  <div className="space-y-2">
                    {viewing.peripherals.map((peripheral: any) => (
                      <div key={peripheral.id} className="rounded-lg border p-3 bg-muted/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{peripheral.asset_serial_number?.asset?.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              S/N: {peripheral.asset_serial_number?.serial_number} • 
                              Category: {peripheral.asset_serial_number?.asset?.category || 'N/A'} •
                              Condition: {peripheral.asset_serial_number?.condition}
                            </p>
                            {peripheral.notes && (
                              <p className="text-sm text-muted-foreground mt-1">Notes: {peripheral.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewing.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1 rounded-lg border p-3">{viewing.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Peripherals Management Dialog */}
      <Dialog open={peripheralsOpen} onOpenChange={setPeripheralsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Peripherals - {managingPeripherals?.hostname}</DialogTitle>
          </DialogHeader>
          {managingPeripherals && (
            <div className="space-y-6">
              {/* Add New Peripheral */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <h3 className="font-semibold mb-3">Attach Peripheral</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  attachPeripheralMutation.mutate({
                    computerId: managingPeripherals.id,
                    data: newPeripheral
                  });
                }} className="space-y-3">
                  <div>
                    <Label>Asset Serial Number *</Label>
                    <Select 
                      value={newPeripheral.asset_serial_number_id} 
                      onValueChange={(value) => setNewPeripheral({ ...newPeripheral, asset_serial_number_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select peripheral" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSerials?.data?.map((serial: any) => (
                          <SelectItem key={serial.id} value={serial.id.toString()}>
                            {serial.asset?.name} - {serial.serial_number} ({serial.condition})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea 
                      value={newPeripheral.notes} 
                      onChange={(e) => setNewPeripheral({ ...newPeripheral, notes: e.target.value })} 
                      placeholder="Optional notes"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Attach Peripheral
                  </Button>
                </form>
              </div>

              {/* Existing Peripherals */}
              <div>
                <h3 className="font-semibold mb-3">Attached Peripherals ({managingPeripherals.peripherals?.length || 0})</h3>
                {!managingPeripherals.peripherals || managingPeripherals.peripherals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No peripherals attached yet</p>
                ) : (
                  <div className="space-y-2">
                    {managingPeripherals.peripherals.map((peripheral: any) => (
                      <div key={peripheral.id} className="flex items-center justify-between rounded-lg border p-3 bg-background">
                        <div className="flex-1">
                          <p className="font-medium">{peripheral.asset_serial_number?.asset?.name || 'Unknown'}</p>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span>S/N: {peripheral.asset_serial_number?.serial_number}</span>
                            <span className="mx-2">•</span>
                            <span>Category: {peripheral.asset_serial_number?.asset?.category || 'N/A'}</span>
                            <span className="mx-2">•</span>
                            <span>Condition: {peripheral.asset_serial_number?.condition}</span>
                            {peripheral.notes && (
                              <>
                                <br />
                                <span>Notes: {peripheral.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => confirm('Detach this peripheral?') && detachPeripheralMutation.mutate({ 
                            computerId: managingPeripherals.id, 
                            peripheralId: peripheral.id 
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
