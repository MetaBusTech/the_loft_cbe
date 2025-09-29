import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Popcorn Large' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Buttery large popcorn', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 75.00, required: false })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 0.18, required: false })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}