import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelAIConfig, AIFeature } from '../../database/entities/channel-ai-config.entity';

export interface ChannelAIConfigEntity {
  id: string;
  roomId: string;
  aiEnabled: boolean;
  enabledFeatures: AIFeature[];
  modelProvider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  customSystemPrompt: string | null;
  configuredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateChannelAIConfigDto {
  aiEnabled?: boolean;
  enabledFeatures?: AIFeature[];
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  customSystemPrompt?: string | null;
  configuredBy?: string;
}

@Injectable()
export class ChannelAIConfigRepository {
  constructor(
    @InjectRepository(ChannelAIConfig)
    private readonly configRepo: Repository<ChannelAIConfig>,
  ) {}

  async get(roomId: string): Promise<ChannelAIConfigEntity | null> {
    const config = await this.configRepo.findOne({
      where: { roomId },
    });

    if (!config) return null;

    return this.toEntity(config);
  }

  async getOrCreate(roomId: string, configuredBy?: string): Promise<ChannelAIConfigEntity> {
    let config = await this.configRepo.findOne({
      where: { roomId },
    });

    if (!config) {
      config = this.configRepo.create({
        roomId,
        aiEnabled: false, // Default to disabled
        enabledFeatures: [], // Default to no features enabled
        modelProvider: 'openai',
        modelName: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 2000,
        configuredBy,
      });
      config = await this.configRepo.save(config);
    }

    return this.toEntity(config);
  }

  async update(
    roomId: string,
    data: UpdateChannelAIConfigDto,
  ): Promise<ChannelAIConfigEntity> {
    let config = await this.configRepo.findOne({
      where: { roomId },
    });

    if (!config) {
      config = this.configRepo.create({
        roomId,
        aiEnabled: data.aiEnabled ?? false, // Default to disabled
        enabledFeatures: data.enabledFeatures ?? [], // Default to no features enabled
        modelProvider: data.modelProvider ?? 'openai',
        modelName: data.modelName ?? 'gpt-4o-mini',
        temperature: data.temperature ?? 0.7,
        maxTokens: data.maxTokens ?? 2000,
        customSystemPrompt: data.customSystemPrompt ?? null,
        configuredBy: data.configuredBy ?? null,
      });
    } else {
      if (data.aiEnabled !== undefined) config.aiEnabled = data.aiEnabled;
      if (data.enabledFeatures !== undefined) config.enabledFeatures = data.enabledFeatures;
      if (data.modelProvider !== undefined) config.modelProvider = data.modelProvider;
      if (data.modelName !== undefined) config.modelName = data.modelName;
      if (data.temperature !== undefined) config.temperature = data.temperature;
      if (data.maxTokens !== undefined) config.maxTokens = data.maxTokens;
      if (data.customSystemPrompt !== undefined) config.customSystemPrompt = data.customSystemPrompt;
      if (data.configuredBy !== undefined) config.configuredBy = data.configuredBy;
    }

    const saved = await this.configRepo.save(config);
    return this.toEntity(saved);
  }

  async isFeatureEnabled(roomId: string, feature: AIFeature): Promise<boolean> {
    const config = await this.get(roomId);
    if (!config) return false; // Default to disabled if no config exists
    return config.aiEnabled && config.enabledFeatures.includes(feature);
  }

  async delete(roomId: string): Promise<boolean> {
    const result = await this.configRepo.delete({ roomId });
    return (result.affected ?? 0) > 0;
  }

  private toEntity(config: ChannelAIConfig): ChannelAIConfigEntity {
    return {
      id: config.id,
      roomId: config.roomId,
      aiEnabled: config.aiEnabled,
      enabledFeatures: config.enabledFeatures,
      modelProvider: config.modelProvider,
      modelName: config.modelName,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      customSystemPrompt: config.customSystemPrompt,
      configuredBy: config.configuredBy,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
