import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.entity';
import { Permission } from '../../entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, Permission])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}