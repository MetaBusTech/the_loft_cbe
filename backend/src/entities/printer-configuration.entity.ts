import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PrinterType {
  THERMAL = 'thermal',
  INKJET = 'inkjet',
  LASER = 'laser',
}

export enum ConnectionType {
  USB = 'usb',
  NETWORK = 'network',
  BLUETOOTH = 'bluetooth',
}

@Entity('printer_configurations')
export class PrinterConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PrinterType,
  })
  type: PrinterType;

  @Column({
    name: 'connection_type',
    type: 'enum',
    enum: ConnectionType,
  })
  connectionType: ConnectionType;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  port: number;

  @Column({ name: 'device_path', nullable: true })
  devicePath: string;

  @Column({ name: 'paper_width', default: 80 })
  paperWidth: number;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}