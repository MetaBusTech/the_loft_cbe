import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Get sales report' })
  @ApiQuery({ name: 'startDate', type: String })
  @ApiQuery({ name: 'endDate', type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @Get('sales')
  getSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('categoryId') categoryId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.reportsService.getSalesReport(
      new Date(startDate),
      new Date(endDate),
      categoryId,
      userId,
    );
  }

  @ApiOperation({ summary: 'Get inventory report' })
  @Get('inventory')
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @ApiOperation({ summary: 'Get user performance report' })
  @ApiQuery({ name: 'startDate', type: String })
  @ApiQuery({ name: 'endDate', type: String })
  @Get('user-performance')
  getUserPerformanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getUserPerformanceReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @ApiOperation({ summary: 'Export sales report' })
  @ApiQuery({ name: 'startDate', type: String })
  @ApiQuery({ name: 'endDate', type: String })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'] })
  @Get('sales/export')
  async exportSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'csv' | 'json' = 'json',
    @Res() res: Response,
  ) {
    const report = await this.reportsService.exportSalesReport(
      new Date(startDate),
      new Date(endDate),
      format,
    );

    const filename = `sales-report-${startDate}-to-${endDate}.${format}`;
    
    res.setHeader('Content-Type', report.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'csv') {
      res.send(report.data);
    } else {
      res.json(report.data);
    }
  }
}