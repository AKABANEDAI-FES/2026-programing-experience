```txt
npm install
npm run dev
```

```txt
npm run deploy
```

## Release API authentication

`POST /api/release` requires a shared Bearer token. Generate a sufficiently long random value and
store it as a Worker secret. Do not add the token to `wrangler.jsonc` or a `VITE_*` variable because
those values can be exposed to browsers.

Run the following command from the repository root:

```txt
npx wrangler secret put RELEASE_TOKEN --config backend/wrangler.jsonc
```

For local development, create `backend/.dev.vars` (this file is ignored by Git) with the same kind
of value:

```txt
RELEASE_TOKEN=replace-with-a-random-token
```

Before using each venue PC, open the participant page on that PC and set the same token in the
browser console, then reload the page:

```js
localStorage.setItem('programming-experience-release-token', 'replace-with-the-same-token');
```

The token stays in that browser profile until local storage is cleared. Set it before enabling kiosk
restrictions, and never paste it into source code, Git, issue comments, or pull requests.

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
