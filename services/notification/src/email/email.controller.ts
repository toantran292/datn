import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';
import { IsString, IsOptional, IsArray } from 'class-validator';

class SendEmailDto {
  @IsString()
  to: string | string[];

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  cc?: string | string[];

  @IsOptional()
  bcc?: string | string[];
}

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendEmail(@Body() dto: SendEmailDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Received email send request to: ${dto.to}`);

    try {
      await this.emailService.sendEmail({
        to: dto.to,
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
        from: dto.from,
        cc: dto.cc,
        bcc: dto.bcc,
      });

      return { success: true, message: 'Email sent successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }
}
