"use client";

import Link from "next/link";
import { WorkCard } from "@/components/WorkCard";
import type { WorkAnalysis } from "@/lib/work-analysis";
import { formatPrice } from "@/lib/types";

type Props = {
  analysis: WorkAnalysis;
};

export function WorkAnalysisSection({ analysis }: Props) {
  return (
    <section className="work-analysis" aria-labelledby="work-analysis-heading">
      <div className="section-head">
        <h2 id="work-analysis-heading">CircleMap分析</h2>
        <Link href={`/circle?id=${analysis.circleId}`} className="link-more">
          サークルページ →
        </Link>
      </div>

      <p className="work-analysis-lead">
        FANZAの商品説明の言い換えではなく、CircleMapに登録された作品・価格・タグ・発売履歴から算出した情報です。
      </p>

      <dl className="work-analysis-stats">
        <div>
          <dt>サークル総作品数</dt>
          <dd>{analysis.circleWorkCount}作品</dd>
        </div>
        <div>
          <dt>新しさ</dt>
          <dd>
            {analysis.circleWorkCount}作品中{analysis.circleReleaseRank}番目に新しい
          </dd>
        </div>
        {analysis.circlePriceRank != null && (
          <div>
            <dt>サークル内価格順位（安い順）</dt>
            <dd>{analysis.circlePriceRank}位</dd>
          </div>
        )}
        {analysis.circleAveragePrice > 0 && (
          <div>
            <dt>サークル平均価格</dt>
            <dd>{formatPrice(analysis.circleAveragePrice)}</dd>
          </div>
        )}
        {analysis.workPrice > 0 && (
          <div>
            <dt>本作品価格</dt>
            <dd>{formatPrice(analysis.workPrice)}</dd>
          </div>
        )}
        {analysis.priceDiffFromAvg != null && analysis.circleAveragePrice > 0 && (
          <div>
            <dt>平均価格との差</dt>
            <dd>
              {analysis.priceDiffFromAvg === 0
                ? "±0円"
                : `${analysis.priceDiffFromAvg > 0 ? "+" : "−"}${formatPrice(Math.abs(analysis.priceDiffFromAvg))}`}
            </dd>
          </div>
        )}
        {analysis.circleMinPrice > 0 && analysis.circleMaxPrice > 0 && (
          <div>
            <dt>サークル価格帯</dt>
            <dd>
              {formatPrice(analysis.circleMinPrice)}〜
              {formatPrice(analysis.circleMaxPrice)}
            </dd>
          </div>
        )}
      </dl>

      {analysis.topTags.length > 0 && (
        <div className="work-analysis-block">
          <h3>このサークルの傾向</h3>
          <ul className="work-analysis-tags">
            {analysis.topTags.map((t) => (
              <li key={t.tag}>
                <Link href={`/search?q=${encodeURIComponent(t.tag)}`}>
                  #{t.tag}
                </Link>
                <span className="work-analysis-tag-count">{t.count}件</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.paragraphs.length > 0 && (
        <div className="work-analysis-block work-analysis-copy">
          {analysis.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {analysis.circlePopularWorks.length > 0 && (
        <div className="work-analysis-block">
          <div className="section-head">
            <h3>このサークルの人気作品</h3>
            <Link href={`/circle?id=${analysis.circleId}`} className="link-more">
              一覧 →
            </Link>
          </div>
          <div className="yt-grid">
            {analysis.circlePopularWorks.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        </div>
      )}

      {analysis.similarWorks.length > 0 && (
        <div className="work-analysis-block">
          <h3>類似作品（CircleMapスコア）</h3>
          <p className="work-analysis-note">
            共通タグ・同一形式・同一サークル・近い価格帯から算出しています。
          </p>
          <div className="yt-grid">
            {analysis.similarWorks.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
