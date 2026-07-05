/** X 運用メモ（x-draft ページ用） */
export function getXGuideHtml(): string {
  return `
<details class="guide">
  <summary>X 運用のコツ（CircleMap）</summary>
  <div class="guide-body">
    <p><strong>基本方針：</strong>自分の投稿を続ける ＋ <strong>紹介したサークル公式</strong>にだけ絡む。</p>

    <h3>投稿の流れ（月・水・土 ＋ 日曜は任意でバズ）</h3>
    <ol>
      <li>下の <strong>★ サムネ</strong> を保存して X に添付（<strong>フック・拡散向け</strong> は特にサムネ推奨）</li>
      <li><strong>③ @メンション</strong> — サークル公式を X で検索し、見つかったら <strong>@ハンドル</strong> を ① に足す</li>
      <li><strong>① 本文</strong> を投稿（URL なし）</li>
      <li>自分の投稿に <strong>② リプライ用リンク</strong> を返信</li>
    </ol>
    <p class="note"><strong>豆知識・バズ寄り</strong> … 週1回（日曜など）。サイトの強みを伝える系。</p>
    <p class="note"><strong>フック・拡散向け</strong> … 月1〜2回。<strong>【衝撃】</strong>系の短文＋問いかけ。サムネ必須推奨。buzz と交互で OK。</p>
    <p class="note"><strong>センシティブ対策：</strong>① 本文に <strong>R-18 作品タイトル・URL を入れない</strong>（サークル名＋媒体のみ）。タイトルは CircleMap のリンク先で見てもらう。</p>
    <p class="note">サムネは問題なさそうなものだけ。全部アウトなら <strong>① 本文のみ</strong>。</p>

    <h3>絡み方の方針</h3>
    <ul>
      <li><strong>◎ サークル公式</strong> — X で検索 → <strong>@</strong> を入れて投稿 or 引用</li>
      <li><strong>△ 同人まとめ・FANZA 公式</strong> — フォロー不要（詳しくなくて OK）</li>
      <li><strong>× シャドウバン警告あり</strong> — スキップ</li>
    </ul>

    <h3>あまりおすすめしないやり方</h3>
    <ul class="bad">
      <li>同人界隈アカウントを mass フォロー</li>
      <li>フォローした人にすぐ DM</li>
      <li>本文に R-18 作品タイトルをそのまま載せる</li>
      <li>本文に URL を詰め込む</li>
      <li>シャドウバン警告のあるアカウントに絡む</li>
      <li># ハッシュタグをたくさん付ける</li>
    </ul>

    <h3>まとめ</h3>
    <table>
      <tr><td>◎</td><td>月・水・土の投稿を続ける</td></tr>
      <tr><td>◎</td><td>日曜は「豆知識・バズ寄り」タブ（週1・任意）</td></tr>
      <tr><td>◎</td><td>月1〜2回「フック・拡散向け」（【衝撃】系・サムネ必須推奨）</td></tr>
      <tr><td>◎</td><td>サークル公式の <strong>@</strong> を入れる・引用する</td></tr>
      <tr><td>◎</td><td>リンクはリプライに載せる</td></tr>
      <tr><td>△</td><td>同人まとめアカウントをフォロー</td></tr>
    </table>
    <p class="note">公式アカウント: <a href="https://x.com/circlemap_jp" target="_blank" rel="noopener">@circlemap_jp</a></p>
  </div>
</details>`;
}

/** X 画像加工マニュアル（外注・Canva）— x-draft ページ用 */
export function getXImageManualHtml(): string {
  return `
<details class="guide" open>
  <summary>📷 画像加工マニュアル（外注・Canva）</summary>
  <div class="guide-body">
    <p><strong>目的：</strong>★ サムネを X 向けに整える。詳細版は <code>docs/x-image-outsourcing-manual.md</code></p>

    <h3>いつコラージュするか</h3>
    <table>
      <tr><td>◎</td><td><strong>人気TOP3 / 週次 / フック</strong> … 3枚横並びコラージュ</td></tr>
      <tr><td>△</td><td><strong>注目サークル</strong> … ★1枚そのまま or 軽加工</td></tr>
      <tr><td>—</td><td><strong>豆知識</strong> … 画像なしでも可</td></tr>
    </table>

    <h3>Canva 手順（3枚横並び）</h3>
    <ol>
      <li><a href="https://www.canva.com/" target="_blank" rel="noopener">Canva</a> → カスタムサイズ <strong>1080 × 1350 px</strong>（4:5）</li>
      <li>背景色 <code>#0f0f12</code></li>
      <li>x-draft の ★ ＋ 2・3枚目をアップロード → <strong>横3列</strong>（各 約300×400px、上端揃え）</li>
      <li>露骨なサムネは使わない（差し替え or 画像なし投稿）</li>
      <li>右下に <strong>circlemap.jp</strong>（紫 <code>#a78bfa</code> 24〜28px 太字、余白24px）</li>
      <li><strong>PNG</strong> でダウンロード → X に添付</li>
    </ol>

    <h3>★1枚だけ（注目サークル等）</h3>
    <ol>
      <li>同じ 1080×1350、背景 <code>#0f0f12</code></li>
      <li>★ を中央（幅 約720px）、右下 <strong>circlemap.jp</strong></li>
      <li>PNG 書き出し</li>
    </ol>

    <h3>禁止</h3>
    <ul class="bad">
      <li>画像・本文に R-18 作品タイトルを入れる</li>
      <li>露骨すぎるサムネをそのまま使う</li>
      <li>画像に # ハッシュタグ</li>
    </ul>

    <h3>投稿順（再確認）</h3>
    <p>加工PNG → ③@（任意）→ ①本文 → ②リプライ</p>

    <h3>完了報告</h3>
    <pre class="engage-template">【CircleMap X 投稿完了】
日付: YYYY/MM/DD
タイプ: 人気TOP3 など
投稿URL: https://x.com/circlemap_jp/status/…
画像: 3枚コラージュ / ★そのまま / 画像なし
@: あり / なし</pre>
  </div>
</details>`;
}
