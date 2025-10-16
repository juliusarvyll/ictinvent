import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Computer,
  Users,
  Shield,
  FileText,
  Building2,
  Hash,
  LogOut,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: null },
    { icon: Building2, label: 'Departments', path: '/departments', permission: 'view departments' },
    { icon: FileText, label: 'Categories', path: '/categories', permission: 'view categories' },
    { icon: Package, label: 'Assets', path: '/assets', permission: 'view assets' },
    { icon: Hash, label: 'Serial Numbers', path: '/serial-numbers', permission: 'view assets' },
    { icon: Computer, label: 'Computers', path: '/computers', permission: 'view computers' },
    { icon: FileText, label: 'Borrowings', path: '/borrowings', permission: 'view borrowings' },
    { icon: Users, label: 'Users', path: '/users', permission: 'view users' },
    { icon: Shield, label: 'Roles', path: '/roles', permission: 'view users' },
    { icon: FileText, label: 'Audit Logs', path: '/audit-logs', permission: 'view logs' },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64 lg:w-64' : 'w-64 lg:w-20'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {sidebarOpen && <h1 className="text-lg sm:text-xl font-bold">ICT Inventory</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setMobileMenuOpen(false);
            }}
            className="hidden lg:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-sm sm:text-lg font-semibold truncate">Welcome, {user?.name}</h2>
          </div>
          <Button variant="outline" onClick={handleLogout} size="sm" className="sm:size-default">
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
