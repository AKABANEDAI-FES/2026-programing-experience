import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ReleaseRequest, ReleaseResponse } from 'shared';
import { decodeImageDataUrl } from './lib/image';

type Bindings = {
  ALLOWED_ORIGINS?: string;
};

const DEVELOPMENT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      const allowedOrigins = (c.env.ALLOWED_ORIGINS?.split(',') ?? DEVELOPMENT_ORIGINS)
        .map((allowedOrigin: string) => allowedOrigin.trim())
        .filter(Boolean);

      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 600,
  }),
);

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

  const res: ReleaseResponse = {
    success: true,
    message: '無事に海へ放流されました！',
  };

  return c.json(res, 200);
});

export default app;
