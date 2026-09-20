import { DurableObject } from 'cloudflare:workers';
import type { DisplayMessage } from 'shared';
import { normalizeCloseCode } from '../lib/display';

export class DisplayRoom extends DurableObject<CloudflareBindings> {
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket接続が必要です', {
        status: 426,
      });
    }

    const [client, server] = Object.values(new WebSocketPair());

    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  broadcast(message: DisplayMessage): number {
    const serializedMessage = JSON.stringify(message);
    let sentCount = 0;

    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(serializedMessage);
        sentCount += 1;
      } catch {
        try {
          ws.close(1011, 'メッセージの送信に失敗しました');
        } catch (error) {
          console.error('WebSocketの切断に失敗しました', error);
        }
      }
    }

    return sentCount;
  }

  webSocketClose(ws: WebSocket, code: number, reason: string): void {
    ws.close(normalizeCloseCode(code), reason);
  }

  webSocketError(ws: WebSocket): void {
    ws.close(1011, 'WebSocketでエラーが発生しました');
  }
}
