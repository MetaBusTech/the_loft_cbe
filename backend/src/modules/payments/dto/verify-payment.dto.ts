import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'razorpay_order_id' })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @ApiProperty({ example: 'razorpay_payment_id' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({ example: 'razorpay_signature' })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;

  @ApiProperty({ example: 'uuid-of-order' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}