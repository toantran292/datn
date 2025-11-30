import type { JitsiMeetJS as JitsiMeetJSType } from '@/types/jitsi';

export function getJitsiMeetJS(): JitsiMeetJSType {
  if (typeof window === 'undefined') {
    throw new Error('JitsiMeetJS is only available in browser');
  }
  if (!window.JitsiMeetJS) {
    throw new Error('JitsiMeetJS is not loaded yet. Make sure the script is loaded before using it.');
  }
  return window.JitsiMeetJS;
}

export function waitForJitsiMeetJS(): Promise<JitsiMeetJSType> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('JitsiMeetJS is only available in browser'));
      return;
    }

    if (window.JitsiMeetJS) {
      resolve(window.JitsiMeetJS);
      return;
    }

    // Wait for script to load (max 10 seconds)
    const maxWait = 10000;
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (window.JitsiMeetJS) {
        clearInterval(checkInterval);
        resolve(window.JitsiMeetJS);
      } else if (Date.now() - startTime > maxWait) {
        clearInterval(checkInterval);
        reject(new Error('JitsiMeetJS failed to load within 10 seconds'));
      }
    }, 100);
  });
}

export async function initializeJitsi() {
  if (typeof window === 'undefined') return;

  try {
    const JitsiMeetJS = await waitForJitsiMeetJS();
    const options = {
      disableAudioLevels: false,
      enableAnalyticsLogging: false,
    };

    JitsiMeetJS.init(options);
    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.WARN);

    // Suppress specific Jitsi internal errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Convert all args to strings for checking
      const fullMessage = args.map((arg: any) => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return arg.message;
        return String(arg);
      }).join(' ');

      // Suppress known harmless errors
      if (
        fullMessage.includes('ClearedQueueError') ||
        fullMessage.includes('removeRemoteStreamsOnLeave') ||
        fullMessage.includes('JingleSessionPC') ||
        fullMessage.includes('interrupted by a new load request')
      ) {
        return; // Suppress these errors
      }

      originalConsoleError.apply(console, args);
    };

    console.log('[Jitsi] Initialized successfully');
  } catch (err) {
    console.error('[Jitsi] Failed to initialize:', err);
  }
}

export async function createConnection(websocketUrl: string, jwt: string) {
  const JitsiMeetJS = await waitForJitsiMeetJS();
  const options = {
    hosts: {
      domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.local',
      muc: `conference.${process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.local'}`,
    },
    serviceUrl: websocketUrl,
    websocket: websocketUrl,
    clientNode: 'http://jitsi.org/jitsimeet',
  };

  return new JitsiMeetJS.JitsiConnection(null, jwt, options);
}

export async function createLocalTracks(options?: { audio?: boolean; video?: boolean }) {
  const JitsiMeetJS = await waitForJitsiMeetJS();
  const devices = [];
  if (options?.audio !== false) devices.push('audio');
  if (options?.video !== false) devices.push('video');

  try {
    const tracks = await JitsiMeetJS.createLocalTracks({
      devices,
      resolution: 720,
    });
    return tracks;
  } catch (error) {
    console.error('[Jitsi] Failed to create local tracks:', error);
    return [];
  }
}

export async function createDesktopTrack() {
  const JitsiMeetJS = await waitForJitsiMeetJS();

  try {
    const tracks = await JitsiMeetJS.createLocalTracks({
      devices: ['desktop'],
      resolution: 1080,
    });
    return tracks;
  } catch (error) {
    console.error('[Jitsi] Failed to create desktop track:', error);
    throw error;
  }
}
