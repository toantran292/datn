// Global JitsiMeetJS from CDN
export interface JitsiMeetJS {
  init(options?: any): void;
  setLogLevel(level: any): void;
  JitsiConnection: new (
    appId: string | null,
    token: string | null,
    options: any
  ) => JitsiConnection;
  events: {
    connection: {
      CONNECTION_ESTABLISHED: string;
      CONNECTION_FAILED: string;
      CONNECTION_DISCONNECTED: string;
    };
    conference: {
      TRACK_ADDED: string;
      TRACK_REMOVED: string;
      CONFERENCE_JOINED: string;
      CONFERENCE_LEFT: string;
      USER_JOINED: string;
      USER_LEFT: string;
      TRACK_MUTE_CHANGED: string;
      DISPLAY_NAME_CHANGED: string;
      DOMINANT_SPEAKER_CHANGED: string;
    };
    track: {
      LOCAL_TRACK_STOPPED: string;
      TRACK_AUDIO_LEVEL_CHANGED: string;
      TRACK_MUTE_CHANGED: string;
    };
  };
  mediaDevices: {
    isDeviceListAvailable(): boolean;
    isDeviceChangeAvailable(deviceType?: string): boolean;
    enumerateDevices(callback: (devices: MediaDeviceInfo[]) => void): void;
  };
  createLocalTracks(options?: {
    devices?: string[];
    resolution?: number;
    constraints?: any;
  }): Promise<JitsiTrack[]>;
  logLevels: {
    TRACE: any;
    DEBUG: any;
    INFO: any;
    LOG: any;
    WARN: any;
    ERROR: any;
  };
}

export interface JitsiConnection {
  addEventListener(event: string, listener: Function): void;
  removeEventListener(event: string, listener: Function): void;
  connect(options?: any): void;
  disconnect(): void;
  initJitsiConference(name: string, options: any): JitsiConference;
}

export interface JitsiConference {
  join(password?: string): void;
  leave(): Promise<void>;
  on(event: string, listener: Function): void;
  off(event: string, listener: Function): void;
  addTrack(track: JitsiTrack): Promise<void>;
  removeTrack(track: JitsiTrack): Promise<void>;
  setDisplayName(name: string): void;
  getParticipants(): JitsiParticipant[];
  getParticipantById(id: string): JitsiParticipant | null;
  myUserId(): string;
  getLocalTracks(): JitsiTrack[];
  setLocalParticipantProperty(name: string, value: any): void;
}

export interface JitsiParticipant {
  getId(): string;
  getDisplayName(): string;
  getProperty(name: string): any;
}

export interface JitsiTrack {
  getType(): 'audio' | 'video';
  isMuted(): boolean;
  isLocal(): boolean;
  getId(): string;
  getParticipantId(): string;
  attach(container: HTMLElement): Promise<void>;
  detach(container: HTMLElement): void;
  dispose(): void;
  mute(): Promise<void>;
  unmute(): Promise<void>;
  addEventListener(event: string, listener: Function): void;
  removeEventListener(event: string, listener: Function): void;
}

declare global {
  interface Window {
    JitsiMeetJS: JitsiMeetJS;
  }
}

export { };
// Global JitsiMeetJS from CDN
export interface JitsiMeetJS {
  init(options?: any): void;
  setLogLevel(level: any): void;
  JitsiConnection: new (
    appId: string | null,
    token: string | null,
    options: any
  ) => JitsiConnection;
  events: {
    connection: {
      CONNECTION_ESTABLISHED: string;
      CONNECTION_FAILED: string;
      CONNECTION_DISCONNECTED: string;
    };
    conference: {
      TRACK_ADDED: string;
      TRACK_REMOVED: string;
      CONFERENCE_JOINED: string;
      CONFERENCE_LEFT: string;
      USER_JOINED: string;
      USER_LEFT: string;
      TRACK_MUTE_CHANGED: string;
      DISPLAY_NAME_CHANGED: string;
      DOMINANT_SPEAKER_CHANGED: string;
    };
    track: {
      LOCAL_TRACK_STOPPED: string;
      TRACK_AUDIO_LEVEL_CHANGED: string;
      TRACK_MUTE_CHANGED: string;
    };
  };
  mediaDevices: {
    isDeviceListAvailable(): boolean;
    isDeviceChangeAvailable(deviceType?: string): boolean;
    enumerateDevices(callback: (devices: MediaDeviceInfo[]) => void): void;
  };
  createLocalTracks(options?: {
    devices?: string[];
    resolution?: number;
    constraints?: any;
  }): Promise<JitsiTrack[]>;
  logLevels: {
    TRACE: any;
    DEBUG: any;
    INFO: any;
    LOG: any;
    WARN: any;
    ERROR: any;
  };
}

export interface JitsiConnection {
  addEventListener(event: string, listener: Function): void;
  removeEventListener(event: string, listener: Function): void;
  connect(options?: any): void;
  disconnect(): void;
  initJitsiConference(name: string, options: any): JitsiConference;
}

export interface JitsiConference {
  join(password?: string): void;
  leave(): Promise<void>;
  on(event: string, listener: Function): void;
  off(event: string, listener: Function): void;
  addTrack(track: JitsiTrack): Promise<void>;
  removeTrack(track: JitsiTrack): Promise<void>;
  setDisplayName(name: string): void;
  getParticipants(): JitsiParticipant[];
  getParticipantById(id: string): JitsiParticipant | null;
  myUserId(): string;
  getLocalTracks(): JitsiTrack[];
  setLocalParticipantProperty(name: string, value: any): void;
  setReceiverConstraints(constraints: {
    lastN?: number;
    onStageEndpoints?: string[];
    defaultConstraints?: { maxHeight?: number };
    constraints?: Record<string, any>;
  }): void;
}

export interface JitsiParticipant {
  getId(): string;
  getDisplayName(): string;
  getProperty(name: string): any;
}

export interface JitsiTrack {
  getType(): 'audio' | 'video';
  isMuted(): boolean;
  isLocal(): boolean;
  getId(): string;
  getParticipantId(): string;
  attach(container: HTMLElement): Promise<void>;
  detach(container: HTMLElement): void;
  dispose(): void;
  mute(): Promise<void>;
  unmute(): Promise<void>;
  addEventListener(event: string, listener: Function): void;
  removeEventListener(event: string, listener: Function): void;
}

declare global {
  interface Window {
    JitsiMeetJS: JitsiMeetJS;
  }
}

export { };
