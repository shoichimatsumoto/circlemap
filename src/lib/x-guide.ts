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
