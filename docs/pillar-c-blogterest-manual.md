# Blogterest 登録マニュアル（エログメモ / erologmemo.com）

柱C **本体サイト** のセットアップ手順。  
note（`ero_log_memo`）は **情報・記録**、Blogterest は **エログ本体** として別物。

---

## 前提（このマニュアルでの固定値）

| 項目 | 値 |
|------|-----|
| サイト名（表示） | **エログメモ** |
| Blogterest サブドメイン | **erologmemo** |
| 仮 URL | `http://erologmemo.blogterest.net/` |
| 独自ドメイン（目標） | **erologmemo.com**（お名前.com 取得済み） |
| note（別物） | https://note.com/ero_log_memo |

---

## 全体の流れ

```
Step 1  Blogterest アカウント・サイト作成
Step 2  確認メール → ログイン
Step 3  独自ドメイン erologmemo.com を Blogterest に登録
Step 4  お名前.com で DNS 設定（Blogterest の指示どおり）
Step 5  反映確認（https://erologmemo.com が開く）
Step 6  記事投稿開始 → 30本 → エロタレ申請
```

---

## Step 1: サイト作成（10分）

1. [Blogterest ブログ作成](https://welcome.blogterest.net/welcome/) を開く
2. 入力:

   | 項目 | 入力 |
   |------|------|
   | サイト名 | **エログメモ** |
   | ドメイン | **erologmemo**（`.com` は付けない） |
   | メールアドレス | 確認メールが届くアドレス |
   | パスワード | 半角英数字 4文字以上 |

3. 登録 → **確認メール** が届く
4. メール内リンク → 登録完了

### よくあるミス

| ミス | 正しい |
|------|--------|
| ドメインに `erologmemo.com` | **`erologmemo` のみ** |
| サイト名を note と同じ長文 | 本体は **エログメモ** で OK |
| 確認メールが届かない | 迷惑メールフォルダ確認 |

---

## Step 2: ログイン・管理画面（5分）

1. Blogterest にログイン
2. サイト **エログメモ** を開く
3. 仮 URL で表示確認: `http://erologmemo.blogterest.net/`
4. **管理画面**（設定・記事作成）に入れることを確認

### メモ

```
Blogterest 仮 URL: http://erologmemo.blogterest.net/
ログインメール: ________________________________
```

---

## Step 3: 独自ドメイン設定（Blogterest 側・10分）

1. Blogterest **管理画面** を開く
2. **独自ドメイン**（またはドメイン設定）メニューを探す  
   ※ メニュー名は画面により「独自ドメイン」「ドメイン設定」等
3. **`erologmemo.com`** を入力して登録
4. 画面に **DNS 設定の指示** が表示される → **メモ or スクショ**

   例（実際の値は Blogterest 画面のものを使う）:

   ```
   ホスト名: @ または www
   TYPE:   CNAME または A
   VALUE:  （Blogterest が指定する値）
   ```

5. **Blogterest 側の設定を保存**

> **重要:** DNS の VALUE はサービスごとに違う。**Blogterest に書いてある値をそのまま** お名前.com に入れる。

---

## Step 4: DNS 設定（お名前.com・15分）

1. [お名前.com Navi](https://navi.onamae.com/) にログイン
2. 上部 **ドメイン** → **ドメイン設定** → **DNS関連機能の設定**
3. **erologmemo.com** を選択 → **次へ**
4. **DNSレコード設定を利用する** → **設定する**
5. Blogterest の指示どおりにレコードを追加:

   | 項目 | 入力 |
   |------|------|
   | ホスト名 | Blogterest の指示（空欄 = `@` のことも） |
   | TYPE | CNAME または A |
   | TTL | 3600（デフォルトで OK） |
   | VALUE | Blogterest が指定した値 |
   | 状態 | 有効 |

6. **DNSレコード設定用ネームサーバー変更確認** にチェック
7. **確認画面へ進む** → **設定する**

### お名前.com 操作の参照

- [DNS関連機能の設定（一般的な流れ）](https://help.hatenablog.com/entry/customdomain) — レコード追加の UI は同系

---

## Step 5: 反映待ち・確認（数時間〜48時間）

1. ブラウザで **`https://erologmemo.com`** を開く
2. **エログメモ** の Blogterest サイトが表示されれば OK
3. まだダメなら **数時間待つ**（DNS 伝播）

### 反映前にできること

- `.blogterest.net` の URL で **記事を書き始める**
- [`pillar-c-duplicate-log.csv`](pillar-c-duplicate-log.csv) に動画 URL を記録

### 反映後にやること

- **DMM アフィリ** に `https://erologmemo.com` をサイト追加
- **エロタレ申請** はこの URL が安定してから（30記事後）

---

## Step 6: 最初の記事（1本の型）

管理画面 → **新規記事**

```
【タイトル】
＜MM号＞〜のエロ動画ｗ【素人ナンパ】

【本文】
2〜3行の説明

動画はこちら
→ （エロタレ or DMM リンク）

【カテゴリ・タグ】
2〜3個
```

### 注意

- **同じ動画を7日以内に再投稿しない**
- 問題のあるタグ・表現は使わない
- 予約投稿は複数記事 **1〜2分以内** にまとめる

---

## エロタレ申請まで（参考）

[審査の要点（note 参考記事）](https://note.com/good_pansy354/n/nb49bde585e93):

- 記事 **30本以上**
- **ブログパーツ** 設置
- **DMM アフィリパーツ** 設置
- **問い合わせフォーム**
- 申請 URL は **`https://erologmemo.com`**
- 審査 **2〜3週間** → その間も **1日3本以上** 更新

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| 確認メールが来ない | 迷惑メール・メールアドレス typo |
| `erologmemo` が取れない | 別名（`erologmemo2`）→ 独自ドメインは `erologmemo.com` のまま可 |
| DNS 設定後も開かない | 24〜48h 待つ / Blogterest の VALUE 再確認 |
| 独自ドメインと .blogterest.net 両方？ | 反映後は **erologmemo.com** が本番 |
| デザインがシンプル | 正常。エログは **記事量** が優先 |

---

## 完了チェックリスト

- [ ] Blogterest 作成（エログメモ / erologmemo）
- [ ] ログイン・管理画面確認
- [ ] 独自ドメイン `erologmemo.com` を Blogterest に登録
- [ ] お名前.com DNS 設定
- [ ] `https://erologmemo.com` 表示確認
- [ ] 記事 1本以上
- [ ] 重複ログ CSV に URL 記録

---

## 関連ファイル

| ファイル | 用途 |
|---------|------|
| [`pillar-c-day1-checklist.md`](pillar-c-day1-checklist.md) | 全体 ToDo |
| [`pillar-c-duplicate-log.csv`](pillar-c-duplicate-log.csv) | 7日重複チェック |
| [`pillar-c-note-01-draft.md`](pillar-c-note-01-draft.md) | note 第1弾（情報側） |

---

## メモ欄

```
Blogterest 仮 URL:
Blogterest 管理画面 URL:
DNS VALUE（Blogterest 指示）:
erologmemo.com 反映日:
DMM サイト登録: 申請済み 2026/07/09（審査待ち）
エロタレ申請日: ⬜
```
