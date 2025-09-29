import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import { PrinterConfiguration, PrinterType, ConnectionType } from '../../entities/printer-configuration.entity';
import { Order } from '../../entities/order.entity';

@Injectable()
export class PrinterService {
  constructor(
    @InjectRepository(PrinterConfiguration)
    private readonly printerRepository: Repository<PrinterConfiguration>,
    private configService: ConfigService,
  ) {}

  async findAll(): Promise<PrinterConfiguration[]> {
    return await this.printerRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<PrinterConfiguration> {
    const printer = await this.printerRepository.findOne({ where: { id } });
    if (!printer) {
      throw new NotFoundException('Printer configuration not found');
    }
    return printer;
  }

  async create(printerData: Partial<PrinterConfiguration>): Promise<PrinterConfiguration> {
    // If this is set as default, unset other defaults
    if (printerData.isDefault) {
      await this.printerRepository.update({}, { isDefault: false });
    }

    const printer = this.printerRepository.create(printerData);
    return await this.printerRepository.save(printer);
  }

  async update(id: string, updateData: Partial<PrinterConfiguration>): Promise<PrinterConfiguration> {
    // If this is set as default, unset other defaults
    if (updateData.isDefault) {
      await this.printerRepository.update({}, { isDefault: false });
    }

    await this.printerRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.printerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Printer configuration not found');
    }
  }

  async getDefaultPrinter(): Promise<PrinterConfiguration> {
    const printer = await this.printerRepository.findOne({
      where: { isDefault: true, isActive: true },
    });
    
    if (!printer) {
      throw new NotFoundException('No default printer configured');
    }
    
    return printer;
  }

  async printReceipt(order: Order, printerId?: string): Promise<void> {
    const printer = printerId 
      ? await this.findById(printerId)
      : await this.getDefaultPrinter();

    const receiptData = this.generateReceiptData(order, printer);
    
    if (printer.connectionType === ConnectionType.NETWORK) {
      await this.printToNetworkPrinter(printer, receiptData);
    } else {
      throw new Error('Only network printers are currently supported');
    }
  }

  private generateReceiptData(order: Order, printer: PrinterConfiguration): string {
    const width = printer.paperWidth || 80;
    const line = '='.repeat(width);
    const halfLine = '-'.repeat(width);
    
    let receipt = '';
    
    // Header
    receipt += this.centerText('THE LOFT COIMBATORE', width) + '\n';
    receipt += this.centerText('Theatre Concessions', width) + '\n';
    receipt += this.centerText('https://theloftscreening.com', width) + '\n';
    receipt += line + '\n';
    
    // Order info
    receipt += `Order: ${order.orderNumber}\n`;
    receipt += `Date: ${new Date(order.createdAt).toLocaleString()}\n`;
    receipt += `Cashier: ${order.createdBy?.firstName} ${order.createdBy?.lastName}\n`;
    
    if (order.customerName) {
      receipt += `Customer: ${order.customerName}\n`;
    }
    if (order.customerPhone) {
      receipt += `Phone: ${order.customerPhone}\n`;
    }
    
    receipt += halfLine + '\n';
    
    // Items
    receipt += this.padText('ITEM', 'QTY', 'PRICE', 'TOTAL', width) + '\n';
    receipt += halfLine + '\n';
    
    for (const item of order.items) {
      const name = item.product.name.length > 20 
        ? item.product.name.substring(0, 17) + '...'
        : item.product.name;
      
      receipt += this.padText(
        name,
        item.quantity.toString(),
        `₹${item.unitPrice.toFixed(2)}`,
        `₹${item.totalPrice.toFixed(2)}`,
        width
      ) + '\n';
      
      if (item.notes) {
        receipt += `  Note: ${item.notes}\n`;
      }
    }
    
    receipt += halfLine + '\n';
    
    // Totals
    receipt += this.padRight(`Subtotal: ₹${order.subtotal.toFixed(2)}`, width) + '\n';
    receipt += this.padRight(`Tax (18%): ₹${order.taxAmount.toFixed(2)}`, width) + '\n';
    
    if (order.discountAmount > 0) {
      receipt += this.padRight(`Discount: -₹${order.discountAmount.toFixed(2)}`, width) + '\n';
    }
    
    receipt += line + '\n';
    receipt += this.padRight(`TOTAL: ₹${order.totalAmount.toFixed(2)}`, width) + '\n';
    receipt += line + '\n';
    
    // Footer
    receipt += '\n';
    receipt += this.centerText('Thank you for visiting!', width) + '\n';
    receipt += this.centerText('Enjoy the show!', width) + '\n';
    receipt += '\n\n\n';
    
    // Cut command for thermal printers
    receipt += '\x1D\x56\x00'; // ESC/POS cut command
    
    return receipt;
  }

  private async printToNetworkPrinter(printer: PrinterConfiguration, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      
      client.connect(printer.port || 9100, printer.ipAddress, () => {
        client.write(data);
        client.end();
      });
      
      client.on('close', () => {
        resolve();
      });
      
      client.on('error', (err) => {
        reject(new Error(`Printer connection failed: ${err.message}`));
      });
      
      // Timeout after 10 seconds
      client.setTimeout(10000, () => {
        client.destroy();
        reject(new Error('Printer connection timeout'));
      });
    });
  }

  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private padRight(text: string, width: number): string {
    return text + ' '.repeat(Math.max(0, width - text.length));
  }

  private padText(col1: string, col2: string, col3: string, col4: string, width: number): string {
    const col1Width = Math.floor(width * 0.4);
    const col2Width = Math.floor(width * 0.1);
    const col3Width = Math.floor(width * 0.2);
    const col4Width = width - col1Width - col2Width - col3Width;
    
    return (
      col1.substring(0, col1Width).padEnd(col1Width) +
      col2.substring(0, col2Width).padEnd(col2Width) +
      col3.substring(0, col3Width).padEnd(col3Width) +
      col4.substring(0, col4Width).padEnd(col4Width)
    );
  }

  async testPrinter(id: string): Promise<void> {
    const printer = await this.findById(id);
    const testData = this.generateTestReceipt(printer);
    
    if (printer.connectionType === ConnectionType.NETWORK) {
      await this.printToNetworkPrinter(printer, testData);
    } else {
      throw new Error('Only network printers are currently supported');
    }
  }

  private generateTestReceipt(printer: PrinterConfiguration): string {
    const width = printer.paperWidth || 80;
    const line = '='.repeat(width);
    
    let receipt = '';
    receipt += this.centerText('PRINTER TEST', width) + '\n';
    receipt += this.centerText('THE LOFT COIMBATORE', width) + '\n';
    receipt += line + '\n';
    receipt += `Printer: ${printer.name}\n`;
    receipt += `Type: ${printer.type}\n`;
    receipt += `Connection: ${printer.connectionType}\n`;
    receipt += `Date: ${new Date().toLocaleString()}\n`;
    receipt += line + '\n';
    receipt += this.centerText('Test successful!', width) + '\n';
    receipt += '\n\n\n';
    receipt += '\x1D\x56\x00'; // Cut command
    
    return receipt;
  }
}