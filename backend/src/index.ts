import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ReleaseRequest, ReleaseResponse } from 'shared';
import { decodeImageDataUrl } from './lib/image';
import { saveImage } from './lib/storage';

type Bindings = CloudflareBindings & {
  ALLOWED_ORIGINS?: string;
};

const DEVELOPMENT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const getAllowedOrigins = (configuredOrigins?: string): string[] => {
  return (configuredOrigins?.split(',') ?? DEVELOPMENT_ORIGINS)
    .map((allowedOrigin) => allowedOrigin.trim())
    .filter(Boolean);
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      const allowedOrigins = getAllowedOrigins(c.env.ALLOWED_ORIGINS);

      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 600,
  }),
);

app.get('/ws/display', (c) => {
  const upgradeHeader = c.req.header('Upgrade');

  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    return c.text('WebSocket接続が必要です', 426);
  }

  const origin = c.req.header('Origin');
  const allowedOrigins = getAllowedOrigins(c.env.ALLOWED_ORIGINS);

  if (!origin || !allowedOrigins.includes(origin)) {
    return c.text('許可されていない接続元です', 403);
  }

  const id = c.env.DISPLAY_ROOM.idFromName('main');
  const room = c.env.DISPLAY_ROOM.get(id);

  return room.fetch(c.req.raw);
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.post('/api/release', async (c) => {
  const body = await c.req.json<Partial<ReleaseRequest>>();
  const decoded = decodeImageDataUrl(body?.image_base64);

  if (!decoded.success) {
    const errorRes: ReleaseResponse = {
      success: false,
      message: decoded.message,
    };

    return c.json(errorRes, 400);
  }

  try {
    await saveImage(c.env.IMAGES, decoded.image);
  } catch (error) {
    console.error('R2への保存に失敗しました', error);

    const errorRes: ReleaseResponse = {
      success: false,
      message: 'データの受け取りに失敗しました',
    };

    return c.json(errorRes, 500);
  }

  const res: ReleaseResponse = {
    success: true,
    message: '無事に海へ放流されました！',
  };

  return c.json(res, 200);
});

export { DisplayRoom } from './durable-objects/DisplayRoom';
export default app;
