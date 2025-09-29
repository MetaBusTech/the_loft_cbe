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
import { ConfigurationService } from './configuration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import { TaxConfiguration } from '../../entities/tax-configuration.entity';
import { PrinterConfiguration } from '../../entities/printer-configuration.entity';

@ApiTags('Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly auditService: AuditService,
  ) {}

  // Tax Configuration endpoints
  @ApiOperation({ summary: 'Create tax configuration' })
  @Post('tax')
  async createTaxConfig(
    @Body() taxData: Partial<TaxConfiguration>,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const taxConfig = await this.configurationService.createTaxConfig(taxData);
    
    await this.auditService.log({
      action: 'CREATE_TAX_CONFIG',
      resource: 'tax_configurations',
      resourceId: taxConfig.id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { created: taxData },
    });

    return taxConfig;
  }

  @ApiOperation({ summary: 'Get all tax configurations' })
  @Get('tax')
  findAllTaxConfigs() {
    return this.configurationService.findAllTaxConfigs();
  }

  @ApiOperation({ summary: 'Get tax configuration by ID' })
  @Get('tax/:id')
  findTaxConfigById(@Param('id') id: string) {
    return this.configurationService.findTaxConfigById(id);
  }

  @ApiOperation({ summary: 'Update tax configuration' })
  @Patch('tax/:id')
  async updateTaxConfig(
    @Param('id') id: string,
    @Body() updateData: Partial<TaxConfiguration>,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldConfig = await this.configurationService.findTaxConfigById(id);
    const updatedConfig = await this.configurationService.updateTaxConfig(id, updateData);
    
    await this.auditService.log({
      action: 'UPDATE_TAX_CONFIG',
      resource: 'tax_configurations',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { old: oldConfig, new: updateData },
    });

    return updatedConfig;
  }

  @ApiOperation({ summary: 'Delete tax configuration' })
  @Delete('tax/:id')
  async removeTaxConfig(
    @Param('id') id: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const taxConfig = await this.configurationService.findTaxConfigById(id);
    await this.configurationService.removeTaxConfig(id);
    
    await this.auditService.log({
      action: 'DELETE_TAX_CONFIG',
      resource: 'tax_configurations',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { deleted: taxConfig },
    });

    return { message: 'Tax configuration deleted successfully' };
  }

  @ApiOperation({ summary: 'Get default tax configuration' })
  @Get('tax/default/current')
  getDefaultTaxConfig() {
    return this.configurationService.getDefaultTaxConfig();
  }

  // Printer Configuration endpoints
  @ApiOperation({ summary: 'Create printer configuration' })
  @Post('printer')
  async createPrinterConfig(
    @Body() printerData: Partial<PrinterConfiguration>,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const printerConfig = await this.configurationService.createPrinterConfig(printerData);
    
    await this.auditService.log({
      action: 'CREATE_PRINTER_CONFIG',
      resource: 'printer_configurations',
      resourceId: printerConfig.id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { created: printerData },
    });

    return printerConfig;
  }

  @ApiOperation({ summary: 'Get all printer configurations' })
  @Get('printer')
  findAllPrinterConfigs() {
    return this.configurationService.findAllPrinterConfigs();
  }

  @ApiOperation({ summary: 'Get printer configuration by ID' })
  @Get('printer/:id')
  findPrinterConfigById(@Param('id') id: string) {
    return this.configurationService.findPrinterConfigById(id);
  }

  @ApiOperation({ summary: 'Update printer configuration' })
  @Patch('printer/:id')
  async updatePrinterConfig(
    @Param('id') id: string,
    @Body() updateData: Partial<PrinterConfiguration>,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldConfig = await this.configurationService.findPrinterConfigById(id);
    const updatedConfig = await this.configurationService.updatePrinterConfig(id, updateData);
    
    await this.auditService.log({
      action: 'UPDATE_PRINTER_CONFIG',
      resource: 'printer_configurations',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { old: oldConfig, new: updateData },
    });

    return updatedConfig;
  }

  @ApiOperation({ summary: 'Delete printer configuration' })
  @Delete('printer/:id')
  async removePrinterConfig(
    @Param('id') id: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const printerConfig = await this.configurationService.findPrinterConfigById(id);
    await this.configurationService.removePrinterConfig(id);
    
    await this.auditService.log({
      action: 'DELETE_PRINTER_CONFIG',
      resource: 'printer_configurations',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { deleted: printerConfig },
    });

    return { message: 'Printer configuration deleted successfully' };
  }

  @ApiOperation({ summary: 'Get default printer configuration' })
  @Get('printer/default/current')
  getDefaultPrinterConfig() {
    return this.configurationService.getDefaultPrinterConfig();
  }
}