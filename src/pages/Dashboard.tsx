import React from 'react';
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  Clock
} from 'lucide-react';
import { ordersAPI, paymentsAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { title: 'Today\'s Sales', value: '₹0', change: '+0%', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Orders Today', value: '0', change: '+0%', icon: ShoppingCart, color: 'bg-blue-500' },
    { title: 'Customers', value: '0', change: '+0%', icon: Users, color: 'bg-purple-500' },
    { title: 'Products', value: '0', change: '+0%', icon: Package, color: 'bg-orange-500' }
  ]);
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's sales
      const dailySalesResponse = await ordersAPI.getDailySales(today);
      const { totalSales, totalOrders } = dailySalesResponse.data;
      
      // Get recent orders
      const ordersResponse = await ordersAPI.getAll({ page: 1, limit: 4 });
      const orders = ordersResponse.data.orders;
      
      // Get top products for the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const topProductsResponse = await ordersAPI.getTopProducts(
        weekAgo.toISOString().split('T')[0],
        today,
        4
      );
      
      // Update stats
      setStats([
        {
          title: 'Today\'s Sales',
          value: `₹${totalSales.toLocaleString()}`,
          change: '+12.5%', // You can calculate this based on yesterday's data
          icon: DollarSign,
          color: 'bg-green-500'
        },
        {
          title: 'Orders Today',
          value: totalOrders.toString(),
          change: '+8.2%',
          icon: ShoppingCart,
          color: 'bg-blue-500'
        },
        {
          title: 'Customers',
          value: '1,234', // This would come from a customer count API
          change: '+5.4%',
          icon: Users,
          color: 'bg-purple-500'
        },
        {
          title: 'Products',
          value: '456', // This would come from products count API
          change: '+2.1%',
          icon: Package,
          color: 'bg-orange-500'
        }
      ]);
      
      // Format recent orders
      const formattedOrders = orders.map(order => ({
        id: order.orderNumber,
        customer: order.customerName || 'Walk-in Customer',
        amount: `₹${order.totalAmount}`,
        status: order.status,
        time: new Date(order.createdAt).toLocaleString()
      }));
      setRecentOrders(formattedOrders);
      
      // Format top products
      const formattedProducts = topProductsResponse.data.map(product => ({
        name: product.productName,
        sold: parseInt(product.totalQuantity),
        revenue: `₹${parseFloat(product.totalRevenue).toLocaleString()}`
      }));
      setTopProducts(formattedProducts);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="animate-pulse">
                <div className="bg-gray-200 h-4 w-20 rounded mb-2"></div>
                <div className="bg-gray-200 h-8 w-16 rounded mb-1"></div>
                <div className="bg-gray-200 h-3 w-12 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <p className="text-green-600 text-sm mt-1 font-medium">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
              <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{order.amount}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'Preparing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-500">{order.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Top Products Today</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.sold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all">
            <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">New Sale</span>
          </button>
          <button className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Package className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Add Product</span>
          </button>
          <button className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">View Reports</span>
          </button>
          <button className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Order History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;