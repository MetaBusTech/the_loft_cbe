import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { TaxConfiguration } from '../../entities/tax-configuration.entity';
import { PrinterConfiguration } from '../../entities/printer-configuration.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxConfiguration, PrinterConfiguration]),
    AuditModule,
  ],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}