import { Hono } from 'hono';
import type { ReleaseRequest, ReleaseResponse } from 'shared';

const app = new Hono();

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
