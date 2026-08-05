"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [orient, setOrient] = useState<"landscape" | "portrait">("portrait");
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setOrient("portrait");
  }, [workId]);

  const goPrev = useCallback(() => {
    setActiveIndex((index) =>
      images.length === 0 ? 0 : (index - 1 + images.length) % images.length
    );
  }, [images.length]);

  const goNext = useCallback(() => {
    setActiveIndex((index) =>
      images.length === 0 ? 0 : (index + 1) % images.length
    );
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, goPrev, goNext]);

  if (images.length === 0) {
    return (
      <div className={`work-detail-thumb ${mediaType}`}>
        <span className="media-badge lg">サンプルなし</span>
      </div>
    );
  }

  const safeActive = Math.min(Math.max(0, activeIndex), images.length - 1);
  const isLandscape = orient === "landscape";
  const canNavigate = images.length > 1;

  function onImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
    if (!w || !h) return;
    setOrient(w >= h ? "landscape" : "portrait");
  }

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current == null || !canNavigate) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX == null) return;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) goPrev();
    else goNext();
  }

  return (
    <div className={`work-sample-gallery ${mediaType}`}>
      <div
        className={`work-detail-thumb work-sample-main ${mediaType}${isLandscape ? " landscape" : ""}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[safeActive]}
          src={images[safeActive]}
          alt={`${title} サンプル ${safeActive + 1}`}
          className="work-detail-image"
          decoding="async"
          fetchPriority="high"
          draggable={false}
          onLoad={onImageLoad}
        />
        <span className="media-badge lg">
          {safeActive + 1} / {images.length}
        </span>

        {canNavigate ? (
          <>
            <button
              type="button"
              className="work-sample-nav prev"
              aria-label="前のサンプル画像"
              onClick={goPrev}
            >
              ‹
            </button>
            <button
              type="button"
              className="work-sample-nav next"
              aria-label="次のサンプル画像"
              onClick={goNext}
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {canNavigate ? (
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
            サンプル画像（スワイプ／矢印／サムネで切替）
          </p>
        </>
      ) : null}
    </div>
  );
}
