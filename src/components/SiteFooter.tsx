import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <strong>CircleMap</strong>
          <p>FANZA同人をサークル軸で探すコレクター向けデータベース</p>
        </div>
        <nav className="footer-nav">
          <Link href="/about">運営者情報</Link>
          <Link href="/privacy">プライバシーポリシー</Link>
          <a
            href="https://affiliate.dmm.com/api/"
            target="_blank"
            rel="noopener noreferrer"
          >
            DMMアフィリエイト
          </a>
        </nav>
      </div>
      <div className="container footer-bottom">
        <p className="footer-note">
          18歳未満の方の閲覧はご遠慮ください · 当サイトはDMMアフィリエイトプログラムに参加しています
        </p>
      </div>
    </footer>
  );
}
