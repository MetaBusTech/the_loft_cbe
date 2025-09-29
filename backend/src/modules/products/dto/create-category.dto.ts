import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Snacks' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Popcorn, Nachos, etc', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}