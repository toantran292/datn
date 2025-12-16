import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailPayload } from '../types/notification.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('email.host');
    const port = this.configService.get<number>('email.port');
    const secure = this.configService.get<boolean>('email.secure');
    const auth = this.configService.get<any>('email.auth');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth,
      // For Mailhog, we don't need authentication
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.logger.log(
      `Email transporter initialized: ${host}:${port} (secure: ${secure})`,
    );
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      const defaultFrom = this.configService.get<string>('email.from');

      const mailOptions = {
        from: payload.from || defaultFrom,
        to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        cc: payload.cc
          ? Array.isArray(payload.cc)
            ? payload.cc.join(', ')
            : payload.cc
          : undefined,
        bcc: payload.bcc
          ? Array.isArray(payload.bcc)
            ? payload.bcc.join(', ')
            : payload.bcc
          : undefined,
        attachments: payload.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent successfully to ${mailOptions.to}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email transporter connection verified');
      return true;
    } catch (error) {
      this.logger.error(
        `Email transporter connection failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
