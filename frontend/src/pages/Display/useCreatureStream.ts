import { useEffect, useState } from 'react';
import type { Creature, DisplayMessage } from 'shared';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8787/ws/display';
const RECONNECT_DELAY_MS = 3000;

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

const parseMessage = (data: unknown): DisplayMessage | null => {
  if (typeof data !== 'string') {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(data);

    return (parsed as DisplayMessage)?.type === 'creature_added'
      ? (parsed as DisplayMessage)
      : null;
  } catch {
    return null;
  }
};

/** 大画面へ接続し、放流された作品を受け取る。切断されたら自動で接続し直す。 */
export const useCreatureStream = (onCreature: (creature: Creature) => void) => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      setStatus('connecting');
      socket = new WebSocket(WS_URL);

      socket.addEventListener('open', () => setStatus('open'));

      socket.addEventListener('message', (event) => {
        const message = parseMessage(event.data);

        if (message !== null) {
          onCreature(message.creature);
        }
      });

      socket.addEventListener('close', () => {
        setStatus('closed');

        if (!disposed) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      });
    };

    connect();

    return () => {
      disposed = true;

      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
      }

      socket?.close();
    };
  }, [onCreature]);

  return status;
};
