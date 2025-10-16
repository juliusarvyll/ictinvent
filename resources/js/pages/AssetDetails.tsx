import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Eye, ArrowLeft, Hash, Monitor, Scan, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AssetDetails() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewOpen, setViewOpen] = useState(false);
  const [peripheralsOpen, setPeripheralsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [stickerSize, setStickerSize] = useState('medium');
  const [viewing, setViewing] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [managingPeripherals, setManagingPeripherals] = useState<any>(null);
  const [newPeripheral, setNewPeripheral] = useState({ computer_id: '', notes: '' });
  const [formData, setFormData] = useState({
    asset_id: assetId || '',
    serial_number: '',
    condition: 'good',
    status: 'available',
    assigned_to: '',
    notes: '',
    last_maintenance_date: '',
    next_maintenance_date: ''
  });

  // Fetch asset details
  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const response = await api.get(`/assets/${assetId}`);
      return response.data.data;
    },
    enabled: !!assetId,
  });

  // Fetch serial numbers for this asset
  const { data: serialNumbers, isLoading: serialsLoading } = useQuery({
    queryKey: ['asset-serial-numbers', assetId],
    queryFn: async () => {
      const response = await api.get('/asset-serial-numbers', { params: { asset_id: assetId } });
      return response.data;
    },
    enabled: !!assetId,
  });

  const { data: computers } = useQuery({
    queryKey: ['computers'],
    queryFn: async () => {
      const response = await api.get('/computers');
      return response.data;
    },
    enabled: peripheralsOpen,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/asset-serial-numbers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-serial-numbers'] });
      toast.success('Serial number updated');
      setEditOpen(false);
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
      asset_id: assetId || '',
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
    }
  };

  if (assetLoading) {
    return <div className="p-6">Loading asset details...</div>;
  }

  if (!asset) {
    return <div className="p-6">Asset not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            <p className="text-muted-foreground">{asset.category?.name}</p>
          </div>
        </div>
      </div>

      {/* Asset Info Card */}
      <div className="rounded-lg border p-6 bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-muted-foreground">Total Quantity</Label>
            <p className="text-2xl font-bold">{asset.quantity}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Serial Numbers Registered</Label>
            <p className="text-2xl font-bold">{serialNumbers?.data?.length || 0}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <p className="text-sm">{asset.description || 'No description'}</p>
          </div>
        </div>
      </div>

      {/* Serial Numbers Table */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Serial Numbers</h2>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" onClick={() => navigate(`/assets/${asset.id}/bulk-scan`)}>
            <Scan className="mr-2 h-4 w-4" />Bulk Scan S/N
          </Button>
          <Button variant="outline" onClick={() => setStickerOpen(true)} disabled={!serialNumbers?.data?.length}>
            <Printer className="mr-2 h-4 w-4" />Export Stickers
          </Button>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Asset Tag</TableHead>
                <TableHead className="min-w-[150px]">Serial Number</TableHead>
                <TableHead className="min-w-[100px] hidden sm:table-cell">Status</TableHead>
                <TableHead className="min-w-[100px] hidden md:table-cell">Condition</TableHead>
                <TableHead className="min-w-[150px] hidden lg:table-cell">Assigned To</TableHead>
                <TableHead className="text-right min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serialsLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
              ) : serialNumbers?.data?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">No serial numbers found</TableCell></TableRow>
              ) : (
                serialNumbers?.data?.map((serial: any) => (
                  <TableRow key={serial.id}>
                    <TableCell className="font-mono font-bold text-primary">{serial.asset_tag || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{serial.serial_number}</TableCell>
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
                      {asset.category?.is_peripheral && (
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
                        setEditOpen(true);
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Serial Number</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <Label>Serial Number *</Label>
              <Input value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} required placeholder="e.g., SN123456" />
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

            <Button type="submit" className="w-full">Update</Button>
          </form>
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
            <DialogTitle>Export Asset Tag Stickers - {asset.name}</DialogTitle>
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
                  {serialNumbers?.data?.slice(0, 6).map((serial: any) => (
                    <div
                      key={serial.id}
                      className={`border-2 border-dashed border-primary bg-white flex flex-col items-center justify-center p-3 ${
                        stickerSize === 'small' ? 'w-32 h-16' : stickerSize === 'medium' ? 'w-48 h-32' : 'w-64 h-48'
                      }`}
                    >
                      {asset.department?.logo && (
                        <img 
                          src={asset.department.logo} 
                          alt="Department Logo" 
                          className={`object-contain mb-1 ${
                            stickerSize === 'small' ? 'max-w-[30px] max-h-[20px]' : 
                            stickerSize === 'medium' ? 'max-w-[40px] max-h-[30px]' : 
                            'max-w-[60px] max-h-[40px]'
                          }`}
                        />
                      )}
                      <div className={`font-mono font-bold ${stickerSize === 'small' ? 'text-xs' : stickerSize === 'medium' ? 'text-base' : 'text-2xl'}`}>
                        {serial.asset_tag || 'N/A'}
                      </div>
                      <div className={`text-muted-foreground text-center mt-1 ${stickerSize === 'small' ? 'text-[8px]' : stickerSize === 'medium' ? 'text-xs' : 'text-sm'}`}>
                        {asset.name}
                      </div>
                    </div>
                  ))}
                </div>
                {serialNumbers?.data?.length > 6 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Showing 6 of {serialNumbers.data.length} stickers
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
                  
                  const departmentLogo = asset.department?.logo || '';
                  
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Asset Tag Stickers - ${asset.name}</title>
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
                            position: relative;
                          }
                          .dept-logo {
                            max-width: ${stickerSize === 'small' ? '30px' : stickerSize === 'medium' ? '40px' : '60px'};
                            max-height: ${stickerSize === 'small' ? '20px' : stickerSize === 'medium' ? '30px' : '40px'};
                            margin-bottom: 4px;
                            object-fit: contain;
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
                          ${serialNumbers?.data?.map((serial: any) => `
                            <div class="sticker">
                              ${departmentLogo ? `<img src="${departmentLogo}" alt="Department Logo" class="dept-logo" />` : ''}
                              <div class="asset-tag">${serial.asset_tag || 'N/A'}</div>
                              <div class="asset-name">${asset.name}</div>
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
                Print All Stickers ({serialNumbers?.data?.length || 0})
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
