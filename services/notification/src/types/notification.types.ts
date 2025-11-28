export enum NotificationType {
  EMAIL = 'email',
  IN_APP = 'in_app',
  BOTH = 'both',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

export interface InAppNotificationPayload {
  userId: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

export interface NotificationRequest {
  type: NotificationType;
  priority?: NotificationPriority;
  email?: EmailPayload;
  inApp?: InAppNotificationPayload;
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface NotificationResponse {
  id: string;
  status: 'success' | 'failed' | 'pending';
  message: string;
  timestamp: Date;
  errors?: string[];
}
