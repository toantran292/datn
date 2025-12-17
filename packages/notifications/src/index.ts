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

export { usePresence } from './hooks/usePresence';
export type { UsePresenceReturn } from './hooks/usePresence';

export { usePresenceManager } from './hooks/usePresenceManager';
export type {
  UsePresenceManagerOptions,
  UsePresenceManagerReturn,
} from './hooks/usePresenceManager';

// Client
export { NotificationClient } from './utils/NotificationClient';

// Presence Manager (Singleton)
export { PresenceManager } from './utils/PresenceManager';
export type { PresenceManagerConfig, PresenceChangeHandler } from './utils/PresenceManager';

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
  PresenceEvent,
  PresenceEventHandler,
  PresenceState,
  UsePresenceOptions,
} from './types';
