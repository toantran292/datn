import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailPayload } from '../types/notification.types';
import { EmailProvider } from '../config/email.config';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private provider: EmailProvider;
  private smtpTransporter: Transporter | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeProvider();
  }

  private initializeProvider() {
    this.provider = this.configService.get<EmailProvider>('email.provider') || 'sendgrid';

    if (this.provider === 'sendgrid') {
      this.initializeSendGrid();
    } else {
      this.initializeSmtp();
    }
  }

  private initializeSendGrid() {
    const apiKey = this.configService.get<string>('email.sendgrid.apiKey');

    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured. Email sending will fail.');
      return;
    }

    sgMail.setApiKey(apiKey);
    this.logger.log('SendGrid email provider initialized');
  }

  private initializeSmtp() {
    const host = this.configService.get<string>('email.smtp.host');
    const port = this.configService.get<number>('email.smtp.port');
    const secure = this.configService.get<boolean>('email.smtp.secure');
    const auth = this.configService.get<any>('email.smtp.auth');

    this.smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth,
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.logger.log(
      `SMTP email transporter initialized: ${host}:${port} (secure: ${secure})`,
    );
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    if (this.provider === 'sendgrid') {
      await this.sendWithSendGrid(payload);
    } else {
      await this.sendWithSmtp(payload);
    }
  }

  private async sendWithSendGrid(payload: EmailPayload): Promise<void> {
    try {
      const defaultFrom = this.configService.get<string>('email.from');
      const fromName = this.configService.get<string>('email.fromName');

      const msg: sgMail.MailDataRequired = {
        to: payload.to,
        from: {
          email: payload.from || defaultFrom || 'noreply@uts.local',
          name: fromName || 'UTS Notification',
        },
        subject: payload.subject,
        text: payload.text || '',
        html: payload.html || payload.text || '',
      };

      // Add CC if provided
      if (payload.cc) {
        msg.cc = payload.cc;
      }

      // Add BCC if provided
      if (payload.bcc) {
        msg.bcc = payload.bcc;
      }

      // Add attachments if provided
      if (payload.attachments && payload.attachments.length > 0) {
        msg.attachments = payload.attachments.map((att) => ({
          content: att.content?.toString('base64') || '',
          filename: att.filename || 'attachment',
          type: att.contentType,
          disposition: 'attachment',
        }));
      }

      const [response] = await sgMail.send(msg);

      this.logger.log(
        `Email sent via SendGrid to ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}. Status: ${response.statusCode}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send email via SendGrid: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendWithSmtp(payload: EmailPayload): Promise<void> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized');
    }

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

      const info = await this.smtpTransporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent via SMTP to ${mailOptions.to}. MessageId: ${info.messageId}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to send email via SMTP: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (this.provider === 'sendgrid') {
      // SendGrid doesn't have a direct verify method
      // We'll just check if API key is configured
      const apiKey = this.configService.get<string>('email.sendgrid.apiKey');
      if (apiKey) {
        this.logger.log('SendGrid API key is configured');
        return true;
      }
      this.logger.warn('SendGrid API key is not configured');
      return false;
    }

    if (!this.smtpTransporter) {
      this.logger.error('SMTP transporter not initialized');
      return false;
    }

    try {
      await this.smtpTransporter.verify();
      this.logger.log('SMTP transporter connection verified');
      return true;
    } catch (error: any) {
      this.logger.error(
        `SMTP transporter connection failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  getProvider(): EmailProvider {
    return this.provider;
  }
}
