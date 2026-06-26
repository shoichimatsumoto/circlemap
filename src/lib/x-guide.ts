/** X 運用メモ（x-draft ページ用） */
export function getXGuideHtml(): string {
  return `
<details class="guide" open>
  <summary>X 運用のコツ（CircleMap）</summary>
  <div class="guide-body">
    <p><strong>基本方針：</strong>自分の投稿を続ける ＋ <strong>紹介したサークル公式</strong>にだけ絡む。</p>

    <h3>投稿の流れ（月・水・土）</h3>
    <ol>
      <li>下の <strong>★ サムネ</strong> を保存して X に添付（問題なければ）</li>
      <li><strong>① 本文</strong> を投稿（URL なし）</li>
      <li>自分の投稿に <strong>② リプライ用リンク</strong> を返信</li>
      <li><strong>誰に絡む？</strong> でサークル公式を検索 → フォロー or いいね</li>
    </ol>
    <p class="note">サムネは問題なさそうなものだけ。全部アウトなら <strong>① 本文のみ</strong>。</p>

    <h3>絡み方の方針</h3>
    <ul>
      <li><strong>◎ サークル公式</strong> — 投稿で紹介したサークルを X で検索して絡む</li>
      <li><strong>△ 同人まとめ・FANZA 公式</strong> — フォロー不要（詳しくなくて OK）</li>
      <li><strong>× シャドウバン警告あり</strong> — スキップ</li>
    </ul>

    <h3>あまりおすすめしないやり方</h3>
    <ul class="bad">
      <li>同人界隈アカウントを mass フォロー</li>
      <li>フォローした人にすぐ DM</li>
      <li>本文に URL を詰め込む</li>
      <li>シャドウバン警告のあるアカウントに絡む</li>
    </ul>

    <h3>まとめ</h3>
    <table>
      <tr><td>◎</td><td>月・水・土の投稿を続ける</td></tr>
      <tr><td>◎</td><td>紹介サークルの公式にいいね・引用</td></tr>
      <tr><td>◎</td><td>リンクはリプライに載せる</td></tr>
      <tr><td>△</td><td>同人まとめアカウントをフォロー</td></tr>
    </table>
    <p class="note">公式アカウント: <a href="https://x.com/circlemap_jp" target="_blank" rel="noopener">@circlemap_jp</a></p>
  </div>
</details>`;
}
