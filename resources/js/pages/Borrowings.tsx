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
import { Plus, Pencil, Trash2, CheckCircle, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Borrowings() {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({
    borrower_type: 'asset',
    borrower_name: '',
    user_id: '',
    department_id: '', // requesting department
    asset_id: '', // selected asset type
    asset_serial_id: '',
    computer_id: '',
    includes_peripherals: false,
    borrow_date: '',
    expected_return_date: '',
    status: 'borrowed',
    remarks: ''
  });
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => (await api.get('/assets')).data,
  });

  const { data: serials } = useQuery({
    queryKey: ['asset-serial-numbers'],
    queryFn: async () => (await api.get('/asset-serial-numbers')).data,
  });

  const { data: computers } = useQuery({
    queryKey: ['computers'],
    queryFn: async () => (await api.get('/computers')).data,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['borrowings', search],
    queryFn: async () => (await api.get('/borrowings', { params: { search } })).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/borrowings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      toast.success('Borrowing created');
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/borrowings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      toast.success('Borrowing updated');
      setOpen(false);
      resetForm();
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.post(`/borrowings/${id}/return`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      toast.success('Item returned');
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.post(`/borrowings/${id}/approve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      toast.success('Request approved');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.post(`/borrowings/${id}/reject`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      toast.success('Request rejected');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/borrowings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      toast.success('Borrowing deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      borrower_type: 'asset', // 'asset' or 'computer'
      borrower_name: '',
      user_id: '',
      department_id: '', // requesting department
      asset_id: '', // selected asset type
      asset_serial_id: '',
      computer_id: '',
      includes_peripherals: false,
      borrow_date: '',
      expected_return_date: '',
      status: 'borrowed',
      remarks: ''
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

  const handleReturn = (id: number) => {
    returnMutation.mutate({ id, data: { return_date: new Date().toISOString().split('T')[0] } });
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id, data: {} });
  };

  const handleReject = (id: number) => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ id, data: { remarks: reason } });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500 text-white hover:bg-yellow-600',
      borrowed: 'bg-blue-500 text-white hover:bg-blue-600',
      returned: 'bg-green-500 text-white hover:bg-green-600',
      lost: 'bg-red-500 text-white hover:bg-red-600',
      rejected: 'bg-gray-500 text-white hover:bg-gray-600',
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  // Get all serial numbers from other departments that are available
  const availableSerials = serials?.data?.filter((serial: any) =>
    formData.department_id &&
    serial.asset?.department_id?.toString() !== formData.department_id &&
    serial.status === 'available'
  ) || [];

  // Get unique assets that have available serial numbers from other departments
  const availableAssets = Array.from(
    new Map(
      availableSerials
        .filter((serial: any) => serial.asset)
        .map((serial: any) => [serial.asset.id, serial.asset])
    ).values()
  );

  // For cross-department borrowing, show serial numbers filtered by selected asset
  const filteredSerials = availableSerials.filter((serial: any) =>
    !formData.asset_id || serial.asset_id?.toString() === formData.asset_id
  );
  const filteredComputers = computers?.data?.filter((computer: any) =>
    formData.department_id &&
    computer.department_id?.toString() !== formData.department_id
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Borrowings</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Add Borrowing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit' : 'New'} Borrowing</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Borrower Name *</Label>
                <Input value={formData.borrower_name} onChange={e => setFormData({ ...formData, borrower_name: e.target.value })} placeholder="Enter name of borrower" />
              </div>
              <div>
                <Label>Your Department (Borrowing From) *</Label>
                <p className="text-sm text-muted-foreground mb-2">Select your department to see available items from other departments</p>
                <Select value={formData.department_id} onValueChange={value => setFormData({ ...formData, department_id: value, asset_serial_id: '', computer_id: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.data?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.department_id && (
                <>
                  <div>
                    <Label>What would you like to borrow? *</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="borrower_type" value="asset" checked={formData.borrower_type === 'asset'} onChange={() => setFormData({ ...formData, borrower_type: 'asset', computer_id: '', asset_serial_id: '' })} /> Asset
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="borrower_type" value="computer" checked={formData.borrower_type === 'computer'} onChange={() => setFormData({ ...formData, borrower_type: 'computer', asset_serial_id: '', computer_id: '' })} /> Computer
                      </label>
                    </div>
                  </div>
                  {formData.borrower_type === 'asset' && (
                    <>
                      <div>
                        <Label>Asset Type *</Label>
                        <p className="text-sm text-muted-foreground mb-2">Select the type of asset you want to borrow:</p>
                        <Select value={formData.asset_id} onValueChange={value => setFormData({ ...formData, asset_id: value, asset_serial_id: '' })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAssets.length === 0 ? (
                              <SelectItem value="no-asset-types" disabled>No assets available from other departments</SelectItem>
                            ) : (
                              availableAssets.map((asset: any) => (
                                <SelectItem key={asset.id} value={asset.id.toString()}>
                                  {asset.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.asset_id && (
                        <div>
                          <Label>Asset Tag *</Label>
                          <p className="text-sm text-muted-foreground mb-2">Select a specific asset tag:</p>
                          <Select value={formData.asset_serial_id} onValueChange={value => setFormData({ ...formData, asset_serial_id: value, computer_id: '' })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset tag" />
                        </SelectTrigger>
                          <SelectContent>
                            {filteredSerials.length === 0 ? (
                              <SelectItem value="no-assets" disabled>No available assets from other departments</SelectItem>
                            ) : (
                              filteredSerials.map((serial: any) => (
                                <SelectItem key={serial.id} value={serial.id.toString()}>
                                  {serial.asset_tag} - {serial.asset?.name} (from {serial.asset?.department?.name || 'Unknown Dept'})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                      </Select>
                      {formData.asset_serial_id && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <Label className="text-sm text-muted-foreground">Borrowing From Department</Label>
                          <p className="font-medium mt-1">
                            {filteredSerials.find((s: any) => s.id.toString() === formData.asset_serial_id)?.asset?.department?.name || 'N/A'}
                          </p>
                        </div>
                      )}
                        </div>
                      )}
                    </>
                  )}
                  {formData.borrower_type === 'computer' && (
                    <div>
                      <Label>Computer *</Label>
                      <p className="text-sm text-muted-foreground mb-2">Available computers from other departments:</p>
                      <Select value={formData.computer_id} onValueChange={value => setFormData({ ...formData, computer_id: value, asset_serial_id: '' })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select computer" />
                        </SelectTrigger>
                          <SelectContent>
                            {filteredComputers.length === 0 ? (
                              <SelectItem value="no-computers" disabled>No available computers from other departments</SelectItem>
                            ) : (
                              filteredComputers.map((computer: any) => (
                                <SelectItem key={computer.id} value={computer.id.toString()}>
                                  {computer.hostname} - {computer.manufacturer} {computer.model} (from {computer.department?.name || 'Unknown Dept'})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                      </Select>
                      <div className="flex items-center mt-3">
                        <input type="checkbox" id="includes_peripherals" checked={formData.includes_peripherals} onChange={e => setFormData({ ...formData, includes_peripherals: e.target.checked })} />
                        <label htmlFor="includes_peripherals" className="ml-2">Include peripherals attached?</label>
                      </div>
                      {formData.computer_id && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <Label className="text-sm text-muted-foreground">Borrowing From Department</Label>
                          <p className="font-medium mt-1">
                            {filteredComputers.find((c: any) => c.id.toString() === formData.computer_id)?.department?.name || 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              <div>
                <Label>Borrow Date *</Label>
                <Input type="date" value={formData.borrow_date} onChange={(e) => setFormData({ ...formData, borrow_date: e.target.value })} required />
              </div>
              <div>
                <Label>Expected Return Date *</Label>
                <Input type="date" value={formData.expected_return_date} onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })} required />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Input
        placeholder="Search borrowings..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">User</TableHead>
              <TableHead className="min-w-[150px]">Item</TableHead>
              <TableHead className="min-w-[110px] hidden sm:table-cell">Borrow Date</TableHead>
              <TableHead className="min-w-[130px] hidden md:table-cell">Expected Return</TableHead>
              <TableHead className="min-w-[100px] hidden lg:table-cell">Duration</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center">No borrowings found</TableCell></TableRow>
            ) : (
              data?.data?.map((borrowing: any) => (
                <TableRow key={borrowing.id} className={borrowing.is_overdue ? 'bg-red-50' : ''}>
                  <TableCell>{borrowing.user?.name || borrowing.borrower_name}</TableCell>
                  <TableCell>
                    {borrowing.asset_serial ? `${borrowing.asset_serial.asset_tag} (${borrowing.asset_serial.asset?.name})` : borrowing.computer?.hostname}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{borrowing.borrow_date}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col">
                      <span>{borrowing.expected_return_date}</span>
                      {borrowing.is_overdue && (
                        <Badge variant="destructive" className="mt-1 w-fit text-xs">
                          {borrowing.days_overdue}d overdue
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">{borrowing.days_borrowed} days</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(borrowing.status)}>{borrowing.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setViewing(borrowing); setViewOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {borrowing.status === 'borrowed' && (
                      <Button variant="ghost" size="icon" onClick={() => handleReturn(borrowing.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {borrowing.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleApprove(borrowing.id)} title="Approve">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleReject(borrowing.id)} title="Reject">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        toast.warning(`Delete borrowing record?`, {
                          action: {
                            label: 'Delete',
                            onClick: () => deleteMutation.mutate(borrowing.id),
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
            <DialogTitle>Borrowing Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Borrower</Label>
                  <p className="font-medium">{viewing.user?.name || viewing.borrower_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1 flex gap-2 items-center">
                    <Badge className={getStatusColor(viewing.status)}>{viewing.status}</Badge>
                    {viewing.is_overdue && (
                      <Badge variant="destructive">{viewing.days_overdue} days overdue</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Item</Label>
                  <p className="font-medium">
                    {viewing.asset_serial
                      ? `${viewing.asset_serial.asset_tag} (${viewing.asset_serial.asset?.name})`
                      : viewing.computer?.hostname || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{viewing.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Borrow Date</Label>
                  <p className="font-medium">{viewing.borrow_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expected Return Date</Label>
                  <p className="font-medium">{viewing.expected_return_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Actual Return Date</Label>
                  <p className="font-medium">{viewing.return_date || 'Not returned yet'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p className="font-medium">{viewing.days_borrowed} days</p>
                </div>
              </div>
              {viewing.remarks && (
                <div>
                  <Label className="text-muted-foreground">Remarks</Label>
                  <p className="mt-1 rounded-lg border p-3">{viewing.remarks}</p>
                </div>
              )}
              
              {/* Audit History Timeline */}
              {viewing.histories && viewing.histories.length > 0 && (
                <div className="mt-6">
                  <Label className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5" />
                    Activity Timeline
                  </Label>
                  <div className="space-y-4">
                    {viewing.histories.map((history: any, index: number) => (
                      <div key={history.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            history.action === 'created' ? 'bg-blue-500' :
                            history.action === 'approved' ? 'bg-green-500' :
                            history.action === 'rejected' ? 'bg-red-500' :
                            history.action === 'returned' ? 'bg-green-500' :
                            'bg-gray-500'
                          }`} />
                          {index < viewing.histories.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 flex-1 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize">{history.action.replace('_', ' ')}</span>
                            <span className="text-xs text-muted-foreground">{history.created_at}</span>
                          </div>
                          {history.user && (
                            <p className="text-sm text-muted-foreground">by {history.user.name}</p>
                          )}
                          {history.old_status && history.new_status && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{history.old_status}</Badge>
                              <span className="text-xs">→</span>
                              <Badge variant="outline" className="text-xs">{history.new_status}</Badge>
                            </div>
                          )}
                          {history.notes && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded">{history.notes}</p>
                          )}
                          {history.changes && Object.keys(history.changes).length > 0 && (
                            <div className="text-xs text-muted-foreground mt-2">
                              <details>
                                <summary className="cursor-pointer">View changes</summary>
                                <div className="mt-2 space-y-1">
                                  {Object.entries(history.changes).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex gap-2">
                                      <span className="font-medium">{key}:</span>
                                      <span>{value.old} → {value.new}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

