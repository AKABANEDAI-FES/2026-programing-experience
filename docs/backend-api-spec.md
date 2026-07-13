# バックエンドAPI仕様書

このドキュメントは、フロントエンド（参加者画面や大画面モニター）とバックエンド（APIサーバー）がやり取りするデータの形式とルールを定義します。

## 1. 放流API（絵とプログラムの送信）
参加者のPCから、描いた絵と組んだプログラムをサーバーに送るためのAPIです。

* **エンドポイント URL**: `http://localhost:8787/api/release` （※本番環境ではCloudflareのURLに変更）
* **HTTPメソッド**: `POST`
* **目的**: 参加者の作品データをサーバーで受け取り、保存および大画面への通知準備を行う。

### リクエスト（フロントから送るデータ）
* **Headers**: `Content-Type: application/json`
* **Body**:
```json
{
  "mode": "free",               // 文字列: "free"（自由描画）または "coloring"（塗り絵）
  "image_base64": "data:image/png;base64,...", // 文字列: キャンバスの画像データ
  "commands": ["move:jump"]     // 配列: スクラッチ画面で組んだブロックの命令
}
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

