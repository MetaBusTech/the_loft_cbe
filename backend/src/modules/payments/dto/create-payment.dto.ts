import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsUUID, Min } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../../../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-of-order' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 250.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, required: false })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ example: 'razorpay_order_id', required: false })
  @IsString()
  @IsOptional()
  razorpayOrderId?: string;

  @ApiProperty({ example: 'razorpay_payment_id', required: false })
  @IsString()
  @IsOptional()
  razorpayPaymentId?: string;

  @ApiProperty({ example: 'razorpay_signature', required: false })
  @IsString()
  @IsOptional()
  razorpaySignature?: string;

  @ApiProperty({ example: 'TXN123456', required: false })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiProperty({ example: 'Payment failed due to insufficient funds', required: false })
  @IsString()
  @IsOptional()
  failureReason?: string;
}