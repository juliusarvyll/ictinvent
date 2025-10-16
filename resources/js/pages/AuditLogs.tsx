import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Filter, X, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    user_id: '',
    start_date: '',
    end_date: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [viewingLog, setViewingLog] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: async () => {
      // Filter out empty values to avoid sending empty strings
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await api.get('/audit-logs', {
        params: { ...cleanFilters, page, per_page: 15 },
      });
      return response.data;
    },
  });

  const { data: modules } = useQuery({
    queryKey: ['audit-modules'],
    queryFn: async () => {
      const response = await api.get('/audit-logs/modules');
      return response.data;
    },
  });

  const { data: actions } = useQuery({
    queryKey: ['audit-actions'],
    queryFn: async () => {
      const response = await api.get('/audit-logs/actions');
      return response.data;
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      module: '',
      action: '',
      user_id: '',
      start_date: '',
      end_date: '',
      search: '',
    });
    setPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      'created': 'bg-green-500 text-white',
      'updated': 'bg-blue-500 text-white',
      'deleted': 'bg-red-500 text-white',
      'returned': 'bg-purple-500 text-white',
      'approved': 'bg-emerald-500 text-white',
      'rejected': 'bg-orange-500 text-white',
      'roles_updated': 'bg-indigo-500 text-white',
      'permissions_updated': 'bg-pink-500 text-white',
      'login': 'bg-green-600 text-white',
      'logout': 'bg-gray-600 text-white',
      'login_failed': 'bg-red-600 text-white',
      'register': 'bg-blue-600 text-white',
    };
    return colors[action] || 'bg-gray-500 text-white';
  };

  const getModuleBadgeColor = (module: string) => {
    const colors: Record<string, string> = {
      'borrowings': 'bg-blue-100 text-blue-800',
      'users': 'bg-purple-100 text-purple-800',
      'roles': 'bg-pink-100 text-pink-800',
      'assets': 'bg-green-100 text-green-800',
      'computers': 'bg-cyan-100 text-cyan-800',
      'authentication': 'bg-yellow-100 text-yellow-800',
      'categories': 'bg-indigo-100 text-indigo-800',
      'departments': 'bg-orange-100 text-orange-800',
      'asset_serial_numbers': 'bg-teal-100 text-teal-800',
    };
    return colors[module] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track all system activities and changes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <FileText className="h-3 w-3 mr-1" />
            {logs?.total || 0} logs
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">Active</Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Module</Label>
            <Select value={filters.module || 'all'} onValueChange={(value) => handleFilterChange('module', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {modules?.data?.map((module: string) => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Action</Label>
            <Select value={filters.action || 'all'} onValueChange={(value) => handleFilterChange('action', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions?.data?.map((action: string) => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Search</Label>
          <Input
            placeholder="Search in log data..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[80px]">ID</TableHead>
              <TableHead className="min-w-[150px]">User</TableHead>
              <TableHead className="min-w-[120px]">Module</TableHead>
              <TableHead className="min-w-[120px]">Action</TableHead>
              <TableHead className="min-w-[180px]">Timestamp</TableHead>
              <TableHead className="text-right min-w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : logs?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No audit logs found</TableCell>
              </TableRow>
            ) : (
              logs?.data?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.user?.name || 'System'}</p>
                      <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getModuleBadgeColor(log.module)}>
                      {log.module}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionBadgeColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setViewingLog(log);
                        setViewDialogOpen(true);
                      }}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {logs && logs.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {logs.current_page} of {logs.last_page} ({logs.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(logs.last_page, p + 1))}
              disabled={page === logs.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Log ID</Label>
                  <p className="font-mono">{viewingLog.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Timestamp</Label>
                  <p>{formatDate(viewingLog.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{viewingLog.user?.name || 'System'}</p>
                  <p className="text-sm text-muted-foreground">{viewingLog.user?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Module</Label>
                  <Badge variant="outline" className={getModuleBadgeColor(viewingLog.module)}>
                    {viewingLog.module}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Action</Label>
                  <Badge className={getActionBadgeColor(viewingLog.action)}>
                    {viewingLog.action}
                  </Badge>
                </div>
              </div>

              {viewingLog.old_values && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Old Values</Label>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(viewingLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {viewingLog.new_values && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">New Values</Label>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(viewingLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
