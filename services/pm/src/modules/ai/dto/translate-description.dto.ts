import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TranslateLanguage {
  ENGLISH = 'en',
  KOREAN = 'ko',
  JAPANESE = 'ja',
  CHINESE = 'zh',
  VIETNAMESE = 'vi',
}

export class TranslateDescriptionDto {
  @ApiProperty({ description: 'Issue ID for context' })
  @IsString()
  @IsNotEmpty()
  issueId: string;

  @ApiProperty({ description: 'Current description text to translate' })
  @IsString()
  @IsNotEmpty()
  currentDescription: string;

  @ApiProperty({ description: 'Target language for translation', enum: TranslateLanguage })
  @IsEnum(TranslateLanguage)
  @IsNotEmpty()
  targetLanguage: TranslateLanguage;

  @ApiProperty({ description: 'Issue name for context', required: false })
  @IsString()
  @IsOptional()
  issueName?: string;

  @ApiProperty({ description: 'Issue type for context', required: false })
  @IsString()
  @IsOptional()
  issueType?: string;
}

export class TranslateDescriptionResponseDto {
  @ApiProperty({ description: 'Translated text (plain text)' })
  translatedText: string;

  @ApiProperty({ description: 'Translated HTML' })
  translatedHtml: string;

  @ApiProperty({ description: 'Target language', enum: TranslateLanguage })
  targetLanguage: TranslateLanguage;
}
