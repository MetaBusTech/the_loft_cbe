import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Settings,
  Printer,
  CreditCard,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { hasPermission } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard:read' },
    { to: '/pos', icon: ShoppingCart, label: 'Point of Sale', permission: 'pos:use' },
    { to: '/products', icon: Package, label: 'Products', permission: 'products:read' },
    { to: '/orders', icon: FileText, label: 'Orders', permission: 'orders:read' },
    { to: '/customers', icon: Users, label: 'Customers', permission: 'customers:read' },
    { to: '/reports', icon: Activity, label: 'Reports', permission: 'reports:read' },
    { to: '/users', icon: Shield, label: 'User Management', permission: 'users:read' },
    { to: '/settings', icon: Settings, label: 'Settings', permission: 'settings:read' },
    { to: '/printers', icon: Printer, label: 'Printers', permission: 'printers:read' },
    { to: '/payments', icon: CreditCard, label: 'Payment Config', permission: 'payments:read' }
  ];

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">L</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">The Loft</h1>
          <p className="text-gray-400 text-sm">Coimbatore</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          if (!hasPermission(item.permission.split(':')[0], item.permission.split(':')[1])) {
            return null;
          }
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;