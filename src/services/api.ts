import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (userData: any) =>
    api.post('/auth/register', userData),
  getProfile: () =>
    api.get('/auth/profile'),
  changePassword: (passwordData: any) =>
    api.post('/auth/change-password', passwordData),
  logout: () =>
    api.post('/auth/logout'),
};

// Products API
export const productsAPI = {
  getAll: (params?: any) =>
    api.get('/products', { params }),
  getById: (id: string) =>
    api.get(`/products/${id}`),
  create: (productData: any) =>
    api.post('/products', productData),
  update: (id: string, productData: any) =>
    api.patch(`/products/${id}`, productData),
  delete: (id: string) =>
    api.delete(`/products/${id}`),
  updateStock: (id: string, quantity: number) =>
    api.patch(`/products/${id}/stock`, { quantity }),
  getLowStock: () =>
    api.get('/products/stock/low'),
  
  // Categories
  getCategories: () =>
    api.get('/products/categories/all'),
  createCategory: (categoryData: any) =>
    api.post('/products/categories', categoryData),
  updateCategory: (id: string, categoryData: any) =>
    api.patch(`/products/categories/${id}`, categoryData),
  deleteCategory: (id: string) =>
    api.delete(`/products/categories/${id}`),
};

// Orders API
export const ordersAPI = {
  getAll: (params?: any) =>
    api.get('/orders', { params }),
  getById: (id: string) =>
    api.get(`/orders/${id}`),
  create: (orderData: any) =>
    api.post('/orders', orderData),
  update: (id: string, orderData: any) =>
    api.patch(`/orders/${id}`, orderData),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  updatePaymentStatus: (id: string, paymentStatus: string) =>
    api.patch(`/orders/${id}/payment-status`, { paymentStatus }),
  cancel: (id: string, reason?: string) =>
    api.patch(`/orders/${id}/cancel`, { reason }),
  print: (id: string, printerId?: string) =>
    api.post(`/orders/${id}/print`, { printerId }),
  getDailySales: (date?: string) =>
    api.get('/orders/analytics/daily-sales', { params: { date } }),
  getTopProducts: (startDate: string, endDate: string, limit?: number) =>
    api.get('/orders/analytics/top-products', { params: { startDate, endDate, limit } }),
};

// Payments API
export const paymentsAPI = {
  getAll: (params?: any) =>
    api.get('/payments', { params }),
  getById: (id: string) =>
    api.get(`/payments/${id}`),
  createRazorpayOrder: (orderId: string) =>
    api.post('/payments/razorpay/create-order', { orderId }),
  verifyRazorpayPayment: (paymentData: any) =>
    api.post('/payments/razorpay/verify', paymentData),
  processManualPayment: (orderId: string, method: string) =>
    api.post('/payments/manual', { orderId, method }),
  refund: (id: string, reason?: string) =>
    api.patch(`/payments/${id}/refund`, { reason }),
  getSummary: (startDate?: string, endDate?: string) =>
    api.get('/payments/analytics/summary', { params: { startDate, endDate } }),
};

// Users API
export const usersAPI = {
  getAll: (params?: any) =>
    api.get('/users', { params }),
  getById: (id: string) =>
    api.get(`/users/${id}`),
  create: (userData: any) =>
    api.post('/users', userData),
  update: (id: string, userData: any) =>
    api.patch(`/users/${id}`, userData),
  delete: (id: string) =>
    api.delete(`/users/${id}`),
  getRoles: () =>
    api.get('/users/roles/all'),
  getPermissions: () =>
    api.get('/users/permissions/all'),
};

// Reports API
export const reportsAPI = {
  getSalesReport: (startDate: string, endDate: string, params?: any) =>
    api.get('/reports/sales', { params: { startDate, endDate, ...params } }),
  getInventoryReport: () =>
    api.get('/reports/inventory'),
  getUserPerformanceReport: (startDate: string, endDate: string) =>
    api.get('/reports/user-performance', { params: { startDate, endDate } }),
  exportSalesReport: (startDate: string, endDate: string, format = 'json') =>
    api.get('/reports/sales/export', { 
      params: { startDate, endDate, format },
      responseType: format === 'csv' ? 'blob' : 'json'
    }),
};

// Configuration API
export const configAPI = {
  // Tax configurations
  getTaxConfigs: () =>
    api.get('/configuration/tax'),
  createTaxConfig: (taxData: any) =>
    api.post('/configuration/tax', taxData),
  updateTaxConfig: (id: string, taxData: any) =>
    api.patch(`/configuration/tax/${id}`, taxData),
  deleteTaxConfig: (id: string) =>
    api.delete(`/configuration/tax/${id}`),
  getDefaultTaxConfig: () =>
    api.get('/configuration/tax/default/current'),
  
  // Printer configurations
  getPrinterConfigs: () =>
    api.get('/configuration/printer'),
  createPrinterConfig: (printerData: any) =>
    api.post('/configuration/printer', printerData),
  updatePrinterConfig: (id: string, printerData: any) =>
    api.patch(`/configuration/printer/${id}`, printerData),
  deletePrinterConfig: (id: string) =>
    api.delete(`/configuration/printer/${id}`),
  getDefaultPrinterConfig: () =>
    api.get('/configuration/printer/default/current'),
};

// Printers API
export const printersAPI = {
  getAll: () =>
    api.get('/printers'),
  getById: (id: string) =>
    api.get(`/printers/${id}`),
  create: (printerData: any) =>
    api.post('/printers', printerData),
  update: (id: string, printerData: any) =>
    api.patch(`/printers/${id}`, printerData),
  delete: (id: string) =>
    api.delete(`/printers/${id}`),
  test: (id: string) =>
    api.post(`/printers/${id}/test`),
  getDefault: () =>
    api.get('/printers/default/current'),
};

// Audit API
export const auditAPI = {
  getAll: (params?: any) =>
    api.get('/audit', { params }),
  getSummary: (startDate?: string, endDate?: string) =>
    api.get('/audit/summary', { params: { startDate, endDate } }),
  getUserActivity: (userId: string, limit?: number) =>
    api.get(`/audit/user/${userId}`, { params: { limit } }),
};

export default api;