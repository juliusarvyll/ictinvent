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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Eye, Hash, Scan, AlertTriangle, DollarSign, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Asset {
  id: number;
  name: string;
  description: string;
  quantity: number;
  category_id: number;
  department_id: number | null;
  quantity_available: number;
  quantity_in_use: number;
  quantity_maintenance: number;
  min_quantity: number | null;
  max_quantity: number | null;
  purchase_price: number | null;
  current_value: number | null;
  depreciation_rate: number | null;
  purchase_date: string | null;
  expected_lifespan_months: number | null;
  retirement_date: string | null;
  warranty_expiry_date: string | null;
  requires_license: boolean;
  license_details: string | null;
  requires_calibration: boolean;
  last_calibration_date: string | null;
  next_calibration_date: string | null;
  calibration_interval_months: number | null;
  category?: { name: string };
  department?: { name: string };
  serial_numbers?: any[];
  serial_numbers_count?: number;
}

export default function Assets() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [serialsOpen, setSerialsOpen] = useState(false);
  const [viewing, setViewing] = useState<Asset | null>(null);
  const [managingSerials, setManagingSerials] = useState<Asset | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [newSerial, setNewSerial] = useState({
    serial_number: '',
    condition: 'good',
    status: 'available',
    assigned_to: '',
    notes: '',
    last_maintenance_date: '',
    next_maintenance_date: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '0',
    min_quantity: '',
    max_quantity: '',
    category_id: '',
    department_id: '',
    purchase_price: '',
    current_value: '',
    depreciation_rate: '',
    purchase_date: '',
    expected_lifespan_months: '',
    retirement_date: '',
    warranty_expiry_date: '',
    requires_license: false,
    license_details: '',
    requires_calibration: false,
    last_calibration_date: '',
    next_calibration_date: '',
    calibration_interval_months: '',
  });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('__all__');
  const [selectedDepartment, setSelectedDepartment] = useState('__all__');
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
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

  const { data, isLoading } = useQuery({
    queryKey: ['assets', search, selectedCategory, selectedDepartment],
    queryFn: async () => {
      const params: Record<string, any> = { search };
      if (selectedCategory !== '__all__') params.category_id = selectedCategory;
      if (selectedDepartment !== '__all__') params.department_id = selectedDepartment;
      const response = await api.get('/assets', { params });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset created');
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/assets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset updated');
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted');
    },
  });

  const { data: serialNumbers } = useQuery({
    queryKey: ['asset-serial-numbers', managingSerials?.id],
    queryFn: async () => {
      if (!managingSerials) return { data: [] };
      const response = await api.get(`/asset-serial-numbers?asset_id=${managingSerials.id}`);
      return response.data;
    },
    enabled: !!managingSerials,
  });

  const createSerialMutation = useMutation({
    mutationFn: (data: any) => api.post('/asset-serial-numbers', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['asset-serial-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      if (response.data.warning) {
        toast.warning(response.data.warning, {
          duration: 8000,
          action: {
            label: 'Update Quantity',
            onClick: () => {
              if (managingSerials) {
                setEditing(managingSerials);
                setFormData(assetToFormData(managingSerials));
                setSerialsOpen(false);
                setOpen(true);
              }
            },
          },
        });
      } else {
        toast.success('Serial number added');
      }

      setNewSerial({
        serial_number: '',
        condition: 'good',
        status: 'available',
        assigned_to: '',
        notes: '',
        last_maintenance_date: '',
        next_maintenance_date: ''
      });
    },
  });

  const deleteSerialMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/asset-serial-numbers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-serial-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Serial number deleted');
    },
  });

  const assetToFormData = (asset: Asset) => ({
    name: asset.name,
    description: asset.description,
    quantity: asset.quantity.toString(),
    min_quantity: asset.min_quantity?.toString() || '',
    max_quantity: asset.max_quantity?.toString() || '',
    category_id: asset.category_id.toString(),
    department_id: asset.department_id?.toString() || '',
    purchase_price: asset.purchase_price?.toString() || '',
    current_value: asset.current_value?.toString() || '',
    depreciation_rate: asset.depreciation_rate?.toString() || '',
    purchase_date: asset.purchase_date || '',
    expected_lifespan_months: asset.expected_lifespan_months?.toString() || '',
    retirement_date: asset.retirement_date || '',
    warranty_expiry_date: asset.warranty_expiry_date || '',
    requires_license: asset.requires_license || false,
    license_details: asset.license_details || '',
    requires_calibration: asset.requires_calibration || false,
    last_calibration_date: asset.last_calibration_date || '',
    next_calibration_date: asset.next_calibration_date || '',
    calibration_interval_months: asset.calibration_interval_months?.toString() || '',
  });

  // Patch: Set department_id automatically if departments are loaded
  const getInitialDepartmentId = () => {
    // Set to the first department if available, else blank
    return departments?.data && departments.data.length > 0
      ? departments.data[0].id.toString()
      : '';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: '0',
      min_quantity: '',
      max_quantity: '',
      category_id: '',
      department_id: getInitialDepartmentId(), // SET DEPARTMENT HERE
      purchase_price: '',
      current_value: '',
      depreciation_rate: '',
      purchase_date: '',
      expected_lifespan_months: '',
      retirement_date: '',
      warranty_expiry_date: '',
      requires_license: false,
      license_details: '',
      requires_calibration: false,
      last_calibration_date: '',
      next_calibration_date: '',
      calibration_interval_months: '',
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

  // Status is now tracked at serial number level, not asset level

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assets</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit' : 'Add'} Asset</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="quantity">Quantity</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.data?.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                  </div>
                </TabsContent>

                {/* Quantity Tracking Tab */}
                <TabsContent value="quantity" className="space-y-4">
                  <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950 mb-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Availability tracking is managed through serial number statuses.
                      Add serial numbers and set their status (available, in_use, maintenance, etc.) to track quantities automatically.
                    </p>
                  </div>

                  {editing && (
                    <div className="rounded-lg border p-4 bg-muted/30 mb-4">
                      <h4 className="font-semibold mb-3">Current Status Breakdown</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">Available</Label>
                          <p className="text-2xl font-bold text-green-600">{editing.quantity_available || 0}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">In Use</Label>
                          <p className="text-2xl font-bold text-blue-600">{editing.quantity_in_use || 0}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Maintenance</Label>
                          <p className="text-2xl font-bold text-yellow-600">{editing.quantity_maintenance || 0}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Calculated from {editing.serial_numbers_count || 0} serial number(s)
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Total Quantity *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum number of units for this asset
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Reorder Alerts
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Minimum Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.min_quantity}
                          onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                          placeholder="Alert when stock is low"
                        />
                      </div>
                      <div>
                        <Label>Maximum Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.max_quantity}
                          onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                          placeholder="Alert when overstocked"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Financial Tracking Tab */}
                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Purchase Price
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Current Value</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.current_value}
                        onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Depreciation Rate (%/year)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.depreciation_rate}
                        onChange={(e) => setFormData({ ...formData, depreciation_rate: e.target.value })}
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Purchase Date
                      </Label>
                      <Input
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Lifecycle Management</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Expected Lifespan (months)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.expected_lifespan_months}
                          onChange={(e) => setFormData({ ...formData, expected_lifespan_months: e.target.value })}
                          placeholder="e.g., 36"
                        />
                      </div>
                      <div>
                        <Label>Retirement Date</Label>
                        <Input
                          type="date"
                          value={formData.retirement_date}
                          onChange={(e) => setFormData({ ...formData, retirement_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Warranty Expiry Date</Label>
                        <Input
                          type="date"
                          value={formData.warranty_expiry_date}
                          onChange={(e) => setFormData({ ...formData, warranty_expiry_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Compliance Tab */}
                <TabsContent value="compliance" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requires_license"
                        checked={formData.requires_license}
                        onChange={(e) => setFormData({ ...formData, requires_license: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="requires_license" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="h-4 w-4" />
                        Requires License
                      </Label>
                    </div>

                    {formData.requires_license && (
                      <div>
                        <Label>License Details</Label>
                        <Textarea
                          value={formData.license_details}
                          onChange={(e) => setFormData({ ...formData, license_details: e.target.value })}
                          placeholder="License type, number, restrictions, etc."
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requires_calibration"
                        checked={formData.requires_calibration}
                        onChange={(e) => setFormData({ ...formData, requires_calibration: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="requires_calibration" className="cursor-pointer">
                        Requires Calibration
                      </Label>
                    </div>

                    {formData.requires_calibration && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Last Calibration Date</Label>
                          <Input
                            type="date"
                            value={formData.last_calibration_date}
                            onChange={(e) => setFormData({ ...formData, last_calibration_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Next Calibration Date</Label>
                          <Input
                            type="date"
                            value={formData.next_calibration_date}
                            onChange={(e) => setFormData({ ...formData, next_calibration_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Calibration Interval (months)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.calibration_interval_months}
                            onChange={(e) => setFormData({ ...formData, calibration_interval_months: e.target.value })}
                            placeholder="e.g., 12"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="border-t pt-4">
                <Button type="submit" className="w-full">{editing ? 'Update Asset' : 'Create Asset'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-4 my-2">
        <Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories?.data?.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Departments</SelectItem>
            {departments?.data?.map((dept: any) => (
              <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(selectedCategory !== '__all__' || selectedDepartment !== '__all__' || search) && (
          <Button variant="ghost" onClick={() => { setSelectedCategory('__all__'); setSelectedDepartment('__all__'); setSearch(''); }}>
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[120px] hidden sm:table-cell">Category</TableHead>
              <TableHead className="min-w-[120px]">Quantity</TableHead>
              <TableHead className="min-w-[100px] hidden lg:table-cell">Alerts</TableHead>
              <TableHead className="min-w-[200px] hidden md:table-cell">Description</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center">No assets found</TableCell></TableRow>
            ) : (
              data?.data?.map((asset: Asset) => {
                const isLowStock = asset.min_quantity && asset.quantity_available <= asset.min_quantity;
                const isOverStock = asset.max_quantity && asset.quantity >= asset.max_quantity;
                const warrantyExpired = asset.warranty_expiry_date && new Date(asset.warranty_expiry_date) < new Date();
                const calibrationDue = asset.next_calibration_date && new Date(asset.next_calibration_date) <= new Date();

                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {asset.name}
                        {(isLowStock || isOverStock) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{asset.category?.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">Total: {asset.quantity}</div>
                        {(asset.quantity_available > 0 || asset.quantity_in_use > 0 || asset.quantity_maintenance > 0) && (
                          <div className="text-xs text-muted-foreground">
                            <div>Avail: {asset.quantity_available || 0}</div>
                            {asset.quantity_in_use > 0 && <div>In Use: {asset.quantity_in_use}</div>}
                            {asset.quantity_maintenance > 0 && <div>Maint: {asset.quantity_maintenance}</div>}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col gap-1">
                        {isLowStock && (
                          <Badge variant="destructive" className="text-xs">
                            Low Stock
                          </Badge>
                        )}
                        {isOverStock && (
                          <Badge variant="secondary" className="text-xs">
                            Overstock
                          </Badge>
                        )}
                        {warrantyExpired && (
                          <Badge variant="outline" className="text-xs">
                            Warranty Expired
                          </Badge>
                        )}
                        {calibrationDue && (
                          <Badge variant="destructive" className="text-xs">
                            Calibration Due
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{asset.description}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/assets/${asset.id}`)} title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(asset); setFormData(assetToFormData(asset)); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        toast.warning(`Delete asset "${asset.name}"?`, {
                          action: {
                            label: 'Delete',
                            onClick: () => deleteMutation.mutate(asset.id),
                          },
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-lg font-medium">{viewing.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-medium">{viewing.category?.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Quantity</Label>
                <p className="text-lg font-semibold">{viewing.quantity}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status Tracking</Label>
                <p className="text-sm mt-1">Status tracked at serial number level</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 rounded-lg border p-3">{viewing.description || 'No description'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Serial Numbers Management Dialog */}
      <Dialog open={serialsOpen} onOpenChange={setSerialsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Serial Numbers - {managingSerials?.name}</DialogTitle>
          </DialogHeader>
          {managingSerials && (
            <div className="space-y-6">
              {/* Quantity Status */}
              <div className={`rounded-lg border p-3 ${serialNumbers?.data?.length > managingSerials.quantity ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800' : 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Serial Numbers Registered</p>
                    <p className="text-2xl font-bold">{serialNumbers?.data?.length || 0} / {managingSerials.quantity}</p>
                  </div>
                  {serialNumbers?.data?.length > managingSerials.quantity && (
                    <Badge variant="destructive">Exceeds Quantity!</Badge>
                  )}
                  {serialNumbers?.data?.length === managingSerials.quantity && (
                    <Badge className="bg-green-500">Complete</Badge>
                  )}
                  {serialNumbers?.data?.length < managingSerials.quantity && (
                    <Badge variant="secondary">{managingSerials.quantity - serialNumbers?.data?.length} remaining</Badge>
                  )}
                </div>
              </div>

              {/* Bulk S/N Assignment Button */}
              <div className="flex justify-end mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/assets/${managingSerials.id}/bulk-scan`)}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Bulk S/N Assignment (Scan)
                </Button>
              </div>

              {/* Add New Serial Number */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <h3 className="font-semibold mb-3">Add New Serial Number</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  createSerialMutation.mutate({
                    asset_id: managingSerials.id,
                    ...newSerial
                  });
                }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Serial Number *</Label>
                      <Input
                        value={newSerial.serial_number}
                        onChange={(e) => setNewSerial({ ...newSerial, serial_number: e.target.value })}
                        required
                        placeholder="e.g., SN123456"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950">
                        <p className="text-xs text-muted-foreground">
                          <strong>Note:</strong> Asset tag will be auto-generated (e.g., LAP-0001, LAP-0002)
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label>Condition</Label>
                      <Select value={newSerial.condition} onValueChange={(value) => setNewSerial({ ...newSerial, condition: value })}>
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
                    </div>
                    <div>
                      <Label>Assigned To</Label>
                      <Input
                        value={newSerial.assigned_to}
                        onChange={(e) => setNewSerial({ ...newSerial, assigned_to: e.target.value })}
                        placeholder="Person or department"
                      />
                    </div>
                    <div>
                      <Label>Last Maintenance</Label>
                      <Input
                        type="date"
                        value={newSerial.last_maintenance_date}
                        onChange={(e) => setNewSerial({ ...newSerial, last_maintenance_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Next Maintenance</Label>
                      <Input
                        type="date"
                        value={newSerial.next_maintenance_date}
                        onChange={(e) => setNewSerial({ ...newSerial, next_maintenance_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input
                        value={newSerial.notes}
                        onChange={(e) => setNewSerial({ ...newSerial, notes: e.target.value })}
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Serial Number
                  </Button>
                </form>
              </div>

              {/* Existing Serial Numbers */}
              <div>
                <h3 className="font-semibold mb-3">Existing Serial Numbers ({serialNumbers?.data?.length || 0})</h3>
                {serialNumbers?.data?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No serial numbers added yet</p>
                ) : (
                  <div className="space-y-2">
                    {serialNumbers?.data?.map((serial: any) => (
                      <div key={serial.id} className="flex items-start justify-between rounded-lg border p-3 bg-background">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-lg">{serial.serial_number}</p>
                            {serial.status && (
                              <Badge variant={serial.status === 'available' ? 'default' : serial.status === 'in_use' ? 'secondary' : 'destructive'}>
                                {serial.status.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {serial.asset_tag && (
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                <span>Tag: {serial.asset_tag}</span>
                              </div>
                            )}
                            <span>Condition: <span className="capitalize">{serial.condition}</span></span>
                            {serial.assigned_to && <span>Assigned: {serial.assigned_to}</span>}
                            {serial.last_maintenance_date && <span>Last Maint: {serial.last_maintenance_date}</span>}
                            {serial.next_maintenance_date && <span>Next Maint: {serial.next_maintenance_date}</span>}
                          </div>

                          {serial.notes && (
                            <p className="text-sm text-muted-foreground italic">Note: {serial.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirm('Delete this serial number?') && deleteSerialMutation.mutate(serial.id)}
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
