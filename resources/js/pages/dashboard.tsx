import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Computer, FileText, Hash, AlertTriangle, Clock, TrendingUp, Building2, ListX } from 'lucide-react';

interface DashboardAnalytics {
  summary: {
    total_assets: number;
    total_computers: number;
    total_serial_numbers: number;
    active_borrowings: number;
  };
  assets_by_status: Array<{ status: string; count: number }>;
  borrowings_by_status: Array<{ status: string; count: number }>;
  assets_by_category: Array<{ category: string; count: number }>;
  assets_by_department?: Array<{ department: string; count: number }>;
  recent_borrowings: Array<{
    id: number;
    user: string;
    item: string;
    status: string;
    borrow_date: string;
    expected_return_date?: string;
  }>;
  low_stock_assets: Array<{
    id: number;
    name: string;
    category: string;
    quantity: number;
  }>;
  overdue_borrowings: Array<{
    id: number;
    user: string;
    item: string;
    expected_return_date: string;
    days_overdue: number;
  }>;
  unassigned_serial_numbers: Array<{
    id: number;
    name: string;
    category: string;
    quantity: number;
    registered: number;
    missing: number;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const response = await api.get('/dashboard/analytics');
      return response.data;
    },
  });

  const statCards = [
    {
      title: 'Total Assets',
      value: analytics?.summary.total_assets || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/assets',
    },
    {
      title: 'Total Computers',
      value: analytics?.summary.total_computers || 0,
      icon: Computer,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/computers',
    },
    {
      title: 'Serial Numbers',
      value: analytics?.summary.total_serial_numbers || 0,
      icon: Hash,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/serial-numbers',
    },
    {
      title: 'Active Borrowings',
      value: analytics?.summary.active_borrowings || 0,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/borrowings',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      borrowed: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      returned: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time inventory analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => navigate(stat.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      {(analytics?.overdue_borrowings.length || analytics?.low_stock_assets.length || analytics?.unassigned_serial_numbers.length) ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Overdue Borrowings */}
          {analytics?.overdue_borrowings && analytics.overdue_borrowings.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Clock className="h-5 w-5" />
                  Overdue Borrowings ({analytics.overdue_borrowings.length})
                </CardTitle>
                <CardDescription>Items that should have been returned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.overdue_borrowings.slice(0, 5).map((borrowing) => (
                    <div key={borrowing.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{borrowing.item}</p>
                        <p className="text-xs text-muted-foreground">Borrowed by: {borrowing.user}</p>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        {borrowing.days_overdue}d overdue
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Alerts */}
          {analytics?.low_stock_assets && analytics.low_stock_assets.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alerts ({analytics.low_stock_assets.length})
                </CardTitle>
                <CardDescription>Assets running low on quantity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.low_stock_assets.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.category}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 border-yellow-600 text-yellow-600">
                        {asset.quantity} left
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unassigned Serial Numbers */}
          {analytics?.unassigned_serial_numbers && analytics.unassigned_serial_numbers.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <ListX className="h-5 w-5" />
                  Unassigned Serial Numbers ({analytics.unassigned_serial_numbers.length})
                </CardTitle>
                <CardDescription>Assets missing serial number registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.unassigned_serial_numbers.slice(0, 5).map((asset) => (
                    <div 
                      key={asset.id} 
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.category} • {asset.registered}/{asset.quantity} registered
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2 border-orange-600 text-orange-600">
                        {asset.missing} missing
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {/* Charts and Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Assets by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.assets_by_status.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(item.count / (analytics?.summary.total_assets || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Borrowings by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Borrowings by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.borrowings_by_status.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <Badge variant="outline" className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Asset Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.assets_by_category.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm">{item.category}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets by Department (Admin only) */}
      {analytics?.assets_by_department && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Assets by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {analytics.assets_by_department.map((item) => (
                <div key={item.department} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">{item.department}</p>
                  <p className="text-2xl font-bold mt-1">{item.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Borrowings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Borrowings</CardTitle>
          <CardDescription>Latest borrowing activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics?.recent_borrowings.map((borrowing) => (
              <div key={borrowing.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{borrowing.item}</p>
                  <p className="text-xs text-muted-foreground">
                    {borrowing.user} • {borrowing.borrow_date}
                    {borrowing.expected_return_date && ` → ${borrowing.expected_return_date}`}
                  </p>
                </div>
                <Badge className={getStatusColor(borrowing.status)}>{borrowing.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
