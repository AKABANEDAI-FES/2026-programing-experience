# デプロイ手順

フロントエンド（参加者画面・大画面）とバックエンド（API・WebSocket）を、1つの Cloudflare Worker から配信します（#61・#73）。
画面と API が同じ URL になるため、接続先は相対パス（`/api/...`、`/ws/display`）で書きます。

## 構成

| 項目                  | 値                                                           |
| :-------------------- | :----------------------------------------------------------- |
| Cloudflare アカウント | 実行委員会（`akabanedai-fes`）                               |
| Worker 名             | `2026-programming-experience`                                |
| 公開 URL              | `https://2026-programming-experience.akabanedai.workers.dev` |
| R2 バケット           | `2026-programming-experience`                                |

`backend/wrangler.jsonc` で次のように振り分けています。

- `/api/*` と `/ws/*` は Worker（Hono）が処理する
- それ以外は `frontend/dist` の静的ファイルを返す
- `/display` などファイルがないパスには `index.html` を返す

## 初回だけ行うこと

1. 実行委員会のアカウントで R2 バケット `2026-programming-experience` を作る（ダッシュボードの「R2 オブジェクトストレージ」→「バケットを作成」）
2. WSL などのターミナルで Cloudflare にログインする

   ```bash
   npx wrangler login
   ```

Durable Object は初回のデプロイで自動的に作られます。

## デプロイする

リポジトリのルートで実行します。フロントをビルドしてから、Worker をデプロイします。

```bash
npm run deploy
```

## 開発環境

`npm run dev` のまま使えます。Vite（`localhost:5173`）が `/api` と `/ws` を `wrangler dev`（`localhost:8787`）へ転送するので、本番と同じパスで動作確認できます。

## 注意

- #74（不正な投稿の防止）が終わるまでは、公開 URL をチームの外に出さないでください。
