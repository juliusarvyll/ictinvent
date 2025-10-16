import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Eye, Scan, Hash, Monitor, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function AssetSerialNumbers() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [peripheralsOpen, setPeripheralsOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [stickerSize, setStickerSize] = useState('medium');
  const [viewing, setViewing] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [managingPeripherals, setManagingPeripherals] = useState<any>(null);
  const [newPeripheral, setNewPeripheral] = useState({ computer_id: '', notes: '' });
  const [formData, setFormData] = useState({
    asset_id: '',
    serial_number: '',
    condition: 'good',
    status: 'available',
    assigned_to: '',
    notes: '',
    last_maintenance_date: '',
    next_maintenance_date: ''
  });
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['asset-serial-numbers', search],
    queryFn: async () => {
      const response = await api.get('/asset-serial-numbers', { params: { search } });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/asset-serial-numbers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-serial-numbers'] });
      toast.success('Serial number created');
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/asset-serial-numbers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-serial-numbers'] });
      toast.success('Serial number updated');
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/asset-serial-numbers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-serial-numbers'] });
      toast.success('Serial number deleted');
    },
  });

  const { data: computers } = useQuery({
    queryKey: ['computers'],
    queryFn: async () => {
      const response = await api.get('/computers');
      return response.data;
    },
    enabled: peripheralsOpen,
  });

  const attachPeripheralMutation = useMutation({
    mutationFn: ({ computerId, data }: { computerId: number; data: any }) =>
      api.post(`/computers/${computerId}/peripherals`, data),
    onSuccess: async (response, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['asset-serial-numbers'] });

      if (managingPeripherals) {
        const updatedSerial = await api.get(`/asset-serial-numbers/${managingPeripherals.id}`);
        setManagingPeripherals(updatedSerial.data.data);
      }

      toast.success('Peripheral attached to computer');
      setNewPeripheral({ computer_id: '', notes: '' });
    },
  });

  const detachPeripheralMutation = useMutation({
    mutationFn: ({ computerId, peripheralId }: { computerId: number; peripheralId: number }) =>
      api.delete(`/computers/${computerId}/peripherals/${peripheralId}`),
    onSuccess: async (response, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['asset-serial-numbers'] });

      if (managingPeripherals) {
        const updatedSerial = await api.get(`/asset-serial-numbers/${managingPeripherals.id}`);
        setManagingPeripherals(updatedSerial.data.data);
      }

      toast.success('Peripheral detached from computer');
    },
  });

  const resetForm = () => {
    setFormData({
      asset_id: '',
      serial_number: '',
      condition: 'good',
      status: 'available',
      assigned_to: '',
      notes: '',
      last_maintenance_date: '',
      next_maintenance_date: ''
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
        <h1 className="text-3xl font-bold">Asset Serial Numbers</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStickerOpen(true)}>
            <Printer className="mr-2 h-4 w-4" />Export Stickers
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />Add Serial Number
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit' : 'Add'} Serial Number</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label>Asset *</Label>
                <Select value={formData.asset_id} onValueChange={(value) => setFormData({ ...formData, asset_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets?.data?.map((asset: any) => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>{asset.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Serial Number *</Label>
                <Input value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} required placeholder="e.g., SN123456" />
              </div>

              <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Asset tag will be auto-generated based on asset name (e.g., LAP-0001, LAP-0002)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Condition</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Assigned To</Label>
                <Input value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} placeholder="Person or department" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Last Maintenance</Label>
                  <Input type="date" value={formData.last_maintenance_date} onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })} />
                </div>
                <div>
                  <Label>Next Maintenance</Label>
                  <Input type="date" value={formData.next_maintenance_date} onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" rows={3} />
              </div>

              <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Input placeholder="Search serial numbers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Asset Tag</TableHead>
              <TableHead className="min-w-[150px]">Serial Number</TableHead>
              <TableHead className="min-w-[150px]">Asset</TableHead>
              <TableHead className="min-w-[100px] hidden sm:table-cell">Status</TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell">Condition</TableHead>
              <TableHead className="min-w-[150px] hidden lg:table-cell">Assigned To</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center">No serial numbers found</TableCell></TableRow>
            ) : (
              data?.data?.map((serial: any) => (
                <TableRow key={serial.id}>
                  <TableCell className="font-mono font-bold text-primary">{serial.asset_tag || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{serial.serial_number}</TableCell>
                  <TableCell>{serial.asset?.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={serial.status === 'available' ? 'default' : serial.status === 'in_use' ? 'secondary' : 'destructive'}>
                      {serial.status?.replace('_', ' ') || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell capitalize">{serial.condition || 'N/A'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{serial.assigned_to || 'Unassigned'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setViewing(serial); setViewOpen(true); }} title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {serial.asset?.category?.is_peripheral && (
                      <Button variant="ghost" size="icon" onClick={() => { setManagingPeripherals(serial); setPeripheralsOpen(true); }} title="Add to Computer">
                        <Monitor className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditing(serial);
                      setFormData({
                        asset_id: serial.asset_id.toString(),
                        serial_number: serial.serial_number,
                        condition: serial.condition || 'good',
                        status: serial.status || 'available',
                        assigned_to: serial.assigned_to || '',
                        notes: serial.notes || '',
                        last_maintenance_date: serial.last_maintenance_date || '',
                        next_maintenance_date: serial.next_maintenance_date || ''
                      });
                      setOpen(true);
                    }} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        toast.warning(`Delete serial number "${serial.serial_number}"?`, {
                          action: {
                            label: 'Delete',
                            onClick: () => deleteMutation.mutate(serial.id),
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
            <DialogTitle>Asset Serial Number Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-6">
              {/* Main Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Serial Number</Label>
                  <p className="text-lg font-medium">{viewing.serial_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Asset</Label>
                  <p className="font-medium">{viewing.asset?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={viewing.status === 'available' ? 'default' : viewing.status === 'in_use' ? 'secondary' : 'destructive'}>
                      {viewing.status?.replace('_', ' ') || 'N/A'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Condition</Label>
                  <p className="font-medium capitalize">{viewing.condition || 'N/A'}</p>
                </div>
              </div>

              {/* Asset Tag */}
              {viewing.asset_tag && (
                <div className="border-t pt-4">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Hash className="h-3 w-3" />
                      Asset Tag
                    </Label>
                    <p className="font-medium text-lg">{viewing.asset_tag}</p>
                  </div>
                </div>
              )}

              {/* Assignment & Maintenance */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Assignment & Maintenance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Assigned To</Label>
                    <p className="font-medium">{viewing.assigned_to || 'Unassigned'}</p>
                  </div>
                  {viewing.last_maintenance_date && (
                    <div>
                      <Label className="text-muted-foreground">Last Maintenance</Label>
                      <p className="font-medium">{viewing.last_maintenance_date}</p>
                    </div>
                  )}
                  {viewing.next_maintenance_date && (
                    <div>
                      <Label className="text-muted-foreground">Next Maintenance</Label>
                      <p className="font-medium">{viewing.next_maintenance_date}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {viewing.notes && (
                <div className="border-t pt-4">
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
            <DialogTitle>Add to Computer - {managingPeripherals?.serial_number}</DialogTitle>
          </DialogHeader>
          {managingPeripherals && (
            <div className="space-y-6">
              {/* Add to Computer */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <h3 className="font-semibold mb-3">Attach to Computer</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  attachPeripheralMutation.mutate({
                    computerId: parseInt(newPeripheral.computer_id),
                    data: {
                      asset_serial_number_id: managingPeripherals.id,
                      notes: newPeripheral.notes
                    }
                  });
                }} className="space-y-3">
                  <div>
                    <Label>Computer *</Label>
                    <Select
                      value={newPeripheral.computer_id}
                      onValueChange={(value) => setNewPeripheral({ ...newPeripheral, computer_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select computer" />
                      </SelectTrigger>
                      <SelectContent>
                        {computers?.data?.map((computer: any) => (
                          <SelectItem key={computer.id} value={computer.id.toString()}>
                            {computer.hostname} - {computer.manufacturer} {computer.model}
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
                    Attach to Computer
                  </Button>
                </form>
              </div>

              {/* Current Attachments */}
              <div>
                <h3 className="font-semibold mb-3">Currently Attached To</h3>
                {!managingPeripherals.computer_peripherals || managingPeripherals.computer_peripherals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Not attached to any computer</p>
                ) : (
                  <div className="space-y-2">
                    {managingPeripherals.computer_peripherals.map((peripheral: any) => (
                      <div key={peripheral.id} className="flex items-center justify-between rounded-lg border p-3 bg-background">
                        <div className="flex-1">
                          <p className="font-medium">{peripheral.computer?.hostname || 'Unknown'}</p>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span>Manufacturer: {peripheral.computer?.manufacturer || 'N/A'}</span>
                            <span className="mx-2">•</span>
                            <span>Model: {peripheral.computer?.model || 'N/A'}</span>
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
                          onClick={() => confirm('Detach from this computer?') && detachPeripheralMutation.mutate({
                            computerId: peripheral.computer_id,
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

      {/* Sticker Export Dialog */}
      <Dialog open={stickerOpen} onOpenChange={setStickerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Asset Tag Stickers</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Size Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Sticker Size</Label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setStickerSize('small')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    stickerSize === 'small' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">Small</div>
                    <div className="text-sm text-muted-foreground">2" × 1"</div>
                    <div className="text-xs text-muted-foreground mt-1">Compact labels</div>
                  </div>
                </button>
                <button
                  onClick={() => setStickerSize('medium')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    stickerSize === 'medium' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">Medium</div>
                    <div className="text-sm text-muted-foreground">3" × 2"</div>
                    <div className="text-xs text-muted-foreground mt-1">Standard size</div>
                  </div>
                </button>
                <button
                  onClick={() => setStickerSize('large')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    stickerSize === 'large' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">Large</div>
                    <div className="text-sm text-muted-foreground">4" × 3"</div>
                    <div className="text-xs text-muted-foreground mt-1">Extra visible</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Preview</Label>
              <div className="border rounded-lg p-6 bg-muted/30">
                <div className="flex flex-wrap gap-4 justify-center">
                  {data?.data?.slice(0, 6).map((serial: any) => (
                    <div
                      key={serial.id}
                      className={`border-2 border-dashed border-primary bg-white flex flex-col items-center justify-center p-3 ${
                        stickerSize === 'small' ? 'w-32 h-16' : stickerSize === 'medium' ? 'w-48 h-32' : 'w-64 h-48'
                      }`}
                    >
                      <div className={`font-mono font-bold ${stickerSize === 'small' ? 'text-xs' : stickerSize === 'medium' ? 'text-base' : 'text-2xl'}`}>
                        {serial.asset_tag || 'N/A'}
                      </div>
                      <div className={`text-muted-foreground text-center mt-1 ${stickerSize === 'small' ? 'text-[8px]' : stickerSize === 'medium' ? 'text-xs' : 'text-sm'}`}>
                        {serial.asset?.name}
                      </div>
                    </div>
                  ))}
                </div>
                {data?.data?.length > 6 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Showing 6 of {data.data.length} stickers
                  </p>
                )}
              </div>
            </div>

            {/* Print Button */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  
                  const sizeStyles = {
                    small: { width: '2in', height: '1in', fontSize: '10pt' },
                    medium: { width: '3in', height: '2in', fontSize: '14pt' },
                    large: { width: '4in', height: '3in', fontSize: '20pt' }
                  };
                  
                  const size = sizeStyles[stickerSize as keyof typeof sizeStyles];
                  
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Asset Tag Stickers</title>
                        <style>
                          @page { margin: 0.5in; }
                          body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 20px;
                          }
                          .sticker-grid {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 0.25in;
                          }
                          .sticker {
                            width: ${size.width};
                            height: ${size.height};
                            border: 2px solid #000;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            page-break-inside: avoid;
                            padding: 8px;
                            box-sizing: border-box;
                          }
                          .asset-tag {
                            font-family: 'Courier New', monospace;
                            font-weight: bold;
                            font-size: ${size.fontSize};
                            margin-bottom: 4px;
                          }
                          .asset-name {
                            font-size: ${parseInt(size.fontSize) * 0.6}pt;
                            color: #666;
                            text-align: center;
                          }
                          @media print {
                            body { padding: 0; }
                            .sticker { border: 1px solid #000; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="sticker-grid">
                          ${data?.data?.map((serial: any) => `
                            <div class="sticker">
                              <div class="asset-tag">${serial.asset_tag || 'N/A'}</div>
                              <div class="asset-name">${serial.asset?.name || ''}</div>
                            </div>
                          `).join('')}
                        </div>
                        <script>
                          window.onload = function() {
                            window.print();
                          };
                        </script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                className="flex-1"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print All Stickers ({data?.data?.length || 0})
              </Button>
              <Button variant="outline" onClick={() => setStickerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
