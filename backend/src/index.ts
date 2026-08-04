import { Hono } from 'hono';
import type { Creature, ReleaseRequest } from 'shared';
import { MAX_COMMANDS, MAX_CREATURES } from 'shared';

const app = new Hono();

const allowedOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
const creatures: Creature[] = [];

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (origin !== null && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function isReleaseRequest(value: unknown): value is ReleaseRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const request = value as Partial<ReleaseRequest>;
  return (
    (request.mode === 'free' || request.mode === 'coloring') &&
    typeof request.image_base64 === 'string' &&
    request.image_base64.startsWith('data:image/svg+xml') &&
    Array.isArray(request.commands) &&
    request.commands.length <= MAX_COMMANDS
  );
}

app.options('*', (c) => {
  return c.body(null, 204, corsHeaders(c.req.header('Origin') ?? null));
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/api/creatures', (c) => {
  return c.json(
    {
      creatures,
    },
    200,
    corsHeaders(c.req.header('Origin') ?? null),
  );
});

app.post('/api/release', async (c) => {
  const origin = c.req.header('Origin') ?? null;
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        success: false,
        message: 'JSONの読み取りに失敗しました',
      },
      400,
      corsHeaders(origin),
    );
  }

  if (!isReleaseRequest(body)) {
    return c.json(
      {
        success: false,
        message: '送信データの形式が正しくありません',
      },
      400,
      corsHeaders(origin),
    );
  }

  const creature: Creature = {
    id: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    mode: body.mode,
    imageUrl: body.image_base64,
    commands: body.commands,
    createdAt: Date.now(),
  };

  creatures.push(creature);

  while (creatures.length > MAX_CREATURES) {
    creatures.shift();
  }

  return c.json(
    {
      success: true,
      message: '無事に海へ放流されました！',
      creature,
    },
    200,
    corsHeaders(origin),
  );
});

export default app;
