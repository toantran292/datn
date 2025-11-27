import type { JitsiMeetJS as JitsiMeetJSType } from '@/types/jitsi';

export function getJitsiMeetJS(): JitsiMeetJSType {
  if (typeof window === 'undefined') {
    throw new Error('JitsiMeetJS is only available in browser');
  }
  return window.JitsiMeetJS;
}

export function initializeJitsi() {
  if (typeof window === 'undefined') return;
  if (!window.JitsiMeetJS) {
    console.error('[Jitsi] JitsiMeetJS not loaded yet');
    return;
  }

  const JitsiMeetJS = getJitsiMeetJS();
  const options = {
    disableAudioLevels: false,
    enableAnalyticsLogging: false,
  };

  JitsiMeetJS.init(options);
  JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.WARN);
  console.log('[Jitsi] Initialized successfully');
}

export function createConnection(websocketUrl: string, jwt: string) {
  const JitsiMeetJS = getJitsiMeetJS();
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
  const JitsiMeetJS = getJitsiMeetJS();
  const devices = [];
  if (options?.audio !== false) devices.push('audio');
  if (options?.video !== false) devices.push('video');

  try {
    return await JitsiMeetJS.createLocalTracks({
      devices,
      resolution: 720,
    });
  } catch (error) {
    console.error('Failed to create local tracks:', error);
    return [];
  }
}
