import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '../../entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, ip: string, userAgent: string) {
    const payload = { email: user.email, sub: user.id };
    
    // Update last login
    await this.userRepository.update(user.id, { lastLogin: new Date() });
    
    // Log the login
    await this.auditService.log({
      action: 'LOGIN',
      resource: 'auth',
      resourceId: user.id,
      userId: user.id,
      userEmail: user.email,
      ipAddress: ip,
      userAgent,
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: await this.usersService.findById(user.id),
    };
  }

  async register(registerDto: RegisterDto, ip: string, userAgent: string) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Log the registration
    await this.auditService.log({
      action: 'REGISTER',
      resource: 'auth',
      resourceId: user.id,
      userId: user.id,
      userEmail: user.email,
      ipAddress: ip,
      userAgent,
    });

    const { password, ...result } = user;
    return result;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.usersService.findById(userId);
    
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await this.userRepository.update(userId, { password: hashedNewPassword });

    // Log the password change
    await this.auditService.log({
      action: 'CHANGE_PASSWORD',
      resource: 'auth',
      resourceId: userId,
      userId,
      userEmail: user.email,
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string, ip: string, userAgent: string) {
    const user = await this.usersService.findById(userId);
    
    // Log the logout
    await this.auditService.log({
      action: 'LOGOUT',
      resource: 'auth',
      resourceId: userId,
      userId,
      userEmail: user.email,
      ipAddress: ip,
      userAgent,
    });

    return { message: 'Logout successful' };
  }
}