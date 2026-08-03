# 柱C — Blogterest 本番 + WordPress Erg 代替（並行ロードマップ）

**方針:** エロタレ反映は **Blogterest（erologmemo.com）** を継続。  
WP は **ステージング** で Erg 相当の半自動基盤をコツコツ作る。ドメイン切替は WP が実戦投入できるまで後回し。

---

## 二刀流の役割分担

| 役割 | Blogterest（今） | WordPress（これから） |
|------|------------------|------------------------|
| エロタレ反映 | ✅ 反映ボタン（30分間隔） | 切替まで使わない |
| 記事公開 | ✅ 本番 | ステージングのみ |
| 文案・選定 | Cursor + キューCSV | 同じ CSV を流用 |
| HTML生成 | `gen-blogterest-html.py` | `wp-post-mirror.py`（共通 `erolog_article.py`） |
| **Blogterest 登録後** | エロタレ反映 | **必ず WP ミラー**（下書き or 公開） |
| 重複管理 | `pillar-c-reflection-queue.csv` | 同ファイルを正とする |
| 自動化の先 | 半自動が上限 | cron + REST API で拡張 |

---

## 出品リスト（キュー）ルール — **ここが正**

`pillar-c-reflection-queue.csv` に **`eroterest_page` が1行でも載ったら、もう「次出して」対象にしない。**

| 状態 | 意味 | AIが出すもの |
|------|------|-------------|
| 文案済 | 文案OK・未登録 or 登録前 | **出さない**（登録だけ） |
| 登録済 | Blogterest 公開済・反映前 | **出さない**（反映待ち） |
| 1回被り | 1回目反映が被り | **2回目文案だけ** |
| 遅延OK / 保留 / 削除 | 反映終了 | **出さない** |

**「次出して」= CSV に無い `eroterest_page` を新規スキャン → 1本だけ追加**

- 同じ page ID の文案再送 → **禁止**
- 反映待ち中（page/93 等）→ **新規 page だけ** 出して OK
- 被り時のみ、同 ID で **タイトル差替え文案** を出す

---

## フェーズ

### Phase 0 — WP 環境（ユーザー作業・1日）

- [ ] アダルトOK VPS/レンタルサーバ契約（Xserver / ConoHa / さくら 等）
- [ ] **ステージング用サブドメイン**（例: `staging.erologmemo.com` または `wp.erologmemo.com`）
- [ ] WordPress インストール
- [ ] テーマ: Cocoon または SWELL（無料版で可）
- [x] 固定ページ: 運営者情報・プライバシーポリシー・お問い合わせ（`wp-minimal-setup.py`）
- [ ] フッターメニューに3ページリンク（手動・[`pillar-c-wp-minimal-setup.md`](pillar-c-wp-minimal-setup.md)）
- [ ] **アプリケーションパスワード** 発行 → `docs/wp-config.env`

> **本番 DNS（erologmemo.com）は触らない。** Blogterest 継続。

### Phase 1 — 手動下書き（今週）

- [x] 共通 HTML モジュール `erolog_article.py`
- [x] `wp-post-draft.py`（REST API 下書き）
- [ ] Blogterest で1本出した文案を、WP にも `--dry-run` → 下書きでミラー1本
- [x] MGS: mu-plugin `erolog-mgs-shortcode.php` + 本文 `[erolog_mgs]`
- [ ] mu-plugin をサーバーにアップロード → `--refresh` で id=13 確認

```bash
cd ~/Desktop/circlemap/circlemap/docs
cp wp-config.example.env wp-config.env
# wp-config.env を編集

python3 wp-post-draft.py --dry-run \
  --title '＜秘密＞｜テストｗ' \
  --line1 'あらすじ1' --line2 'あらすじ2' \
  --video-url 'https://example.com/video'

python3 wp-post-draft.py \
  --title '…' --line1 '…' --line2 '…' \
  --video-url '…' --tags '人妻 筆おろし' \
  --eroterest-page 44707650
```

### Phase 2 — ミラー連携（**Blogterest 登録 = 必ず WP ミラー**）

**方針（2026/07/31〜）:** Blogterest に **新規登録した記事は全部** staging WP にも載せる。  
**過去分はミラーしない。** 保留・削除（被り2回等）は WP に載せない。

| Blogterest | WP ミラー |
|------------|-----------|
| 新規登録 → 遅延OK | ✅ 必ず |
| 保留・削除 | ❌ しない |
| 2回目タイトル差替えのみ | BT のみ（WP は `--refresh` で任意更新） |

- [x] `pillar-c-wp-mirror.csv`（本文・タグ・動画URL 付きミラー用）
- [x] `wp-post-mirror.py`（未ミラー行 → WP 投稿、`wp_post_id` 自動記録）
- [x] 表示確認（あらすじ・MGS・動画リンク・タグ）
- [x] **運用ルール確定:** 登録のたびにミラー CSV + `--page`
- [x] page/96（44707610）ミラー → WP id=23
- [ ] 7日重複: `pillar-c-duplicate-log.csv` と eroterest_page の突合

**登録後の流れ（4ステップ）**

1. Blogterest 新規登録
2. エロタレ反映 → 結果を `pillar-c-reflection-queue.csv` に記録
3. **遅延OK なら** 同内容を `pillar-c-wp-mirror.csv` に1行追加
4. `python3 wp-post-mirror.py --page （eroterest_page）` → 下書き確認（公開は任意）

```bash
cd ~/Desktop/circlemap/circlemap/docs
python3 wp-post-mirror.py --list
python3 wp-post-mirror.py --page 44707610
python3 wp-post-mirror.py --all
```

### Phase 3 — 自動化（段階的）

Blogterest 運用で確立したルールをコード化。**完全自動は狙わない。**

#### 3a — ミラー同期（**着手済**）

| コマンド | 用途 |
|----------|------|
| `python3 wp-sync.py status` | 遅延OK × ミラー CSV の突合 |
| `python3 wp-sync.py run` | 未ミラーを一括 WP 下書き |
| `python3 wp-sync.py run --page ID` | 1件だけ |

- [x] `wp_mirror_lib.py`（CSV 読み書き・投稿・`append_mirror_row`）
- [x] `wp-sync.py`（status / stash-add / sync-mirror / run）
- [x] `pillar-c-copy-stash.csv`（文案 stash → 遅延OK 後に自動ミラー追記）

**登録後の流れ（3b 以降）**

1. Blogterest 登録前 … `python3 wp-sync.py stash-add --page … --title … --line1 … --line2 … --video-url … --tags …`
2. エロタレ反映 → キュー CSV を **遅延OK** に更新
3. `python3 wp-sync.py run --page （eroterest_page）` … sync-mirror + WP 下書き（1コマンド）

#### 3b — stash 連携（**完了**）

#### 3b+ — WP 先行（Blogterest 負荷軽減）

Blogterest がキツい間は **文案 → stash → WP 下書き** だけ回す。

| コマンド | 用途 |
|----------|------|
| `python3 wp-sync.py stash-add ...` | 文案保存（BT 登録前で OK） |
| `python3 wp-sync.py draft-stash` | stash → WP 下書き（**BT / 遅延OK 不要**） |
| `python3 wp-sync.py run` | BT で遅延OK になった分をミラー（従来） |

**Blogterest 最小運用:** エロタレ反映に必要な分だけ（週2〜3本など）。WP は stash で先行ストック。

#### 3c — 定期実行

```bash
cp docs/wp-deploy/com.erologmemo.wp-sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.erologmemo.wp-sync.plist
# 毎朝7時: wp-sync.py run（遅延OK 分を自動 WP 下書き）
# ログ: docs/wp-sync.log
```

- [x] launchd テンプレ `wp-deploy/com.erologmemo.wp-sync.plist`
- [ ] ユーザーが load して有効化

#### 3c — Erg 相当ルール

| Erg 機能 | 自前実装案 |
|----------|-----------|
| 動画選定 | 除外リスト + click 上限 + ホスト whitelist |
| タイトル生成 | Cursor 文案（現状維持）→ 将来テンプレ |
| 7日重複 | CSV + eroterest_page セット |
| 予約投稿 | WP `status=future` + cron |
| ランク別時刻 | 公開時刻テーブル（22〜23時多め等） |
| エロタレ反映 | **切替まで Blogterest**。WP は RSS 検証のみ |

### Phase 4 — 本番切替（WP が安定してから）

- [ ] ステージングで 30本 + RSS 全件確認
- [ ] エロタレに **ドメイン変更依頼**（Blogterest → WP）
- [ ] DNS 切替・301 検討
- [ ] Blogterest は1ヶ月バックアップとして残す

---

## ファイル一覧

| ファイル | 用途 |
|---------|------|
| [`erolog_article.py`](erolog_article.py) | MGS + 本文 HTML（BT/WP 共通） |
| [`gen-blogterest-html.py`](gen-blogterest-html.py) | Blogterest 1行貼り |
| [`wp-post-draft.py`](wp-post-draft.py) | WP REST 下書き |
| [`wp-post-mirror.py`](wp-post-mirror.py) | ミラー CSV → WP 下書き |
| [`wp-sync.py`](wp-sync.py) | 状態確認 + stash + 一括ミラー |
| [`wp_mirror_lib.py`](wp_mirror_lib.py) | ミラー CSV 共通処理 |
| [`pillar-c-copy-stash.csv`](pillar-c-copy-stash.csv) | 文案 stash（遅延OK 前） |
| [`wp-config.example.env`](wp-config.example.env) | 認証テンプレ |
| [`pillar-c-reflection-queue.csv`](pillar-c-reflection-queue.csv) | 使用済み page・状態 |
| [`pillar-c-duplicate-log.csv`](pillar-c-duplicate-log.csv) | 7日 NG |

---

## 注意（Erg / 自動化）

- ❌ エロタレ特化 Bot の **第三者販売**（要請リスク）
- ✅ **自分用** スクリプト + note 手順共有
- Blogterest 本番の **反映間隔・被りルール** は変更しない
- WP 側の実験で本番エロタレに影響を出さない（ステージング限定）

---

## 次のアクション（ユーザー）

1. サーバ / ステージングサブドメインを決める
2. `wp-config.env` を用意
3. 「WP 下書き1本テスト OK」と報告 → Phase 2 のキュー連携スクリプトを作る

Blogterest の文案・反映は **今まで通り** 続行。WP は余力で Phase 0〜1。
