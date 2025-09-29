import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Product } from '../../entities/product.entity';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly productsService: ProductsService,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    const orderNumber = await this.generateOrderNumber();
    
    // Calculate totals
    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const item of createOrderDto.items) {
      const product = await this.productsService.findById(item.productId);
      const totalPrice = item.quantity * product.price;
      subtotal += totalPrice;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice,
        notes: item.notes,
      });
    }

    const taxAmount = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + taxAmount - (createOrderDto.discountAmount || 0);

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      customerName: createOrderDto.customerName,
      customerEmail: createOrderDto.customerEmail,
      customerPhone: createOrderDto.customerPhone,
      subtotal,
      taxAmount,
      discountAmount: createOrderDto.discountAmount || 0,
      totalAmount,
      notes: createOrderDto.notes,
      createdById: userId,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    for (const itemData of orderItems) {
      const orderItem = this.orderItemRepository.create({
        ...itemData,
        orderId: savedOrder.id,
      });
      await this.orderItemRepository.save(orderItem);
    }

    return this.findById(savedOrder.id);
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: OrderStatus,
    paymentStatus?: PaymentStatus,
    startDate?: Date,
    endDate?: Date,
    search?: string,
  ): Promise<{ orders: Order[]; total: number }> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.createdBy', 'createdBy')
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(order.orderNumber ILIKE :search OR order.customerName ILIKE :search OR order.customerEmail ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [orders, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { orders, total };
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'createdBy', 'payments'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    await this.orderRepository.update(id, updateOrderDto);
    return this.findById(id);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    
    // Validate status transition
    if (!this.isValidStatusTransition(order.status, status)) {
      throw new BadRequestException(`Cannot change status from ${order.status} to ${status}`);
    }

    await this.orderRepository.update(id, { status });
    return this.findById(id);
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    await this.orderRepository.update(id, { paymentStatus });
    return this.findById(id);
  }

  async cancel(id: string, reason?: string): Promise<Order> {
    const order = await this.findById(id);
    
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed order');
    }

    await this.orderRepository.update(id, {
      status: OrderStatus.CANCELLED,
      notes: order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`,
    });

    return this.findById(id);
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastOrder = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :pattern', { pattern: `ORD-${dateStr}-%` })
      .orderBy('order.orderNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop());
      sequence = lastSequence + 1;
    }

    return `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }

  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions = {
      [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    return validTransitions[currentStatus].includes(newStatus);
  }

  // Analytics methods
  async getDailySales(date: Date): Promise<{ totalSales: number; totalOrders: number }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'totalSales')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .where('order.createdAt BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
      .andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
      .getRawOne();

    return {
      totalSales: parseFloat(result.totalSales) || 0,
      totalOrders: parseInt(result.totalOrders) || 0,
    };
  }

  async getTopProducts(startDate: Date, endDate: Date, limit = 10) {
    return await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(orderItem.quantity)', 'totalQuantity')
      .addSelect('SUM(orderItem.totalPrice)', 'totalRevenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('totalRevenue', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}