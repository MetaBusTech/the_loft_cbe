import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrinterService } from './printer.service';
import { PrinterController } from './printer.controller';
import { PrinterConfiguration } from '../../entities/printer-configuration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrinterConfiguration])],
  controllers: [PrinterController],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}