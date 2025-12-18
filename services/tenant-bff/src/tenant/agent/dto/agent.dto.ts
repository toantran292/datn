import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  content: string;
}

export class AgentChatRequestDto {
  @ApiProperty({ description: 'User message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Conversation history', type: [ChatMessageDto] })
  @IsOptional()
  @IsArray()
  history?: ChatMessageDto[];

  @ApiPropertyOptional({ description: 'Specific project ID to focus on' })
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class AgentChatResponseDto {
  @ApiProperty({ description: 'AI response' })
  response: string;

  @ApiPropertyOptional({ description: 'Context used for response' })
  context?: {
    projects?: number;
    tasks?: number;
    members?: number;
    ragResults?: number;
  };
}
