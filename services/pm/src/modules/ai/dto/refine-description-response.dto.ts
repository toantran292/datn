import { ApiProperty } from '@nestjs/swagger';

export class RefineDescriptionDataDto {
  @ApiProperty({
    description: 'Refined description in markdown format',
    example: '## 📌 Tóm tắt\n\nNgười dùng không thể đăng nhập...',
  })
  refinedDescription: string;

  @ApiProperty({
    description: 'Refined description in HTML format',
    example: '<h2>📌 Tóm tắt</h2><p>Người dùng không thể đăng nhập...</p>',
  })
  refinedDescriptionHtml: string;

  @ApiProperty({
    description: 'List of improvements made by AI',
    example: ['Thêm cấu trúc markdown rõ ràng', 'Mở rộng mô tả với chi tiết cụ thể'],
    type: [String],
  })
  improvements: string[];

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  confidence: number;
}

export class RefineDescriptionMetadataDto {
  @ApiProperty({
    description: 'AI model used',
    example: 'gpt-4o-mini',
  })
  model: string;

  @ApiProperty({
    description: 'Total tokens used',
    example: 450,
  })
  tokensUsed: number;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 1250,
  })
  processingTime: number;
}

export class RefineDescriptionResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Refined description data',
    type: RefineDescriptionDataDto,
    required: false,
  })
  data?: RefineDescriptionDataDto;

  @ApiProperty({
    description: 'Metadata about the AI operation',
    type: RefineDescriptionMetadataDto,
    required: false,
  })
  metadata?: RefineDescriptionMetadataDto;

  @ApiProperty({
    description: 'Error information if request failed',
    required: false,
  })
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
