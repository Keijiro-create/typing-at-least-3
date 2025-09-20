# Typing Trainer / タイピングトレーナー

**English**: A bilingual typing trainer that focuses on sprint practice, IME-accurate logging, analytics, and PWA-first offline access.

**日本語**: 英日バイリンガル対応のタイピングトレーナー。スプリント練習と IME 正確計測、統計分析、PWA 対応でいつでも鍛えられます。

![App screenshot](./docs/screenshot.png)

## 主な特徴 / Features
- **マルチモード練習**: 1 分スプリント × 3 セットをベースにした実践的メニュー
- **IME 厳密計測**: 確定文字のみをログし、Backspace での減点なし
- **PWA 対応**: オフライン動作、更新通知トースト付き
- **アクセシビリティ**: aria-live、キーボード操作、Reduced Motion 設定に対応

## Quick Start
1. 推奨環境: **Node.js 18 以上**
2. 依存インストール: `npm install`
3. 開発サーバー起動: `npm run dev`
4. ブラウザで `http://localhost:5173` を開き、以下を確認します
   - Practice ページでタイピング → 結果モーダルが表示される
   - 更新トーストが表示されるか（`import.meta.env.PROD` ビルド時）

## npm Scripts
| Script       | 説明 |
|--------------|------|
| `npm run dev`       | 開発サーバー (Vite) を起動 |
| `npm run build`     | TypeScript ビルド & Vite 本番ビルド |
| `npm run preview`   | ビルド後のコンテンツをローカルでプレビュー |
| `npm run test`      | Vitest（happy-dom）でユニット/コンポーネントテスト実行 |
| `npm run lint`      | ESLint（unused-imports 含む） |
| `npm run typecheck` | `tsc --noEmit` による型検証 |

## ディレクトリ構成 (抜粋)
```
├─ public/
│  ├─ icon512.png
│  ├─ manifest.webmanifest
│  └─ screenshots/
├─ src/
│  ├─ components/        # UI コンポーネント
│  ├─ context/           # グローバル状態 (Context + Reducer)
│  ├─ data/              # レッスン / フレーズ JSON
│  ├─ lib/               # 計測・解析・IME・i18n・Storage
│  ├─ pages/             # 各ページ (Home/Practice/Stats/Settings)
│  ├─ styles/            # Tailwind エントリ
│  ├─ sw.ts              # Service Worker 本体
│  └─ main.tsx           # Vite エントリ (index.tsx)
├─ README.md
├─ netlify.toml
├─ vercel.json
├─ vitest.config.ts
└─ tsconfig*.json
```

## 設定項目
Settings ページで次の項目を制御できます:
- **テーマ**: System / Light / Dark
- **キーボード配列**: JIS / US
- **音**: ミスタイプ時のサウンド通知 ON/OFF
- **目標 WPM**: スプリントの目標速度
- **Reduce Motion**: アニメーション抑制
- **言語**: UI ラベルを EN/JA 切替

## データ保存
- `localStorage` key: `typing.v1`
  - `schemaVersion`
  - `settings`
  - `progress`
  - `sessions`
- クリア方法: Settings ページの「Danger zone」で `Clear progress & sessions` を実行すると初期化されます。

## PWA 更新フロー
1. 本番ビルド後の `dist/` をホスティング
2. Service Worker (`sw.ts`) が主要アセットとレッスン JSON をプリキャッシュ
3. 新ビルドがデプロイされると、SW が `updatefound` → `installed` で `UpdateToast` コンポーネントが「Reload」通知を表示
4. Reload を押すと `SKIP_WAITING` → `controllerchange` → 自動リロードで新バージョン適用

## 練習メニュー例
- **1 分スプリント × 3 セット**
  - セットごとの WPM / Accuracy を比較
  - セットごとに弱点キーを抽出し、次回のウォームアップに利用

## 3 ヶ月の伸ばし方（週次ガイド）
| 期間 | 目標 | 指標 |
|------|------|------|
| 1-4 週目 | ホームポジション定着 + IME 慣れ | WPM 40 / Accuracy 95% |
| 5-8 週目 | 中段・記号・数字を含む練習 | WPM 55 / Accuracy 96% |
| 9-12 週目 | 実戦テンポ（文章 + 数字 + 記号） | WPM 70 / Accuracy 97% |
- 各週末に Stats ページで進捗サマリを確認
- Weak Keys の上位 5 キーを次週の重点練習に追加

## デプロイ
### Vercel
1. リポジトリを Vercel に接続
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Deploy 後は `dist/index.html` をベースに SPA として配信

### Netlify
1. Netlify で新規サイトを作成し Git 連携
2. Build Command: `npm run build`
3. Publish directory: `dist`
4. `netlify.toml` のリダイレクト設定で SPA 対応

## Vite エントリと本番ホスト
- ローカル開発も本番も **`/index.html` が Vite のエントリ**
- 本番配信ではビルド成果物の **`dist/index.html`** をトップとして配信します

## ライセンス
MIT License
