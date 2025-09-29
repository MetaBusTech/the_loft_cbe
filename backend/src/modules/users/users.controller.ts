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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const user = await this.usersService.create(createUserDto);
    
    await this.auditService.log({
      action: 'CREATE_USER',
      resource: 'users',
      resourceId: user.id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { created: createUserDto },
    });

    return user;
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'Update user' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldUser = await this.usersService.findById(id);
    const updatedUser = await this.usersService.update(id, updateUserDto);
    
    await this.auditService.log({
      action: 'UPDATE_USER',
      resource: 'users',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { old: oldUser, new: updateUserDto },
    });

    return updatedUser;
  }

  @ApiOperation({ summary: 'Delete user' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const user = await this.usersService.findById(id);
    await this.usersService.remove(id);
    
    await this.auditService.log({
      action: 'DELETE_USER',
      resource: 'users',
      resourceId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: ip,
      userAgent,
      changes: { deleted: user },
    });

    return { message: 'User deleted successfully' };
  }

  @ApiOperation({ summary: 'Get all roles' })
  @Get('roles/all')
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @ApiOperation({ summary: 'Get all permissions' })
  @Get('permissions/all')
  findAllPermissions() {
    return this.usersService.findAllPermissions();
  }
}