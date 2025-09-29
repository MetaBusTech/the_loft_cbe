import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxConfiguration } from '../../entities/tax-configuration.entity';
import { PrinterConfiguration } from '../../entities/printer-configuration.entity';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(TaxConfiguration)
    private readonly taxConfigRepository: Repository<TaxConfiguration>,
    @InjectRepository(PrinterConfiguration)
    private readonly printerConfigRepository: Repository<PrinterConfiguration>,
  ) {}

  // Tax Configuration methods
  async createTaxConfig(taxData: Partial<TaxConfiguration>): Promise<TaxConfiguration> {
    // If this is set as default, unset other defaults
    if (taxData.isDefault) {
      await this.taxConfigRepository.update({}, { isDefault: false });
    }

    const taxConfig = this.taxConfigRepository.create(taxData);
    return await this.taxConfigRepository.save(taxConfig);
  }

  async findAllTaxConfigs(): Promise<TaxConfiguration[]> {
    return await this.taxConfigRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findTaxConfigById(id: string): Promise<TaxConfiguration> {
    const taxConfig = await this.taxConfigRepository.findOne({ where: { id } });
    if (!taxConfig) {
      throw new NotFoundException('Tax configuration not found');
    }
    return taxConfig;
  }

  async updateTaxConfig(id: string, updateData: Partial<TaxConfiguration>): Promise<TaxConfiguration> {
    // If this is set as default, unset other defaults
    if (updateData.isDefault) {
      await this.taxConfigRepository.update({}, { isDefault: false });
    }

    await this.taxConfigRepository.update(id, updateData);
    return this.findTaxConfigById(id);
  }

  async removeTaxConfig(id: string): Promise<void> {
    const result = await this.taxConfigRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Tax configuration not found');
    }
  }

  async getDefaultTaxConfig(): Promise<TaxConfiguration> {
    const taxConfig = await this.taxConfigRepository.findOne({
      where: { isDefault: true, isActive: true },
    });
    
    if (!taxConfig) {
      throw new NotFoundException('No default tax configuration found');
    }
    
    return taxConfig;
  }

  // Printer Configuration methods
  async createPrinterConfig(printerData: Partial<PrinterConfiguration>): Promise<PrinterConfiguration> {
    // If this is set as default, unset other defaults
    if (printerData.isDefault) {
      await this.printerConfigRepository.update({}, { isDefault: false });
    }

    const printerConfig = this.printerConfigRepository.create(printerData);
    return await this.printerConfigRepository.save(printerConfig);
  }

  async findAllPrinterConfigs(): Promise<PrinterConfiguration[]> {
    return await this.printerConfigRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findPrinterConfigById(id: string): Promise<PrinterConfiguration> {
    const printerConfig = await this.printerConfigRepository.findOne({ where: { id } });
    if (!printerConfig) {
      throw new NotFoundException('Printer configuration not found');
    }
    return printerConfig;
  }

  async updatePrinterConfig(id: string, updateData: Partial<PrinterConfiguration>): Promise<PrinterConfiguration> {
    // If this is set as default, unset other defaults
    if (updateData.isDefault) {
      await this.printerConfigRepository.update({}, { isDefault: false });
    }

    await this.printerConfigRepository.update(id, updateData);
    return this.findPrinterConfigById(id);
  }

  async removePrinterConfig(id: string): Promise<void> {
    const result = await this.printerConfigRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Printer configuration not found');
    }
  }

  async getDefaultPrinterConfig(): Promise<PrinterConfiguration> {
    const printerConfig = await this.printerConfigRepository.findOne({
      where: { isDefault: true, isActive: true },
    });
    
    if (!printerConfig) {
      throw new NotFoundException('No default printer configuration found');
    }
    
    return printerConfig;
  }
}