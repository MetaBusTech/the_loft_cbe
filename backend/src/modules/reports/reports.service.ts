import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, PaymentStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment } from '../../entities/payment.entity';
import { Product } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';

export interface SalesReportData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
    percentage: number;
  }>;
  salesByPaymentMethod: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  salesByHour: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
  salesByDay: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getSalesReport(
    startDate: Date,
    endDate: Date,
    categoryId?: string,
    userId?: string,
  ): Promise<SalesReportData> {
    const baseQuery = this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID });

    if (userId) {
      baseQuery.andWhere('order.createdById = :userId', { userId });
    }

    // Total sales and orders
    const totalStats = await baseQuery
      .select('SUM(order.totalAmount)', 'totalSales')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .getRawOne();

    const totalSales = parseFloat(totalStats.totalSales) || 0;
    const totalOrders = parseInt(totalStats.totalOrders) || 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Top products
    const topProductsQuery = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('product.category', 'category')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(orderItem.quantity)', 'quantity')
      .addSelect('SUM(orderItem.totalPrice)', 'revenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('revenue', 'DESC')
      .limit(10);

    if (categoryId) {
      topProductsQuery.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (userId) {
      topProductsQuery.andWhere('order.createdById = :userId', { userId });
    }

    const topProducts = await topProductsQuery.getRawMany();

    // Sales by category
    const salesByCategoryQuery = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('product.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('SUM(orderItem.totalPrice)', 'revenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('revenue', 'DESC');

    if (userId) {
      salesByCategoryQuery.andWhere('order.createdById = :userId', { userId });
    }

    const salesByCategory = await salesByCategoryQuery.getRawMany();

    // Calculate percentages for categories
    salesByCategory.forEach(category => {
      category.revenue = parseFloat(category.revenue);
      category.percentage = totalSales > 0 ? (category.revenue / totalSales) * 100 : 0;
    });

    // Sales by payment method
    const salesByPaymentMethodQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.order', 'order')
      .select('payment.method', 'method')
      .addSelect('COUNT(payment.id)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .where('payment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('payment.status = :status', { status: 'success' })
      .groupBy('payment.method')
      .orderBy('amount', 'DESC');

    if (userId) {
      salesByPaymentMethodQuery.andWhere('order.createdById = :userId', { userId });
    }

    const salesByPaymentMethod = await salesByPaymentMethodQuery.getRawMany();

    // Sales by hour
    const salesByHour = await this.orderRepository
      .createQueryBuilder('order')
      .select('EXTRACT(HOUR FROM order.createdAt)', 'hour')
      .addSelect('COUNT(order.id)', 'orders')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
      .groupBy('EXTRACT(HOUR FROM order.createdAt)')
      .orderBy('hour', 'ASC')
      .getRawMany();

    // Sales by day
    const salesByDay = await this.orderRepository
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('COUNT(order.id)', 'orders')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      topProducts: topProducts.map(p => ({
        ...p,
        quantity: parseInt(p.quantity),
        revenue: parseFloat(p.revenue),
      })),
      salesByCategory,
      salesByPaymentMethod: salesByPaymentMethod.map(p => ({
        ...p,
        count: parseInt(p.count),
        amount: parseFloat(p.amount),
      })),
      salesByHour: salesByHour.map(h => ({
        hour: parseInt(h.hour),
        orders: parseInt(h.orders),
        revenue: parseFloat(h.revenue),
      })),
      salesByDay: salesByDay.map(d => ({
        date: d.date,
        orders: parseInt(d.orders),
        revenue: parseFloat(d.revenue),
      })),
    };
  }

  async getInventoryReport(): Promise<any> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .select([
        'product.id',
        'product.name',
        'product.stockQuantity',
        'product.lowStockThreshold',
        'product.price',
        'product.costPrice',
        'category.name',
      ])
      .where('product.isActive = :isActive', { isActive: true })
      .orderBy('product.stockQuantity', 'ASC')
      .getMany();

    const lowStockProducts = products.filter(p => p.stockQuantity <= p.lowStockThreshold);
    const outOfStockProducts = products.filter(p => p.stockQuantity === 0);

    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + (product.stockQuantity * (product.costPrice || 0));
    }, 0);

    return {
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalInventoryValue,
      products,
      lowStockProducts,
      outOfStockProducts,
    };
  }

  async getUserPerformanceReport(
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const userPerformance = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.createdBy', 'user')
      .select('user.id', 'userId')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.totalAmount)', 'totalSales')
      .addSelect('AVG(order.totalAmount)', 'averageOrderValue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
      .groupBy('user.id')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .orderBy('totalSales', 'DESC')
      .getRawMany();

    return userPerformance.map(user => ({
      ...user,
      totalOrders: parseInt(user.totalOrders),
      totalSales: parseFloat(user.totalSales),
      averageOrderValue: parseFloat(user.averageOrderValue),
    }));
  }

  async exportSalesReport(
    startDate: Date,
    endDate: Date,
    format: 'csv' | 'json' = 'json',
  ): Promise<any> {
    const reportData = await this.getSalesReport(startDate, endDate);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = this.convertToCSV(reportData);
      return { data: csvData, contentType: 'text/csv' };
    }
    
    return { data: reportData, contentType: 'application/json' };
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).map(value => 
      typeof value === 'object' ? JSON.stringify(value) : value
    ).join(',');
    
    return `${headers}\n${values}`;
  }
}