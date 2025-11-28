// Hooks
export { useNotifications } from './hooks/useNotifications';
export type {
  UseNotificationsOptions,
  UseNotificationsReturn,
} from './hooks/useNotifications';

export { useNotificationConnection } from './hooks/useNotificationConnection';
export type {
  UseNotificationConnectionOptions,
  UseNotificationConnectionReturn,
} from './hooks/useNotificationConnection';

// Client
export { NotificationClient } from './utils/NotificationClient';

// Types
export type {
  Notification,
  BroadcastNotification,
  NotificationConfig,
  NotificationState,
  NotificationEventHandler,
  BroadcastEventHandler,
  ConnectionEventHandler,
  ErrorEventHandler,
} from './types';
