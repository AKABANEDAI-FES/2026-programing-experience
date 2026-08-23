import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ReleaseResponse } from 'shared';
import { validateReleaseRequest } from './validation';

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
  let requestBody: unknown;

  try {
    requestBody = await c.req.json<unknown>();
  } catch {
    const errorResponse: ReleaseResponse = {
      success: false,
      message: 'リクエストボディは有効なJSON形式で指定してください',
    };

    return c.json(errorResponse, 400);
  }

  const validationResult = validateReleaseRequest(requestBody);

  if (!validationResult.success) {
    const errorResponse: ReleaseResponse = {
      success: false,
      message: validationResult.message,
    };

    return c.json(errorResponse, 400);
  }

  const res: ReleaseResponse = {
    success: true,
    message: '無事に海へ放流されました！',
  };

  return c.json(res, 200);
});

export default app;
