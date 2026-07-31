# WordPress 最小限セットアップ（staging）

Blogterest 本番は触らない。**デザインより「必要最低限」** だけ整える。

---

## 自動（ターミナル）

```bash
cd ~/Desktop/circlemap/circlemap/docs
python3 wp-minimal-setup.py --dry-run   # 確認
python3 wp-minimal-setup.py             # 実行
```

やること:

- 固定ページ3つ（運営者情報 / プライバシーポリシー / お問い合わせ）を **公開**
- 新規投稿の **コメント・ピンバック OFF**
- 既存投稿の **コメント OFF**

---

## 手動（Cocoon 管理画面・5分）

### 1. フッターメニュー

1. **外観 → メニュー** → 新規メニュー「フッター」
2. 固定ページから3ページを追加
3. **外観 → カスタマイズ → フッター** でメニューを表示

表示例: `運営者情報 | プライバシーポリシー | お問い合わせ`

### 2. コメント欄を非表示（念のため）

1. **Cocoon設定 → 全体 → コメント**
2. 投稿ページのコメント欄を **表示しない**

（REST で OFF 済みでも、Cocoon 側で隠すと確実）

### 3. スマホ確認

1. 記事1本を開く
2. MGS バナー → 「動画はこちら」が縦に読めるか

---

## やらない（今は）

- 有料テーマ・大幅 CSS
- Blogterest とピクセル合わせ
- ロゴ・ダークテーマ

---

## 本番切替前に足すもの

- サイト名から「（staging）」を外す
- お問い合わせ: Cocoon フォーム or Contact Form 7
- エロタレ再審査前にデザイン変更 → 連絡（猶予1週間）

---

## 関連

| ファイル | 用途 |
|---------|------|
| [`wp-minimal-setup.py`](wp-minimal-setup.py) | 固定ページ + コメント OFF |
| [`pillar-c-blogterest-contact-setup.md`](pillar-c-blogterest-contact-setup.md) | Blogterest 版（文案の元） |
