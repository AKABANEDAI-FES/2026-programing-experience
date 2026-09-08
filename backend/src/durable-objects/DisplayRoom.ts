import { DurableObject } from 'cloudflare:workers';

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
}
