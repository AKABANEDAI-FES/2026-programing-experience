# バックエンドAPI仕様書

このドキュメントは、フロントエンド（参加者画面や大画面モニター）とバックエンド（APIサーバー）がやり取りするデータの形式とルールを定義します。

## 1. 放流API（絵とプログラムの送信）

参加者のPCから、描いた絵と組んだプログラムをサーバーに送るためのAPIです。

- **エンドポイント URL**: `http://localhost:8787/api/release` （※本番環境ではCloudflareのURLに変更）
- **HTTPメソッド**: `POST`
- **目的**: 参加者の作品データをサーバーで受け取り、保存および大画面への通知を行う。

### リクエスト（フロントから送るデータ）

- **Headers**:
  - `Content-Type: application/json`
  - `Idempotency-Key: <UUID v4>`（同一作品の再送には同じキーを使用）
- **Body**:

```json
{
  "image_base64": "data:image/png;base64,...", // 文字列: キャンバスの画像データ
  "commands": [
    { "type": "move", "motion": "jump" },
    { "type": "say", "text": "こんにちは" }
  ] // 0〜5件のコマンドオブジェクト配列。空配列も受け付ける
}
```

描画モードは参加者画面で使用しますが、放流APIおよび大画面通知には含めません。

### 冪等性キー

- フロントエンドは放流操作の初回送信時に `crypto.randomUUID()` でキーを生成します。
- 同じ内容の再試行では同じキーを使います。内容を変更して送信し直す場合は新しいキーを使います。
- 同じキー・同じ内容の送信が成功済みの場合、APIは保存済みの成功レスポンスを返し、R2への二重保存や通知の再発行を行いません。
- 同じキーの処理が進行中の場合は、`409 Conflict` と `REQUEST_IN_PROGRESS` を返します。少し待ってから、同じキーで再確認できます。
- 同じキーが別の内容に使われた場合は、`409 Conflict` と `IDEMPOTENCY_KEY_REUSED` を返します。フロントエンドは新しいキーで再送します。
- 成功結果は24時間保持します。処理が一定時間残った場合は、再送時にR2の保存状況を確認してから処理を再開します。
- バリデーションに失敗したリクエストは冪等性キーを確定しません。画像保存に失敗した場合も、同じキー・同じ内容で再試行できます。

`commands` の各要素は以下のいずれかです。`type: "move"` の `motion` は現時点では文字列であり、許可する動きの種類は画面③の実装とあわせて後で制限します。

```json
{ "type": "move", "motion": "jump" }
```

```json
{ "type": "say", "text": "こんにちは" }
```

`say` の `text` は、共有定数 `MAX_SAY_TEXT_LENGTH`（`shared/src/release.ts`）以下で指定します。画面表示に合わせて上限を調整する場合は、この共有定数の数値を変更します。

### レスポンス（バックエンドからの返事）

成功時 (ステータスコード: 200 OK)

```json
{
  "success": true,
  "message": "作品を保存しました！"
}
```

リクエストが不正な場合 (ステータスコード: 400 Bad Request)

```json
{
  "success": false,
  "message": "commands は配列で指定してください"
}
```

同じキーの処理中、または同じキーが異なるリクエスト内容で使われた場合は `409 Conflict` を返します。処理中は `code: "REQUEST_IN_PROGRESS"`、キー再利用時は `code: "IDEMPOTENCY_KEY_REUSED"` を設定します。

### 失敗時 (ステータスコード: 500 Internal Server Error)

```json
{
  "success": false,
  "message": "データの受け取りに失敗しました"
}
```

R2への保存結果や処理記録の状態を確認できない場合は `503 Service Unavailable` と `code: "RELEASE_STATUS_UNKNOWN"` を返します。この場合、フロントエンドは内容を保持し、同じキーで手動確認を続けます。

APIの成功は画像がR2に保存されたことを意味します。WebSocket通知はベストエフォートで、通知に失敗してもAPIは成功を返します。

## 2. 大画面WebSocket接続

大画面モニターとバックエンドの常時接続を確立し、作品の保存完了通知をリアルタイムで受信するための接続口です。

- **エンドポイントURL**:
  - 開発環境: `ws://localhost:8787/ws/display`
  - 本番環境: `wss://<本番ドメイン>/ws/display`（本番の画面はHTTPSで配信されるため、`wss://` を使用する）
- **HTTPメソッド**: `GET`
- **接続方式**: WebSocket
- **接続対象**: 大画面モニター
- **接続元の制限**: 開発環境では `http://localhost:5173` と `http://127.0.0.1:5173` からの接続のみ許可

### 接続時のエラー

- 通常のHTTPアクセスには `426 Upgrade Required` を返す。
- 許可されていない接続元には `403 Forbidden` を返す。

接続はDurable ObjectsのHibernation APIで管理し、放流APIで画像のR2保存が完了すると、接続中のすべての大画面へ `creature_added` メッセージを送信します。通知に失敗しても、画像が保存済みであれば放流APIは200を返します。

### サーバーからの通知メッセージ

```json
{
  "type": "creature_added",
  "creature": {
    "id": "12345678-1234-4234-8234-123456789abc",
    "imageUrl": "creatures/1789452946224-12345678-1234-4234-8234-123456789abc.png",
    "commands": [
      { "type": "move", "motion": "jump" },
      { "type": "say", "text": "こんにちは" }
    ],
    "createdAt": 1789452946224
  }
}
```

`imageUrl` はR2のオブジェクトキーであり、画像の取得にはIssue #63で追加予定の `GET /api/images/:key` を使います。
