import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ReleaseRequest, ReleaseResponse } from 'shared';

type Bindings = {
  ALLOWED_ORIGINS?: string;
};

const DEVELOPMENT_ORIGIN = 'http://localhost:5173';

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      const allowedOriginsSetting = (c.env.ALLOWED_ORIGINS ?? DEVELOPMENT_ORIGIN) as string;
      const allowedOrigins = allowedOriginsSetting
        .split(',')
        .map((allowedOrigin) => allowedOrigin.trim())
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
  await c.req.json<ReleaseRequest>();

  const res: ReleaseResponse = {
    success: true,
    message: '無事に海へ放流されました！',
  };

  return c.json(res, 200);
});

export default app;
