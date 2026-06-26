/** X 運用メモ（x-draft ページ用） */
export function getXGuideHtml(): string {
  return `
<details class="guide" open>
  <summary>X 運用のコツ（CircleMap）</summary>
  <div class="guide-body">
    <p><strong>基本方針：</strong>大量フォローより「見られる・役に立つ」投稿を優先する。</p>

    <h3>投稿の流れ</h3>
    <ol>
      <li>下の <strong>★ サムネ</strong> を保存して X に添付</li>
      <li><strong>① 本文</strong> を投稿（URL なし）</li>
      <li>自分の投稿に <strong>② リプライ用リンク</strong> を返信</li>
      <li>週 2〜3 回を目安に続ける</li>
    </ol>
    <p class="note">サムネは候補の表示です。<strong>問題なさそうな画像だけ</strong> X に添付。全部アウトなら <strong>① 本文のみ</strong>で OK。</p>
    <p class="note">ハッシュタグは必須ではない。付けるなら <code>#CircleMap</code> だけで十分。</p>

    <h3>フォローしていい相手（10〜30件から）</h3>
    <p>具体的な ID リストは下の <strong>「誰に絡む？」</strong> セクションを見てください。</p>

    <h3>あまりおすすめしないやり方</h3>
    <ul class="bad">
      <li>100 件以上を一気にフォロー → スパムっぽく見える</li>
      <li>フォローした人にすぐ DM → 逆効果</li>
      <li>フォロー返し目的だけの大量フォロー → フォロワーの質が下がる</li>
      <li>本文に URL を詰め込む → 表示が伸びにくい</li>
    </ul>

    <h3>フォローより先にやること</h3>
    <ul>
      <li>固定ポストを整える（プロフィール + サイト紹介）</li>
      <li>週 2〜3 回、人気作品・サークル紹介を投稿（このページの下書きを使う）</li>
      <li>他アカウントの投稿にいいね・引用（「このサークルの他作品もまとめてます」程度）</li>
      <li>サークル名・作品名を本文に入れる（タグより固有名詞の方が効く）</li>
    </ul>

    <h3>フォローのペース</h3>
    <p>参考になりそうなアカウントを見つけたら <strong>1 日 2〜3 件</strong> くらい。「この人のタイムラインを見たい」相手だけで十分。</p>

    <h3>まとめ</h3>
    <table>
      <tr><td>◎</td><td>同人・FANZA 系アカウントを少しずつフォロー</td></tr>
      <tr><td>◎</td><td>役立つ投稿を続ける・いいね・引用で存在感を出す</td></tr>
      <tr><td>◎</td><td>リンクはリプライに載せる</td></tr>
      <tr><td>△</td><td>同人好きを広く mass フォロー</td></tr>
      <tr><td>△</td><td>ハッシュタグに頼る</td></tr>
    </table>
    <p><strong>「フォローしに行く」より「役立つ投稿を続ける」方が CircleMap には合っている。</strong></p>
    <p class="note">公式アカウント: <a href="https://x.com/circlemap_jp" target="_blank" rel="noopener">@circlemap_jp</a></p>
  </div>
</details>`;
}
