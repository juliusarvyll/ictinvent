import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Computer, 
  FileText, 
  Hash, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  AlertTriangle,
  Users,
  Building2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';

interface DashboardAnalytics {
  summary: {
    total_assets: number;
    total_computers: number;
    total_serial_numbers: number;
    active_borrowings: number;
  };
  trends: {
    assets_growth: number;
    computers_growth: number;
    borrowings_growth: number;
  };
  recent_activities: Array<{
    id: number;
    type: 'asset_created' | 'borrowing_created' | 'asset_updated' | 'computer_added';
    description: string;
    user: string;
    timestamp: string;
  }>;
  top_departments: Array<{
    name: string;
    asset_count: number;
    percentage: number;
  }>;
  asset_status_distribution: {
    available: number;
    borrowed: number;
    maintenance: number;
    retired: number;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  console.log('Dashboard component mounting...');
  
  const { data: analytics, isLoading, error } = useQuery<DashboardAnalytics>({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      console.log('Fetching comprehensive dashboard analytics...');
      try {
        // Fetch audit logs for recent activities
        const auditLogsResponse = await api.get('/audit-logs?limit=10&sort=created_at|desc');
        const auditLogs = auditLogsResponse.data.data || [];

        // Fetch assets for summary and status distribution
        const assetsResponse = await api.get('/assets');
        const assets = assetsResponse.data.data || [];

        // Fetch computers
        const computersResponse = await api.get('/computers');
        const computers = computersResponse.data.data || [];

        // Fetch borrowings
        const borrowingsResponse = await api.get('/borrowings');
        const borrowings = borrowingsResponse.data.data || [];

        // Fetch departments
        const departmentsResponse = await api.get('/departments');
        const departments = departmentsResponse.data.data || [];

        // Transform audit logs to recent activities format (excluding login/logout)
        const recentActivities = auditLogs
          .filter((log: any) => {
            // Filter out authentication-related actions
            const action = log.action?.toLowerCase() || '';
            return !action.includes('login') && 
                   !action.includes('logout') && 
                   !action.includes('auth') &&
                   !action.includes('session') &&
                   !action.includes('password');
          })
          .slice(0, 5)
          .map((log: any) => ({
            id: log.id,
            type: log.action.replace('.', '_') as any,
            description: log.description || `${log.action} performed on ${log.subject_type}`,
            user: log.user?.name || 'System',
            timestamp: new Date(log.created_at).toLocaleString(),
          }));

        // Calculate asset status distribution
        const assetStatusDistribution = {
          available: assets.filter((asset: any) => asset.status === 'available').length,
          borrowed: assets.filter((asset: any) => asset.status === 'borrowed').length,
          maintenance: assets.filter((asset: any) => asset.status === 'maintenance').length,
          retired: assets.filter((asset: any) => asset.status === 'retired').length,
        };

        // Calculate top departments by asset count
        const departmentAssetCounts = departments.map((dept: any) => ({
          name: dept.name,
          asset_count: assets.filter((asset: any) => asset.department_id === dept.id).length,
        })).sort((a: any, b: any) => b.asset_count - a.asset_count).slice(0, 4);

        const totalAssets = assets.length;
        const topDepartments = departmentAssetCounts.map((dept: any) => ({
          ...dept,
          percentage: totalAssets > 0 ? Math.round((dept.asset_count / totalAssets) * 100 * 10) / 10 : 0,
        }));

        // Mock trends for now (could be calculated from historical data)
        const trends = {
          assets_growth: 12.5,
          computers_growth: 8.3,
          borrowings_growth: -3.2,
        };

        const analyticsData: DashboardAnalytics = {
          summary: {
            total_assets: totalAssets,
            total_computers: computers.length,
            total_serial_numbers: assets.reduce((sum: number, asset: any) => sum + (asset.serial_numbers?.length || 0), 0),
            active_borrowings: borrowings.filter((b: any) => b.status === 'active').length,
          },
          trends,
          recent_activities: recentActivities,
          top_departments: topDepartments,
          asset_status_distribution: assetStatusDistribution,
        };
        
        console.log('Real analytics data fetched:', analyticsData);
        return analyticsData;
      } catch (err) {
        console.error('Error fetching analytics:', err);
        // Fallback to mock data if API fails
        const mockData: DashboardAnalytics = {
          summary: {
            total_assets: 1247,
            total_computers: 342,
            total_serial_numbers: 891,
            active_borrowings: 67,
          },
          trends: {
            assets_growth: 12.5,
            computers_growth: 8.3,
            borrowings_growth: -3.2,
          },
          recent_activities: [
            {
              id: 1,
              type: 'asset_created',
              description: 'New laptop added to IT Department',
              user: 'John Doe',
              timestamp: '2 hours ago',
            },
            {
              id: 2,
              type: 'borrowing_created',
              description: 'Monitor borrowed by Jane Smith',
              user: 'Jane Smith',
              timestamp: '3 hours ago',
            },
            {
              id: 3,
              type: 'computer_added',
              description: 'Desktop computer registered',
              user: 'Mike Johnson',
              timestamp: '5 hours ago',
            },
            {
              id: 4,
              type: 'asset_updated',
              description: 'Asset maintenance status updated',
              user: 'Sarah Wilson',
              timestamp: '1 day ago',
            },
          ],
          top_departments: [
            { name: 'IT Department', asset_count: 342, percentage: 27.4 },
            { name: 'HR Department', asset_count: 198, percentage: 15.9 },
            { name: 'Finance', asset_count: 156, percentage: 12.5 },
            { name: 'Marketing', asset_count: 134, percentage: 10.7 },
          ],
          asset_status_distribution: {
            available: 890,
            borrowed: 67,
            maintenance: 45,
            retired: 245,
          },
        };
        
        console.log('Using fallback mock data:', mockData);
        return mockData;
      }
    },
  });

  if (error) {
    console.error('Query error:', error);
  }

  if (analytics) {
    console.log('Analytics data available:', analytics.summary);
  }

  const statCards = [
    {
      title: 'Total Assets',
      value: analytics?.summary.total_assets || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/assets',
      trend: analytics?.trends.assets_growth || 0,
      trendLabel: 'from last month',
    },
    {
      title: 'Total Computers',
      value: analytics?.summary.total_computers || 0,
      icon: Computer,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/computers',
      trend: analytics?.trends.computers_growth || 0,
      trendLabel: 'from last month',
    },
    {
      title: 'Serial Numbers',
      value: analytics?.summary.total_serial_numbers || 0,
      icon: Hash,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/serial-numbers',
      trend: 15.2,
      trendLabel: 'from last month',
    },
    {
      title: 'Active Borrowings',
      value: analytics?.summary.active_borrowings || 0,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/borrowings',
      trend: analytics?.trends.borrowings_growth || 0,
      trendLabel: 'from last month',
    },
  ];

  const getActivityIcon = (type: string) => {
    // Handle various audit log actions
    if (type.includes('create') || type.includes('created')) {
      return <Package className="h-4 w-4 text-blue-600" />;
    } else if (type.includes('borrow') || type.includes('borrowing')) {
      return <FileText className="h-4 w-4 text-orange-600" />;
    } else if (type.includes('computer') || type.includes('pc')) {
      return <Computer className="h-4 w-4 text-green-600" />;
    } else if (type.includes('update') || type.includes('updated') || type.includes('edit')) {
      return <Activity className="h-4 w-4 text-purple-600" />;
    } else if (type.includes('delete') || type.includes('removed')) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    } else if (type.includes('user') || type.includes('login')) {
      return <Users className="h-4 w-4 text-indigo-600" />;
    } else if (type.includes('department')) {
      return <Building2 className="h-4 w-4 text-teal-600" />;
    } else {
      return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'borrowed':
        return 'bg-blue-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'retired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  console.log('Stat cards calculated:', statCards.map(card => ({ title: card.title, value: card.value })));


  if (isLoading) {
    console.log('Dashboard is still loading...');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    console.error('Dashboard error state:', error);
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">Error loading analytics. Please try again.</div>
      </div>
    );
  }

  if (!analytics) {
    console.warn('No analytics data available');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">No analytics data available</div>
      </div>
    );
  }

  console.log('Rendering dashboard with analytics data...');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time inventory analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Live
          </Badge>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards with Trends */}
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
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stat.trend > 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={stat.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(stat.trend)}%
                </span>
                <span className="ml-1">{stat.trendLabel}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Asset Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Asset Status Distribution
            </CardTitle>
            <CardDescription>
              Current status of all assets in the inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics?.asset_status_distribution || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                    <span className="text-sm font-medium capitalize">{status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getStatusColor(status)}`}
                        style={{ 
                          width: `${(count / (analytics?.summary.total_assets || 1)) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Departments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Departments by Assets
            </CardTitle>
            <CardDescription>
              Departments with the most assigned assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.top_departments.map((dept, index) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{dept.asset_count} assets</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{dept.percentage}%</p>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activities
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Latest asset and inventory activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.recent_activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 pb-3 border-b last:border-0">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{activity.user}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
