// Core Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image?: string;
  isActive: boolean;
  taxRate: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface OrderItem {
  id?: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  discountAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'razorpay';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'draft' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface TaxConfiguration {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface PrinterConfiguration {
  id: string;
  name: string;
  type: 'thermal' | 'inkjet' | 'laser';
  connectionType: 'usb' | 'network' | 'bluetooth';
  ipAddress?: string;
  port?: number;
  isDefault: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  userEmail: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  status?: OrderStatus;
  userId?: string;
}

export interface SalesReport {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    product: Product;
    quantity: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  salesByPaymentMethod: Array<{
    method: PaymentMethod;
    count: number;
    amount: number;
  }>;
}