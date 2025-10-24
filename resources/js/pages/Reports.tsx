import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Download, 
  Filter, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ReportType {
  id: string;
  name: string;
  description: string;
}

export default function Reports() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [filters, setFilters] = useState({
    category_id: '',
    department_id: '',
    status: '',
    date_from: '',
    date_to: '',
  });

  const { data: reportTypes } = useQuery({
    queryKey: ['report-types'],
    queryFn: async () => {
      const response = await api.get('/reports/types');
      return response.data;
    },
  });

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
    enabled: isSuperAdmin(),
  });

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', selectedReport, filters],
    queryFn: async () => {
      if (!selectedReport) return null;
      
      const endpoint = `/reports/${selectedReport}`;
      const response = await api.get(endpoint, { params: filters });
      return response.data;
    },
    enabled: !!selectedReport,
  });

  const getReportIcon = (reportId: string) => {
    switch (reportId) {
      case 'inventory':
        return <Package className="h-5 w-5" />;
      case 'valuation':
        return <DollarSign className="h-5 w-5" />;
      case 'borrowings':
        return <TrendingUp className="h-5 w-5" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      case 'low-stock':
        return <AlertTriangle className="h-5 w-5" />;
      case 'lifecycle':
        return <Calendar className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    try {
      let csvContent = '';
      let filename = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`;

      // Generate CSV based on report type
      if (selectedReport === 'inventory' && reportData.assets) {
        csvContent = 'Name,Category,Department,Quantity,Available,In Use,Maintenance,Value\n';
        reportData.assets.forEach((asset: any) => {
          csvContent += `"${asset.name}","${asset.category?.name || ''}","${asset.department?.name || ''}",${asset.quantity},${asset.quantity_available},${asset.quantity_in_use},${asset.quantity_maintenance},${asset.current_value || 0}\n`;
        });
      } else if (selectedReport === 'valuation' && reportData.assets) {
        csvContent = 'Name,Category,Department,Purchase Price,Current Value,Depreciation\n';
        reportData.assets.forEach((asset: any) => {
          const depreciation = (asset.purchase_price || 0) - (asset.current_value || 0);
          csvContent += `"${asset.name}","${asset.category?.name || ''}","${asset.department?.name || ''}",${asset.purchase_price || 0},${asset.current_value || 0},${depreciation}\n`;
        });
      } else if (selectedReport === 'borrowings' && reportData.borrowings) {
        csvContent = 'Asset,Borrower,Department,Status,Borrowed At,Due Date,Returned At\n';
        reportData.borrowings.forEach((borrowing: any) => {
          csvContent += `"${borrowing.asset?.name || ''}","${borrowing.user?.name || ''}","${borrowing.department?.name || ''}","${borrowing.status}","${borrowing.borrowed_at || ''}","${borrowing.due_date || ''}","${borrowing.returned_at || ''}"\n`;
        });
      } else if (selectedReport === 'low-stock' && reportData.assets) {
        csvContent = 'Name,Category,Department,Available,Minimum Required,Shortage\n';
        reportData.assets.forEach((asset: any) => {
          const shortage = (asset.min_quantity || 0) - asset.quantity_available;
          csvContent += `"${asset.name}","${asset.category?.name || ''}","${asset.department?.name || ''}",${asset.quantity_available},${asset.min_quantity || 0},${shortage}\n`;
        });
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleExportPDF = async () => {
    if (!selectedReport) return;

    try {
      // Build query string from filters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      // Fetch PDF from backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/reports/${selectedReport}/export-pdf?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const renderSummary = () => {
    if (!reportData?.summary) return null;

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {Object.entries(reportData.summary).map(([key, value]: [string, any]) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {key.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof value === 'number' && key.includes('value') 
                  ? `₱${value.toLocaleString()}` 
                  : value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderInventoryReport = () => {
    if (!reportData?.assets) return null;

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              {isSuperAdmin() && <TableHead>Department</TableHead>}
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">In Use</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.assets.map((asset: any) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>{asset.category?.name}</TableCell>
                {isSuperAdmin() && <TableCell>{asset.department?.name || '—'}</TableCell>}
                <TableCell className="text-right">{asset.quantity}</TableCell>
                <TableCell className="text-right">{asset.quantity_available}</TableCell>
                <TableCell className="text-right">{asset.quantity_in_use}</TableCell>
                <TableCell className="text-right">
                  {asset.current_value ? `₱${asset.current_value.toLocaleString()}` : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderBorrowingsReport = () => {
    if (!reportData?.borrowings) return null;

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Borrowed At</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.borrowings.map((borrowing: any) => (
              <TableRow key={borrowing.id}>
                <TableCell className="font-medium">{borrowing.asset?.name}</TableCell>
                <TableCell>{borrowing.user?.name}</TableCell>
                <TableCell>
                  <Badge variant={
                    borrowing.status === 'returned' ? 'default' :
                    borrowing.status === 'overdue' ? 'destructive' : 'secondary'
                  }>
                    {borrowing.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(borrowing.borrowed_at).toLocaleDateString()}</TableCell>
                <TableCell>{borrowing.due_date ? new Date(borrowing.due_date).toLocaleDateString() : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderLowStockReport = () => {
    if (!reportData?.assets) return null;

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Minimum</TableHead>
              <TableHead className="text-right">Shortage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.assets.map((asset: any) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell>{asset.category?.name}</TableCell>
                <TableCell className="text-right">{asset.quantity_available}</TableCell>
                <TableCell className="text-right">{asset.min_quantity}</TableCell>
                <TableCell className="text-right text-red-600">
                  {asset.min_quantity - asset.quantity_available}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderReportContent = () => {
    if (!selectedReport) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Select a Report</CardTitle>
            <CardDescription>
              Choose a report type from the list above to generate insights
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <Card>
          <CardContent className="py-10 text-center">
            <p>Loading report...</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {renderSummary()}
        
        {selectedReport === 'inventory' && renderInventoryReport()}
        {selectedReport === 'borrowings' && renderBorrowingsReport()}
        {selectedReport === 'low-stock' && renderLowStockReport()}
        {selectedReport === 'valuation' && renderInventoryReport()}
        {selectedReport === 'lifecycle' && renderInventoryReport()}
        {selectedReport === 'maintenance' && (
          <Card>
            <CardContent className="py-10">
              <p className="text-center text-muted-foreground">
                Maintenance report data will be displayed here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and export asset reports</p>
        </div>
        {selectedReport && reportData && hasPermission('export reports') && (
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* Report Type Selection */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes?.types?.map((type: ReportType) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedReport === type.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedReport(type.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                {getReportIcon(type.id)}
                <div>
                  <CardTitle className="text-base">{type.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {type.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Filters */}
      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(selectedReport === 'inventory' || selectedReport === 'valuation') && (
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={filters.category_id}
                    onValueChange={(value) => setFilters({ ...filters, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.data?.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isSuperAdmin() && (
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={filters.department_id}
                    onValueChange={(value) => setFilters({ ...filters, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments?.data?.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedReport === 'borrowings' && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="borrowed">Borrowed</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="date_from">Date From</Label>
                <Input
                  id="date_from"
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="date_to">Date To</Label>
                <Input
                  id="date_to"
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => refetch()}>
                Generate Report
              </Button>
              <Button
                variant="outline"
                onClick={() => setFilters({
                  category_id: '',
                  department_id: '',
                  status: '',
                  date_from: '',
                  date_to: '',
                })}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
}
