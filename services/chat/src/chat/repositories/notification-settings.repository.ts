import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelNotificationSetting, NotificationLevel } from '../../database/entities/channel-notification-setting.entity';

export interface NotificationSettingEntity {
  id: string;
  roomId: string;
  userId: string;
  level: NotificationLevel;
  mutedUntil: Date | null;
  soundEnabled: boolean;
  pushEnabled: boolean;
  updatedAt: Date;
}

export interface UpdateNotificationSettingDto {
  level?: NotificationLevel;
  mutedUntil?: Date | null;
  soundEnabled?: boolean;
  pushEnabled?: boolean;
}

@Injectable()
export class NotificationSettingsRepository {
  constructor(
    @InjectRepository(ChannelNotificationSetting)
    private readonly settingRepo: Repository<ChannelNotificationSetting>,
  ) {}

  async get(roomId: string, userId: string): Promise<NotificationSettingEntity | null> {
    const setting = await this.settingRepo.findOne({
      where: { roomId, userId },
    });

    if (!setting) return null;

    return {
      id: setting.id,
      roomId: setting.roomId,
      userId: setting.userId,
      level: setting.level,
      mutedUntil: setting.mutedUntil,
      soundEnabled: setting.soundEnabled,
      pushEnabled: setting.pushEnabled,
      updatedAt: setting.updatedAt,
    };
  }

  async getOrCreate(roomId: string, userId: string): Promise<NotificationSettingEntity> {
    let setting = await this.settingRepo.findOne({
      where: { roomId, userId },
    });

    if (!setting) {
      setting = this.settingRepo.create({
        roomId,
        userId,
        level: 'all',
        soundEnabled: true,
        pushEnabled: true,
      });
      setting = await this.settingRepo.save(setting);
    }

    return {
      id: setting.id,
      roomId: setting.roomId,
      userId: setting.userId,
      level: setting.level,
      mutedUntil: setting.mutedUntil,
      soundEnabled: setting.soundEnabled,
      pushEnabled: setting.pushEnabled,
      updatedAt: setting.updatedAt,
    };
  }

  async update(
    roomId: string,
    userId: string,
    data: UpdateNotificationSettingDto,
  ): Promise<NotificationSettingEntity> {
    let setting = await this.settingRepo.findOne({
      where: { roomId, userId },
    });

    if (!setting) {
      setting = this.settingRepo.create({
        roomId,
        userId,
        level: data.level ?? 'all',
        mutedUntil: data.mutedUntil ?? null,
        soundEnabled: data.soundEnabled ?? true,
        pushEnabled: data.pushEnabled ?? true,
      });
    } else {
      if (data.level !== undefined) setting.level = data.level;
      if (data.mutedUntil !== undefined) setting.mutedUntil = data.mutedUntil;
      if (data.soundEnabled !== undefined) setting.soundEnabled = data.soundEnabled;
      if (data.pushEnabled !== undefined) setting.pushEnabled = data.pushEnabled;
    }

    const saved = await this.settingRepo.save(setting);

    return {
      id: saved.id,
      roomId: saved.roomId,
      userId: saved.userId,
      level: saved.level,
      mutedUntil: saved.mutedUntil,
      soundEnabled: saved.soundEnabled,
      pushEnabled: saved.pushEnabled,
      updatedAt: saved.updatedAt,
    };
  }

  async mute(roomId: string, userId: string, duration?: number): Promise<NotificationSettingEntity> {
    const mutedUntil = duration
      ? new Date(Date.now() + duration * 1000)
      : null; // null = muted indefinitely

    return this.update(roomId, userId, { mutedUntil });
  }

  async unmute(roomId: string, userId: string): Promise<NotificationSettingEntity> {
    return this.update(roomId, userId, { mutedUntil: null });
  }

  async isMuted(roomId: string, userId: string): Promise<boolean> {
    const setting = await this.get(roomId, userId);
    if (!setting) return false;

    if (setting.mutedUntil === null) return false;
    return setting.mutedUntil > new Date();
  }

  async getByUser(userId: string): Promise<NotificationSettingEntity[]> {
    const settings = await this.settingRepo.find({
      where: { userId },
    });

    return settings.map(s => ({
      id: s.id,
      roomId: s.roomId,
      userId: s.userId,
      level: s.level,
      mutedUntil: s.mutedUntil,
      soundEnabled: s.soundEnabled,
      pushEnabled: s.pushEnabled,
      updatedAt: s.updatedAt,
    }));
  }

  async delete(roomId: string, userId: string): Promise<boolean> {
    const result = await this.settingRepo.delete({ roomId, userId });
    return (result.affected ?? 0) > 0;
  }
}
