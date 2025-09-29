import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
  ) {}

  @ApiOperation({ summary: 'Create a new product' })
  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const product = await this.productsService.create(createProductDto);
    
    await this.auditService.log({
      action: 'CREATE_PRODUCT',
      resource: 'products',
      resourceId: product.id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { created: createProductDto },
    });

    return product;
  }

  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.productsService.findAll(page, limit, search, categoryId, isActive);
  }

  @ApiOperation({ summary: 'Get product by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @ApiOperation({ summary: 'Update product' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldProduct = await this.productsService.findById(id);
    const updatedProduct = await this.productsService.update(id, updateProductDto);
    
    await this.auditService.log({
      action: 'UPDATE_PRODUCT',
      resource: 'products',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { old: oldProduct, new: updateProductDto },
    });

    return updatedProduct;
  }

  @ApiOperation({ summary: 'Delete product' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const product = await this.productsService.findById(id);
    await this.productsService.remove(id);
    
    await this.auditService.log({
      action: 'DELETE_PRODUCT',
      resource: 'products',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { deleted: product },
    });

    return { message: 'Product deleted successfully' };
  }

  @ApiOperation({ summary: 'Get low stock products' })
  @Get('stock/low')
  getLowStockProducts() {
    return this.productsService.getLowStockProducts();
  }

  @ApiOperation({ summary: 'Update product stock' })
  @Patch(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const product = await this.productsService.updateStock(id, quantity);
    
    await this.auditService.log({
      action: 'UPDATE_STOCK',
      resource: 'products',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { stockChange: quantity },
    });

    return product;
  }

  // Category endpoints
  @ApiOperation({ summary: 'Create a new category' })
  @Post('categories')
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const category = await this.productsService.createCategory(createCategoryDto);
    
    await this.auditService.log({
      action: 'CREATE_CATEGORY',
      resource: 'categories',
      resourceId: category.id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { created: createCategoryDto },
    });

    return category;
  }

  @ApiOperation({ summary: 'Get all categories' })
  @Get('categories/all')
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @ApiOperation({ summary: 'Get category by ID' })
  @Get('categories/:id')
  findCategoryById(@Param('id') id: string) {
    return this.productsService.findCategoryById(id);
  }

  @ApiOperation({ summary: 'Update category' })
  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCategoryDto>,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldCategory = await this.productsService.findCategoryById(id);
    const updatedCategory = await this.productsService.updateCategory(id, updateData);
    
    await this.auditService.log({
      action: 'UPDATE_CATEGORY',
      resource: 'categories',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { old: oldCategory, new: updateData },
    });

    return updatedCategory;
  }

  @ApiOperation({ summary: 'Delete category' })
  @Delete('categories/:id')
  async removeCategory(
    @Param('id') id: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const category = await this.productsService.findCategoryById(id);
    await this.productsService.removeCategory(id);
    
    await this.auditService.log({
      action: 'DELETE_CATEGORY',
      resource: 'categories',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { deleted: category },
    });

    return { message: 'Category deleted successfully' };
  }
}