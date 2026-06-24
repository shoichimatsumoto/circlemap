"use client";

import { useEffect, useMemo, useState } from "react";
import { buildGalleryImages, thumbDmmImageUrl } from "@/lib/dmm-image";

type Props = {
  workId: string;
  title: string;
  thumbnailUrl?: string;
  sampleImages?: string[];
  mediaType: string;
};

export function WorkSampleGallery({
  workId,
  title,
  thumbnailUrl,
  sampleImages,
  mediaType,
}: Props) {
  const images = useMemo(
    () => buildGalleryImages(thumbnailUrl, sampleImages),
    [thumbnailUrl, sampleImages]
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [workId]);

  if (images.length === 0) {
    return (
      <div className={`work-detail-thumb ${mediaType}`}>
        <span className="media-badge lg">サンプルなし</span>
      </div>
    );
  }

  const safeActive = Math.min(Math.max(0, activeIndex), images.length - 1);
  const isLandscape = mediaType === "game";

  return (
    <div className={`work-sample-gallery ${mediaType}`}>
      <div
        className={`work-detail-thumb work-sample-main ${mediaType}${isLandscape ? " landscape" : ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[safeActive]}
          src={images[safeActive]}
          alt={`${title} サンプル ${safeActive + 1}`}
          className="work-detail-image"
          decoding="async"
          fetchPriority="high"
        />
        <span className="media-badge lg">
          {safeActive + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 ? (
        <>
          <div className="work-sample-thumbs" role="tablist" aria-label="サンプル画像">
            {images.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                role="tab"
                aria-selected={index === safeActive}
                className={`work-sample-thumb${index === safeActive ? " active" : ""}${isLandscape ? " landscape" : ""}`}
                onClick={() => setActiveIndex(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbDmmImageUrl(url)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
          <p className="work-sample-note">
            FANZA提供のサンプル画像です。下のサムネイルで切り替えできます。
          </p>
        </>
      ) : null}
    </div>
  );
}
