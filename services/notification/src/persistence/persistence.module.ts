import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationRepository } from './notification.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASS', 'postgres'),
        database: config.get('DB_NAME', 'notification_db'),
        entities: [NotificationEntity],
        synchronize: config.get('NODE_ENV') !== 'production', // Auto-sync in dev
        logging: config.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([NotificationEntity]),
  ],
  providers: [NotificationRepository],
  exports: [NotificationRepository, TypeOrmModule],
})
export class PersistenceModule {}
