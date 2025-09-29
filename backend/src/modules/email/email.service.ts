import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Order } from '../../entities/order.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransporter({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendOrderConfirmation(order: Order, pdfBuffer?: Buffer): Promise<void> {
    if (!order.customerEmail) return;

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: order.customerEmail,
      subject: `Order Confirmation - ${order.orderNumber} | The Loft Coimbatore`,
      html: this.generateOrderEmailTemplate(order),
      attachments: pdfBuffer ? [{
        filename: `invoice-${order.orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }] : [],
    };

    await this.transporter.sendMail(mailOptions);
  }

  private generateOrderEmailTemplate(order: Order): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background: #f8f9fa; }
          .total-row { font-weight: bold; background: #f8f9fa; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>The Loft Coimbatore</h1>
          <p>Thank you for your order!</p>
        </div>
        
        <div class="content">
          <h2>Order Confirmation</h2>
          <p>Dear ${order.customerName || 'Valued Customer'},</p>
          <p>Your order has been confirmed and is being prepared. Here are the details:</p>
          
          <div class="order-details">
            <h3>Order Information</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
          </div>
          
          <h3>Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.unitPrice.toFixed(2)}</td>
                  <td>₹${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td><strong>₹${order.subtotal.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td colspan="3"><strong>Tax (18%)</strong></td>
                <td><strong>₹${order.taxAmount.toFixed(2)}</strong></td>
              </tr>
              ${order.discountAmount > 0 ? `
                <tr>
                  <td colspan="3"><strong>Discount</strong></td>
                  <td><strong>-₹${order.discountAmount.toFixed(2)}</strong></td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="3"><strong>Total Amount</strong></td>
                <td><strong>₹${order.totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          
          <p>We'll notify you when your order is ready for pickup!</p>
        </div>
        
        <div class="footer">
          <p>The Loft Coimbatore</p>
          <p>Visit us at: https://theloftscreening.com</p>
          <p>Thank you for choosing The Loft!</p>
        </div>
      </body>
      </html>
    `;
  }
}