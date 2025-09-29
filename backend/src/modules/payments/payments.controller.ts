import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import { PaymentMethod, PaymentStatus } from '../../entities/payment.entity';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly auditService: AuditService,
  ) {}

  @ApiOperation({ summary: 'Create Razorpay order' })
  @Post('razorpay/create-order')
  async createRazorpayOrder(
    @Body('orderId') orderId: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const razorpayOrder = await this.paymentsService.createRazorpayOrder(orderId);
    
    await this.auditService.log({
      action: 'CREATE_RAZORPAY_ORDER',
      resource: 'payments',
      resourceId: orderId,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { razorpayOrderId: razorpayOrder.razorpayOrderId },
    });

    return razorpayOrder;
  }

  @ApiOperation({ summary: 'Verify Razorpay payment' })
  @Post('razorpay/verify')
  async verifyRazorpayPayment(
    @Body() verifyPaymentDto: VerifyPaymentDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const payment = await this.paymentsService.verifyRazorpayPayment(verifyPaymentDto);
    
    await this.auditService.log({
      action: 'VERIFY_RAZORPAY_PAYMENT',
      resource: 'payments',
      resourceId: payment.id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { paymentId: payment.razorpayPaymentId },
    });

    return payment;
  }

  @ApiOperation({ summary: 'Process manual payment (cash/card/UPI)' })
  @Post('manual')
  async processManualPayment(
    @Body('orderId') orderId: string,
    @Body('method') method: PaymentMethod,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const payment = await this.paymentsService.processManualPayment(orderId, method);
    
    await this.auditService.log({
      action: 'PROCESS_MANUAL_PAYMENT',
      resource: 'payments',
      resourceId: payment.id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { method, orderId },
    });

    return payment;
  }

  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PaymentStatus,
    @Query('method') method?: PaymentMethod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    
    return this.paymentsService.findAll(page, limit, status, method, startDateObj, endDateObj);
  }

  @ApiOperation({ summary: 'Get payment by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @ApiOperation({ summary: 'Refund payment' })
  @Patch(':id/refund')
  async refund(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const payment = await this.paymentsService.refundPayment(id, reason);
    
    await this.auditService.log({
      action: 'REFUND_PAYMENT',
      resource: 'payments',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { reason },
    });

    return payment;
  }

  @ApiOperation({ summary: 'Get payment summary' })
  @Get('analytics/summary')
  getPaymentSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    
    return this.paymentsService.getPaymentSummary(startDateObj, endDateObj);
  }
}