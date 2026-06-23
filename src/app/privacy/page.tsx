import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function PrivacyPage() {
  return (
    <PageShell>
      <main className="container page-main">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>プライバシーポリシー</span>
        </nav>

        <article className="static-page">
          <h1>プライバシーポリシー</h1>
          <p className="static-lead">
            CircleMap（以下「当サイト」）は、利用者のプライバシーを尊重し、個人情報の保護に努めます。
          </p>

          <section>
            <h2>1. 収集する情報</h2>
            <p>当サイトでは、以下の情報を取得する場合があります。</p>
            <ul>
              <li>アクセスログ（IPアドレス、ブラウザ種別、アクセス日時など）</li>
              <li>Cookieおよびアクセス解析ツールによる利用状況</li>
            </ul>
          </section>

          <section>
            <h2>2. 利用目的</h2>
            <ul>
              <li>サイトの運営・改善</li>
              <li>不正アクセスの防止</li>
              <li>アクセス状況の分析</li>
            </ul>
          </section>

          <section>
            <h2>3. 第三者への提供</h2>
            <p>
              当サイトはDMMアフィリエイトプログラムに参加しており、FANZAへのリンクを通じて商品情報を表示します。
              購入時の個人情報はFANZA（DMM）のプライバシーポリシーに従って処理されます。
            </p>
          </section>

          <section>
            <h2>4. Cookieについて</h2>
            <p>
              当サイトおよびアフィリエイトリンクでは、Cookieが使用される場合があります。
              ブラウザの設定によりCookieを無効にすることができます。
            </p>
          </section>

          <section>
            <h2>5. お問い合わせ</h2>
            <p>
              本ポリシーに関するお問い合わせは、
              <Link href="/about">運営者情報</Link>
              の連絡先よりご連絡ください。
            </p>
          </section>

          <p className="static-updated">最終更新日：2026年6月23日</p>
        </article>
      </main>
    </PageShell>
  );
}
