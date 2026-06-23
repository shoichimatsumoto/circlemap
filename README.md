# CircleMap

FANZA同人の漫画・CG・音声・ゲームを**サークル軸**で横断できるデータベースサイト（開発中）。

## 現在の状態

- ✅ プロトタイプ（`../circlemap-prototype/`）の画面を Next.js に移植
- ✅ **DMM API 連携レイヤー**（キー未設定時はモックに自動フォールバック）
- ✅ Home / サークル / 作品詳細 がデータ層経由で表示
- ⏳ DMM API キー未設定 → 今はモックデータ表示
- ⏳ DB（Supabase）未接続

## セットアップ

### 1. Node.js をインストール

[https://nodejs.org/](https://nodejs.org/) から LTS をインストール。

### 2. 依存関係のインストール & 起動

```bash
cd ~/Desktop/circlemap/circlemap
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

画面上部のバナーでデータソースを確認できます：

- 🟡 **モックデータ** … API キー未設定
- 🟢 **DMM API 実データ** … キー設定済み

API 状態確認: [http://localhost:3000/api/status](http://localhost:3000/api/status)

### 3. DMMアフィリエイト登録

1. [DMMアフィリエイト](https://affiliate.dmm.com/) に登録
2. 審査通過後、[DMM Webサービス](https://affiliate.dmm.com/api/) で API ID を取得
3. `.env.local` を作成：

```bash
cp .env.example .env.local
```

```env
DMM_API_ID=your_api_id
DMM_AFFILIATE_ID=your_affiliate_id-990
```

4. `npm run dev` を再起動 → 実データに切り替わる

## ページ構成

| パス | 内容 |
|---|---|
| `/` | トップ（新着作品・媒体別入口） |
| `/circle` | サークル統合ページ（核心） |
| `/circle?id=xxx` | 特定サークル（DMM連携時） |
| `/work/[id]` | 作品詳細（試聴・購入CTA） |
| `/api/status` | データソース確認用 |

## コード構成

```
src/lib/
├── types.ts          型定義
├── mock-data.ts      デモ用データ
├── dmm.ts            DMM API クライアント
├── dmm-transform.ts  APIレスポンス → Work/Circle 変換
└── data.ts           統合データ層（mock / dmm 自動切替）
```

## 次の開発ステップ

1. **DMM API キー設定** — 実データ表示の確認
2. **Supabase** — 作品・サークル・タグのDB設計
3. **同期バッチ** — 毎日新作を取り込む
4. **サークルページ強化** — メーカー名検索でサークル特定
5. **SEO** — サイトマップ・JSON-LD
6. **デプロイ** — Vercel + 独自ドメイン

## 方針

> FANZA同人の合法アフィリサイトを、サークル軸のコレクター向けデータベースとして作る。
> ハイブリッド型（音声・マンガ・CG・ゲーム横断）。
