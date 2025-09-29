import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { Payment, PaymentMethod, PaymentStatus } from '../../entities/payment.entity';
import { Order } from '../../entities/order.entity';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly ordersService: OrdersService,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  async createRazorpayOrder(orderId: string): Promise<any> {
    const order = await this.ordersService.findById(orderId);
    
    const razorpayOrder = await this.razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        customerName: order.customerName || '',
        customerEmail: order.customerEmail || '',
      },
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: this.configService.get('RAZORPAY_KEY_ID'),
    };
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      paymentId: `PAY_${Date.now()}`,
    });
    
    return await this.paymentRepository.save(payment);
  }

  async verifyRazorpayPayment(verifyPaymentDto: VerifyPaymentDto): Promise<Payment> {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = verifyPaymentDto;
    
    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET'))
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Get order details
    const order = await this.ordersService.findById(orderId);
    
    // Create payment record
    const payment = await this.create({
      orderId,
      amount: order.totalAmount,
      method: PaymentMethod.RAZORPAY,
      status: PaymentStatus.SUCCESS,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      transactionId: razorpayPaymentId,
    });

    // Update order payment status
    await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID as any);

    return payment;
  }

  async processManualPayment(orderId: string, method: PaymentMethod): Promise<Payment> {
    const order = await this.ordersService.findById(orderId);
    
    const payment = await this.create({
      orderId,
      amount: order.totalAmount,
      method,
      status: PaymentStatus.SUCCESS,
      transactionId: `${method.toUpperCase()}_${Date.now()}`,
    });

    // Update order payment status
    await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID as any);

    return payment;
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: PaymentStatus,
    method?: PaymentMethod,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ payments: Payment[]; total: number }> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .orderBy('payment.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (method) {
      queryBuilder.andWhere('payment.method = :method', { method });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [payments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { payments, total };
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async refundPayment(id: string, reason?: string): Promise<Payment> {
    const payment = await this.findById(id);
    
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    // For Razorpay payments, initiate refund
    if (payment.method === PaymentMethod.RAZORPAY && payment.razorpayPaymentId) {
      try {
        await this.razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(payment.amount * 100), // Amount in paise
          notes: { reason: reason || 'Customer request' },
        });
      } catch (error) {
        throw new BadRequestException(`Refund failed: ${error.message}`);
      }
    }

    // Update payment status
    await this.paymentRepository.update(id, {
      status: PaymentStatus.REFUNDED,
      failureReason: reason,
    });

    // Update order payment status
    await this.ordersService.updatePaymentStatus(payment.orderId, PaymentStatus.REFUNDED as any);

    return this.findById(id);
  }

  async getPaymentSummary(startDate?: Date, endDate?: Date) {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.method', 'method')
      .addSelect('payment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'totalAmount')
      .groupBy('payment.method')
      .addGroupBy('payment.status');

    if (startDate && endDate) {
      queryBuilder.andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return await queryBuilder.getRawMany();
  }
}