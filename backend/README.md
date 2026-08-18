```txt
npm install
npm run dev
```

```txt
npm run deploy
```

## CORS configuration

API routes under `/api/*` allow requests from `http://localhost:5173` by default for local
development.

To use a different frontend URL, set the `ALLOWED_ORIGINS` Worker variable. Multiple origins can
be specified as a comma-separated list.

```jsonc
{
  "vars": {
    "ALLOWED_ORIGINS": "https://example.com,https://www.example.com",
  },
}
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```
