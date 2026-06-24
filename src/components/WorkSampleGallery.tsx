"use client";

import { useMemo, useState } from "react";

type Props = {
  title: string;
  thumbnailUrl?: string;
  sampleImages?: string[];
  mediaType: string;
};

export function WorkSampleGallery({
  title,
  thumbnailUrl,
  sampleImages,
  mediaType,
}: Props) {
  const images = useMemo(() => {
    const samples = sampleImages ?? [];
    if (samples.length > 0) {
      return samples;
    }
    return thumbnailUrl ? [thumbnailUrl] : [];
  }, [sampleImages, thumbnailUrl]);

  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className={`work-detail-thumb ${mediaType}`}>
        <span className="media-badge lg">サンプルなし</span>
      </div>
    );
  }

  const safeActive = Math.min(active, images.length - 1);

  return (
    <div className="work-sample-gallery">
      <div className={`work-detail-thumb work-sample-main ${mediaType}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[safeActive]}
          alt={`${title} サンプル ${safeActive + 1}`}
          className="work-detail-image"
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
                className={`work-sample-thumb${index === safeActive ? " active" : ""}`}
                onClick={() => setActive(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
              </button>
            ))}
          </div>
          <p className="work-sample-note">
            クリックでサンプル画像を切り替えられます（FANZA登録分）
          </p>
        </>
      ) : null}
    </div>
  );
}
