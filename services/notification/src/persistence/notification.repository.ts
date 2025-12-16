import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, StoredNotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async create(data: {
    userId: string;
    orgId?: string;
    type: StoredNotificationType;
    title: string;
    content?: string;
    metadata?: Record<string, any>;
  }): Promise<NotificationEntity> {
    const notification = this.repo.create({
      ...data,
      metadata: data.metadata || {},
      isRead: false,
    });
    return this.repo.save(notification);
  }

  async findById(id: string): Promise<NotificationEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUserId(
    userId: string,
    page: number = 0,
    size: number = 20,
  ): Promise<[NotificationEntity[], number]> {
    return this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: page * size,
      take: size,
    });
  }

  async findUnreadByUserId(userId: string): Promise<NotificationEntity[]> {
    return this.repo.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.repo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const result = await this.repo.update(
      { id, userId },
      { isRead: true, readAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.repo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return result.affected ?? 0;
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const result = await this.repo.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.repo.delete({ userId });
    return result.affected ?? 0;
  }
}
