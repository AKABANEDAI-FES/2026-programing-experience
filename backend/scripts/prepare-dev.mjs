// `npm run dev` の前に、wrangler dev が起動できる状態にそろえる
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

// assets.directory がないと wrangler dev が起動しないため、フロント未ビルドでも空のフォルダを用意する
mkdirSync('../frontend/dist', { recursive: true });

// 開発用の放流トークンを設定なしで使えるよう、.dev.vars がなければ example からコピーする
if (!existsSync('.dev.vars')) {
  copyFileSync('.dev.vars.example', '.dev.vars');
  console.log('backend/.dev.vars を .dev.vars.example から作成しました');
}
