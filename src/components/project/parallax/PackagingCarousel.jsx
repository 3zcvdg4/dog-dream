import { useCallback, useState } from 'react';

import './PackagingCarousel.css';

export default function PackagingCarousel({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback((index) => {
    if (!images?.length) return;
    const next = (index + images.length) % images.length;
    setActiveIndex(next);
  }, [images]);

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  if (!images?.length) return null;

  const active = images[activeIndex];

  return (
    <div className="packaging-carousel">
      <div className="packaging-carousel__stage">
        <button
          type="button"
          className="packaging-carousel__btn packaging-carousel__btn--prev"
          aria-label="上一张"
          onClick={goPrev}
        >
          <span aria-hidden="true">‹</span>
        </button>

        <figure className="packaging-carousel__figure">
          <div className="packaging-carousel__frame">
            <img
              key={active.src}
              src={active.src}
              alt={active.alt}
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption className="packaging-carousel__caption">
            {active.alt}
          </figcaption>
        </figure>

        <button
          type="button"
          className="packaging-carousel__btn packaging-carousel__btn--next"
          aria-label="下一张"
          onClick={goNext}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      {images.length > 1 ? (
        <div className="packaging-carousel__dots" role="tablist" aria-label="包装展示切换">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={image.alt}
              className={`packaging-carousel__dot${index === activeIndex ? ' is-active' : ''}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
