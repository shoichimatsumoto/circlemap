import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function AboutPage() {
  return (
    <PageShell>
      <main className="container page-main">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>運営者情報</span>
        </nav>

        <article className="static-page">
          <h1>運営者情報</h1>

          <section>
            <h2>サイト名</h2>
            <p>CircleMap（サークルマップ）</p>
          </section>

          <section>
            <h2>サイトの目的</h2>
            <p>
              FANZA同人作品をサークル（制作サークル）軸で横断的に探せるデータベースを提供します。
              漫画・CG・音声・ゲームをまとめて確認でき、コレクターの購入判断をサポートすることを目的としています。
            </p>
          </section>

          <section>
            <h2>運営者</h2>
            <p>松元 正一</p>
          </section>

          <section>
            <h2>お問い合わせ</h2>
            <p>
              お問い合わせは、DMMアフィリエイト管理画面に登録の連絡先メールアドレス宛にご連絡ください。
            </p>
          </section>

          <section>
            <h2>免責事項</h2>
            <ul>
              <li>当サイトの情報はDMM APIより取得しており、内容の正確性を保証するものではありません。</li>
              <li>商品の購入・決済はFANZA上で行われます。</li>
              <li>当サイトは18歳以上の方を対象としています。</li>
            </ul>
          </section>

          <section>
            <h2>アフィリエイトについて</h2>
            <p>
              当サイトはDMMアフィリエイトプログラムに参加しており、FANZA経由の購入により報酬が発生する場合があります。
            </p>
          </section>
        </article>
      </main>
    </PageShell>
  );
}
