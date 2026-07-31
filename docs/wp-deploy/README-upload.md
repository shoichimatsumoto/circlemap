# シンサーバーへアップロードする手順（5分）

**重要:** Cursor からシンサーバー上のファイルは直接編集できません。  
このフォルダの中身を **ファイルマネージャでアップロード** してください。

---

## ① mu-plugin（必須）

1. シン **サーバーパネル → ファイルマネージャ**
2. `public_html/wp-content/` を開く
3. **`mu-plugins` フォルダがなければ作成**
4. 次の2ファイルを **`public_html/wp-content/mu-plugins/`** にアップロード

| ローカル | サーバー |
|----------|----------|
| `rest-auth-fix.php` | REST API 認証 |
| `erolog-mgs-shortcode.php` | MGS 広告 `[erolog_mgs]` |

---

## ② .htaccess（必須）

1. `public_html/.htaccess` を **編集**
2. ファイル **先頭**（`# BEGIN WordPress` より上）に  
   `htaccess-paste-top.txt` の内容を **そのまま貼り付け**
3. 保存

---

## ③ wp-config.php（②だけでダメなとき）

1. `public_html/wp-config.php` を編集
2. `/* 編集が必要なのはここまで */` の **直前** に  
   `wp-config-paste.txt` の3行を貼り付け
3. 保存

---

## ④ テスト（Mac ターミナル）

```bash
cd ~/Desktop/circlemap/circlemap/docs
python3 wp-post-draft.py \
  --title 'test' --line1 'a' --line2 'b' \
  --video-url 'https://example.com/video'
```

`下書き作成 OK` が出れば完了。

---

## ZIP でまとめて上げる場合

```bash
cd ~/Desktop/circlemap/circlemap/docs/wp-deploy
zip -r wp-rest-auth-fix.zip wp-content htaccess-paste-top.txt wp-config-paste.txt
```

`wp-content` フォルダごと `public_html` に解凍/マージ（既存 wp-content と統合）。
