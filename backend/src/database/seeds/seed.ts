import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../../config/database.config';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.entity';
import { Permission } from '../../entities/permission.entity';
import { ProductCategory } from '../../entities/product-category.entity';
import { Product } from '../../entities/product.entity';
import { TaxConfiguration } from '../../entities/tax-configuration.entity';
import { PrinterConfiguration, PrinterType, ConnectionType } from '../../entities/printer-configuration.entity';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    // Clear existing data
    await AppDataSource.query('TRUNCATE TABLE users, user_roles, permissions, role_permissions, product_categories, products, tax_configurations, printer_configurations RESTART IDENTITY CASCADE');

    // Create permissions
    const permissions = [
      { name: 'dashboard:read', resource: 'dashboard', action: 'read', description: 'View dashboard' },
      { name: 'pos:use', resource: 'pos', action: 'use', description: 'Use POS system' },
      { name: 'products:read', resource: 'products', action: 'read', description: 'View products' },
      { name: 'products:create', resource: 'products', action: 'create', description: 'Create products' },
      { name: 'products:update', resource: 'products', action: 'update', description: 'Update products' },
      { name: 'products:delete', resource: 'products', action: 'delete', description: 'Delete products' },
      { name: 'orders:read', resource: 'orders', action: 'read', description: 'View orders' },
      { name: 'orders:create', resource: 'orders', action: 'create', description: 'Create orders' },
      { name: 'orders:update', resource: 'orders', action: 'update', description: 'Update orders' },
      { name: 'customers:read', resource: 'customers', action: 'read', description: 'View customers' },
      { name: 'reports:read', resource: 'reports', action: 'read', description: 'View reports' },
      { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
      { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
      { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
      { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
      { name: 'settings:read', resource: 'settings', action: 'read', description: 'View settings' },
      { name: 'settings:update', resource: 'settings', action: 'update', description: 'Update settings' },
      { name: 'printers:read', resource: 'printers', action: 'read', description: 'View printers' },
      { name: 'printers:create', resource: 'printers', action: 'create', description: 'Create printers' },
      { name: 'printers:update', resource: 'printers', action: 'update', description: 'Update printers' },
      { name: 'payments:read', resource: 'payments', action: 'read', description: 'View payments' },
      { name: 'payments:create', resource: 'payments', action: 'create', description: 'Create payments' },
      { name: 'full_access', resource: '*', action: '*', description: 'Full system access' }
    ];

    const savedPermissions = [];
    for (const permData of permissions) {
      const permission = AppDataSource.getRepository(Permission).create(permData);
      const saved = await AppDataSource.getRepository(Permission).save(permission);
      savedPermissions.push(saved);
    }

    // Create roles
    const adminRole = AppDataSource.getRepository(UserRole).create({
      name: 'Admin',
      description: 'Full system access',
      permissions: savedPermissions
    });
    const savedAdminRole = await AppDataSource.getRepository(UserRole).save(adminRole);

    const managerPermissions = savedPermissions.filter(p => 
      p.name.includes('dashboard') || 
      p.name.includes('pos') || 
      p.name.includes('products') || 
      p.name.includes('orders') || 
      p.name.includes('customers') || 
      p.name.includes('reports') ||
      p.name.includes('printers:read')
    );
    const managerRole = AppDataSource.getRepository(UserRole).create({
      name: 'Manager',
      description: 'Manager access with reporting',
      permissions: managerPermissions
    });
    const savedManagerRole = await AppDataSource.getRepository(UserRole).save(managerRole);

    const cashierPermissions = savedPermissions.filter(p => 
      p.name.includes('dashboard') || 
      p.name.includes('pos') || 
      p.name.includes('products:read') || 
      p.name.includes('orders:read') || 
      p.name.includes('orders:create')
    );
    const cashierRole = AppDataSource.getRepository(UserRole).create({
      name: 'Cashier',
      description: 'Basic POS access',
      permissions: cashierPermissions
    });
    const savedCashierRole = await AppDataSource.getRepository(UserRole).save(cashierRole);

    // Create users
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = AppDataSource.getRepository(User).create({
      username: 'admin',
      email: 'admin@theloft.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '+91 9876543210',
      roleId: savedAdminRole.id,
      isActive: true
    });
    await AppDataSource.getRepository(User).save(adminUser);

    const managerPassword = await bcrypt.hash('manager123', 12);
    const managerUser = AppDataSource.getRepository(User).create({
      username: 'manager',
      email: 'manager@theloft.com',
      password: managerPassword,
      firstName: 'Manager',
      lastName: 'User',
      phoneNumber: '+91 9876543211',
      roleId: savedManagerRole.id,
      isActive: true
    });
    await AppDataSource.getRepository(User).save(managerUser);

    const cashierPassword = await bcrypt.hash('cashier123', 12);
    const cashierUser = AppDataSource.getRepository(User).create({
      username: 'cashier',
      email: 'cashier@theloft.com',
      password: cashierPassword,
      firstName: 'Cashier',
      lastName: 'User',
      phoneNumber: '+91 9876543212',
      roleId: savedCashierRole.id,
      isActive: true
    });
    await AppDataSource.getRepository(User).save(cashierUser);

    // Create product categories
    const categories = [
      { name: 'Snacks', description: 'Popcorn, Nachos, etc', displayOrder: 1 },
      { name: 'Beverages', description: 'Soft drinks, Coffee, etc', displayOrder: 2 },
      { name: 'Combos', description: 'Meal combos', displayOrder: 3 },
      { name: 'Ice Cream', description: 'Frozen treats', displayOrder: 4 },
      { name: 'Hot Food', description: 'Hot dogs, sandwiches', displayOrder: 5 }
    ];

    const savedCategories = [];
    for (const catData of categories) {
      const category = AppDataSource.getRepository(ProductCategory).create(catData);
      const saved = await AppDataSource.getRepository(ProductCategory).save(category);
      savedCategories.push(saved);
    }

    // Create products
    const products = [
      {
        name: 'Popcorn Large',
        description: 'Buttery large popcorn',
        price: 150.00,
        costPrice: 75.00,
        imageUrl: 'https://images.pexels.com/photos/1056251/pexels-photo-1056251.jpeg',
        stockQuantity: 100,
        categoryId: savedCategories[0].id
      },
      {
        name: 'Popcorn Medium',
        description: 'Buttery medium popcorn',
        price: 120.00,
        costPrice: 60.00,
        imageUrl: 'https://images.pexels.com/photos/1056251/pexels-photo-1056251.jpeg',
        stockQuantity: 100,
        categoryId: savedCategories[0].id
      },
      {
        name: 'Nachos with Cheese',
        description: 'Crispy nachos with cheese dip',
        price: 120.00,
        costPrice: 60.00,
        imageUrl: 'https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg',
        stockQuantity: 50,
        categoryId: savedCategories[0].id
      },
      {
        name: 'Coke 500ml',
        description: 'Chilled Coca-Cola',
        price: 80.00,
        costPrice: 40.00,
        imageUrl: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg',
        stockQuantity: 200,
        categoryId: savedCategories[1].id
      },
      {
        name: 'Pepsi 500ml',
        description: 'Chilled Pepsi',
        price: 80.00,
        costPrice: 40.00,
        imageUrl: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg',
        stockQuantity: 200,
        categoryId: savedCategories[1].id
      },
      {
        name: 'Coffee',
        description: 'Hot freshly brewed coffee',
        price: 60.00,
        costPrice: 20.00,
        imageUrl: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
        stockQuantity: 100,
        categoryId: savedCategories[1].id
      },
      {
        name: 'Movie Combo',
        description: 'Large popcorn + Large drink',
        price: 200.00,
        costPrice: 100.00,
        imageUrl: 'https://images.pexels.com/photos/1658967/pexels-photo-1658967.jpeg',
        stockQuantity: 50,
        categoryId: savedCategories[2].id
      },
      {
        name: 'Family Combo',
        description: '2 Large popcorn + 2 Large drinks',
        price: 350.00,
        costPrice: 175.00,
        imageUrl: 'https://images.pexels.com/photos/1658967/pexels-photo-1658967.jpeg',
        stockQuantity: 30,
        categoryId: savedCategories[2].id
      },
      {
        name: 'Vanilla Ice Cream',
        description: 'Premium vanilla ice cream',
        price: 60.00,
        costPrice: 30.00,
        imageUrl: 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg',
        stockQuantity: 50,
        categoryId: savedCategories[3].id
      },
      {
        name: 'Chocolate Ice Cream',
        description: 'Rich chocolate ice cream',
        price: 60.00,
        costPrice: 30.00,
        imageUrl: 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg',
        stockQuantity: 50,
        categoryId: savedCategories[3].id
      },
      {
        name: 'Hot Dog',
        description: 'Classic hot dog with toppings',
        price: 100.00,
        costPrice: 50.00,
        imageUrl: 'https://images.pexels.com/photos/4676410/pexels-photo-4676410.jpeg',
        stockQuantity: 40,
        categoryId: savedCategories[4].id
      },
      {
        name: 'Chicken Sandwich',
        description: 'Grilled chicken sandwich',
        price: 150.00,
        costPrice: 75.00,
        imageUrl: 'https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg',
        stockQuantity: 30,
        categoryId: savedCategories[4].id
      }
    ];

    for (const prodData of products) {
      const product = AppDataSource.getRepository(Product).create(prodData);
      await AppDataSource.getRepository(Product).save(product);
    }

    // Create tax configurations
    const taxConfigs = [
      { name: 'GST 18%', rate: 0.18, description: 'Standard GST rate', isDefault: true },
      { name: 'GST 12%', rate: 0.12, description: 'Reduced GST rate', isDefault: false },
      { name: 'GST 5%', rate: 0.05, description: 'Low GST rate', isDefault: false }
    ];

    for (const taxData of taxConfigs) {
      const taxConfig = AppDataSource.getRepository(TaxConfiguration).create(taxData);
      await AppDataSource.getRepository(TaxConfiguration).save(taxConfig);
    }

    // Create printer configurations
    const printerConfigs = [
      {
        name: 'Main Counter Printer',
        type: PrinterType.THERMAL,
        connectionType: ConnectionType.NETWORK,
        ipAddress: '192.168.1.100',
        port: 9100,
        paperWidth: 80,
        isDefault: true
      },
      {
        name: 'Kitchen Printer',
        type: PrinterType.THERMAL,
        connectionType: ConnectionType.NETWORK,
        ipAddress: '192.168.1.101',
        port: 9100,
        paperWidth: 80,
        isDefault: false
      }
    ];

    for (const printerData of printerConfigs) {
      const printer = AppDataSource.getRepository(PrinterConfiguration).create(printerData);
      await AppDataSource.getRepository(PrinterConfiguration).save(printer);
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Default Users Created:');
    console.log('Admin: admin@theloft.com / admin123');
    console.log('Manager: manager@theloft.com / manager123');
    console.log('Cashier: cashier@theloft.com / cashier123');
    console.log('\n🏪 Products: 12 items across 5 categories');
    console.log('🖨️  Printers: 2 thermal printer configurations');
    console.log('💰 Tax: 3 tax configurations (18% GST default)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();