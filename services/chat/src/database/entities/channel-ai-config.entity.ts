import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Room } from './room.entity';

export type AIFeature = 'summary' | 'action_items' | 'qa' | 'document_summary';

@Entity('channel_ai_configs')
@Unique(['roomId'])
export class ChannelAIConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'room_id' })
  roomId: string;

  @Column({ name: 'ai_enabled', default: true })
  aiEnabled: boolean;

  @Column('simple-array', { name: 'enabled_features', default: '' })
  enabledFeatures: AIFeature[];

  @Column({ name: 'model_provider', length: 50, default: 'openai' })
  modelProvider: string;

  @Column({ name: 'model_name', length: 100, default: 'gpt-4o-mini' })
  modelName: string;

  @Column({ type: 'float', default: 0.7 })
  temperature: number;

  @Column({ name: 'max_tokens', type: 'int', default: 2000 })
  maxTokens: number;

  @Column({ name: 'custom_system_prompt', type: 'text', nullable: true })
  customSystemPrompt: string | null;

  @Column('uuid', { name: 'configured_by', nullable: true })
  configuredBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
