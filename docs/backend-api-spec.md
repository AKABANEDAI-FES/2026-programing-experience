# バックエンドAPI仕様書

このドキュメントは、フロントエンド（参加者画面や大画面モニター）とバックエンド（APIサーバー）がやり取りするデータの形式とルールを定義します。

## 1. 放流API（絵とプログラムの送信）

参加者のPCから、描いた絵と組んだプログラムをサーバーに送るためのAPIです。

- **エンドポイント URL**: `http://localhost:8787/api/release` （※本番環境ではCloudflareのURLに変更）
- **HTTPメソッド**: `POST`
- **目的**: 参加者の作品データをサーバーで受け取り、保存および大画面への通知準備を行う。

### リクエスト（フロントから送るデータ）

- **Headers**: `Content-Type: application/json`
- **Body**:

```json
{
  "mode": "free", // 文字列: "free"（自由描画）または "coloring"（塗り絵）
  "image_base64": "data:image/png;base64,...", // 文字列: キャンバスの画像データ
  "commands": [
    { "type": "move", "motion": "jump" },
    { "type": "say", "text": "こんにちは" }
  ] // 最大5件のコマンドオブジェクト配列
}
```

`commands` の各要素は以下のいずれかです。`type: "move"` の `motion` は現時点では文字列であり、許可する動きの種類は画面③の実装とあわせて後で制限します。

```json
{ "type": "move", "motion": "jump" }
```

```json
{ "type": "say", "text": "こんにちは" }
```

### レスポンス（バックエンドからの返事）

成功時 (ステータスコード: 200 OK)

```json
{
  "success": true,
  "message": "無事に海へ放流されました！"
}
```

### 失敗時 (ステータスコード: 500 Internal Server Error)

```json
{
  "success": false,
  "message": "データの受け取りに失敗しました"
}
```

## 2. 大画面WebSocket接続

大画面モニターとバックエンドの常時接続を確立し、作品の保存完了通知をリアルタイムで受信するための接続口です。

- **エンドポイントURL**: `ws://localhost:8787/ws/display`（※本番環境ではCloudflareのURLに変更）
- **HTTPメソッド**: `GET`
- **接続方式**: WebSocket
- **接続対象**: 大画面モニター
- **接続元の制限**: 開発環境では `http://localhost:5173` と `http://127.0.0.1:5173` からの接続のみ許可

### 接続時のエラー

- 通常のHTTPアクセスには `426 Upgrade Required` を返す。
- 許可されていない接続元には `403 Forbidden` を返す。

Issue #16ではWebSocket接続の確立のみを行います。通知メッセージの送信、複数接続の管理、ブロードキャスト処理はIssue #25で実装します。
