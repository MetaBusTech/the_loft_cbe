import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

interface LogData {
  action: string;
  resource: string;
  resourceId?: string;
  userId: string;
  userEmail: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: LogData): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return await this.auditLogRepository.save(auditLog);
  }

  async findAll(
    page = 1,
    limit = 50,
    action?: string,
    resource?: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .orderBy('auditLog.createdAt', 'DESC');

    if (action) {
      queryBuilder.andWhere('auditLog.action = :action', { action });
    }

    if (resource) {
      queryBuilder.andWhere('auditLog.resource = :resource', { resource });
    }

    if (userId) {
      queryBuilder.andWhere('auditLog.userId = :userId', { userId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('auditLog.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [logs, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }

  async getActionSummary(startDate?: Date, endDate?: Date) {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .select('auditLog.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('auditLog.action')
      .orderBy('count', 'DESC');

    if (startDate && endDate) {
      queryBuilder.andWhere('auditLog.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return await queryBuilder.getRawMany();
  }

  async getUserActivity(userId: string, limit = 20): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}