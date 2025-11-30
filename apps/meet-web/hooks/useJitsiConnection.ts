import { useEffect, useState, useRef } from 'react';
import { createConnection, getJitsiMeetJS, waitForJitsiMeetJS } from '@/lib/jitsi';
import type { JitsiConnection } from '@/types/jitsi';

export function useJitsiConnection(websocketUrl: string | null, jwt: string | null) {
  const [connection, setConnection] = useState<JitsiConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<JitsiConnection | null>(null);

  useEffect(() => {
    if (!websocketUrl || !jwt) return;

    let conn: JitsiConnection | null = null;

    const handleConnectionEstablished = () => {
      console.log('[Jitsi] Connection established');
      setIsConnected(true);
      setError(null);
    };

    const handleConnectionFailed = (err: any) => {
      console.error('[Jitsi] Connection failed:', err);
      setError('Connection failed');
      setIsConnected(false);
    };

    const handleConnectionDisconnected = () => {
      console.log('[Jitsi] Connection disconnected');
      setIsConnected(false);
    };

    const initConnection = async () => {
      try {
        const JitsiMeetJS = await waitForJitsiMeetJS();
        conn = await createConnection(websocketUrl, jwt);
        connectionRef.current = conn;

        conn.addEventListener(
          JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
          handleConnectionEstablished
        );
        conn.addEventListener(
          JitsiMeetJS.events.connection.CONNECTION_FAILED,
          handleConnectionFailed
        );
        conn.addEventListener(
          JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
          handleConnectionDisconnected
        );

        conn.connect();
        setConnection(conn);
      } catch (err) {
        console.error('[Jitsi] Failed to create connection:', err);
        setError('Failed to create connection');
      }
    };

    initConnection();

    return () => {
      if (conn) {
        try {
          const JitsiMeetJS = getJitsiMeetJS();
          conn.removeEventListener(
            JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
            handleConnectionEstablished
          );
          conn.removeEventListener(
            JitsiMeetJS.events.connection.CONNECTION_FAILED,
            handleConnectionFailed
          );
          conn.removeEventListener(
            JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
            handleConnectionDisconnected
          );
          conn.disconnect();
        } catch (e) {
          console.error('[Jitsi] Error during connection cleanup:', e);
        }
      }
    };
  }, [websocketUrl, jwt]);

  return { connection, isConnected, error };
}
