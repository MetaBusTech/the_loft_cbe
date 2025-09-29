import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { PrinterService } from '../printer/printer.service';
import { OrderStatus, PaymentStatus } from '../../entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly printerService: PrinterService,
  ) {}

  @ApiOperation({ summary: 'Create a new order' })
  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const order = await this.ordersService.create(createOrderDto, req.user.id);
    
    await this.auditService.log({
      action: 'CREATE_ORDER',
      resource: 'orders',
      resourceId: order.id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { created: createOrderDto },
    });

    return order;
  }

  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    
    return this.ordersService.findAll(
      page,
      limit,
      status,
      paymentStatus,
      startDateObj,
      endDateObj,
      search,
    );
  }

  @ApiOperation({ summary: 'Get order by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @ApiOperation({ summary: 'Update order' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldOrder = await this.ordersService.findById(id);
    const updatedOrder = await this.ordersService.update(id, updateOrderDto);
    
    await this.auditService.log({
      action: 'UPDATE_ORDER',
      resource: 'orders',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { old: oldOrder, new: updateOrderDto },
    });

    return updatedOrder;
  }

  @ApiOperation({ summary: 'Update order status' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldOrder = await this.ordersService.findById(id);
    const updatedOrder = await this.ordersService.updateStatus(id, status);
    
    await this.auditService.log({
      action: 'UPDATE_ORDER_STATUS',
      resource: 'orders',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { oldStatus: oldOrder.status, newStatus: status },
    });

    return updatedOrder;
  }

  @ApiOperation({ summary: 'Update payment status' })
  @Patch(':id/payment-status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldOrder = await this.ordersService.findById(id);
    const updatedOrder = await this.ordersService.updatePaymentStatus(id, paymentStatus);
    
    // Send email confirmation if payment is successful
    if (paymentStatus === PaymentStatus.PAID && updatedOrder.customerEmail) {
      try {
        await this.emailService.sendOrderConfirmation(updatedOrder);
      } catch (error) {
        console.error('Failed to send email confirmation:', error);
      }
    }
    
    await this.auditService.log({
      action: 'UPDATE_PAYMENT_STATUS',
      resource: 'orders',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { oldPaymentStatus: oldOrder.paymentStatus, newPaymentStatus: paymentStatus },
    });

    return updatedOrder;
  }

  @ApiOperation({ summary: 'Cancel order' })
  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldOrder = await this.ordersService.findById(id);
    const cancelledOrder = await this.ordersService.cancel(id, reason);
    
    await this.auditService.log({
      action: 'CANCEL_ORDER',
      resource: 'orders',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { oldStatus: oldOrder.status, reason },
    });

    return cancelledOrder;
  }

  @ApiOperation({ summary: 'Print order receipt' })
  @Post(':id/print')
  async printReceipt(
    @Param('id') id: string,
    @Body('printerId') printerId?: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const order = await this.ordersService.findById(id);
    
    try {
      await this.printerService.printReceipt(order, printerId);
      
      await this.auditService.log({
        action: 'PRINT_RECEIPT',
        resource: 'orders',
        resourceId: id,
        userId: req.user.id,
        userEmail: req.user.email,
        ipAddress: ip,
        userAgent,
        changes: { printerId },
      });

      return { message: 'Receipt printed successfully' };
    } catch (error) {
      return { message: 'Failed to print receipt', error: error.message };
    }
  }

  @ApiOperation({ summary: 'Get daily sales' })
  @Get('analytics/daily-sales')
  getDailySales(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.ordersService.getDailySales(targetDate);
  }

  @ApiOperation({ summary: 'Get top products' })
  @Get('analytics/top-products')
  getTopProducts(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getTopProducts(
      new Date(startDate),
      new Date(endDate),
      limit,
    );
  }
}