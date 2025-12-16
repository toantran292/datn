import { registerAs } from '@nestjs/config';

export type EmailProvider = 'sendgrid' | 'smtp';

export default registerAs('email', () => ({
  // Email provider: 'sendgrid' or 'smtp'
  provider: (process.env.EMAIL_PROVIDER || 'sendgrid') as EmailProvider,

  // SendGrid configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
  },

  // SMTP configuration (fallback/alternative)
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  },

  // Common settings
  from: process.env.EMAIL_FROM || 'noreply@uts.local',
  fromName: process.env.EMAIL_FROM_NAME || 'UTS Notification',
}));
