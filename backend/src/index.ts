import { Hono } from 'hono';
import type { ReleaseRequest } from 'shared';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.post('/api/release', async (c) => {
  await c.req.json<ReleaseRequest>();

  return c.json({ success: true }, 200);
});

export default app;
