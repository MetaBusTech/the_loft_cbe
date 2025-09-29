import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrinterService } from './printer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import { PrinterConfiguration } from '../../entities/printer-configuration.entity';

@ApiTags('Printers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('printers')
export class PrinterController {
  constructor(
    private readonly printerService: PrinterService,
    private readonly auditService: AuditService,
  ) {}

  @ApiOperation({ summary: 'Create printer configuration' })
  @Post()
  async create(
    @Body() printerData: Partial<PrinterConfiguration>,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const printer = await this.printerService.create(printerData);
    
    await this.auditService.log({
      action: 'CREATE_PRINTER',
      resource: 'printers',
      resourceId: printer.id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { created: printerData },
    });

    return printer;
  }

  @ApiOperation({ summary: 'Get all printers' })
  @Get()
  findAll() {
    return this.printerService.findAll();
  }

  @ApiOperation({ summary: 'Get printer by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.printerService.findById(id);
  }

  @ApiOperation({ summary: 'Update printer' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<PrinterConfiguration>,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldPrinter = await this.printerService.findById(id);
    const updatedPrinter = await this.printerService.update(id, updateData);
    
    await this.auditService.log({
      action: 'UPDATE_PRINTER',
      resource: 'printers',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { old: oldPrinter, new: updateData },
    });

    return updatedPrinter;
  }

  @ApiOperation({ summary: 'Delete printer' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const printer = await this.printerService.findById(id);
    await this.printerService.remove(id);
    
    await this.auditService.log({
      action: 'DELETE_PRINTER',
      resource: 'printers',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { deleted: printer },
    });

    return { message: 'Printer deleted successfully' };
  }

  @ApiOperation({ summary: 'Test printer' })
  @Post(':id/test')
  async testPrinter(
    @Param('id') id: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    try {
      await this.printerService.testPrinter(id);
      
      await this.auditService.log({
        action: 'TEST_PRINTER',
        resource: 'printers',
        resourceId: id,
        userId: req.user.id,
        userEmail: req.user.email,
        ipAddress: ip,
        userAgent,
      });

      return { message: 'Printer test successful' };
    } catch (error) {
      return { message: 'Printer test failed', error: error.message };
    }
  }

  @ApiOperation({ summary: 'Get default printer' })
  @Get('default/current')
  getDefaultPrinter() {
    return this.printerService.getDefaultPrinter();
  }
}