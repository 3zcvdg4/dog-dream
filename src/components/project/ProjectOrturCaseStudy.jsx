import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GradientText from '../ui/GradientText';
import GradientFill from '../ui/GradientFill';
import SoftAurora from '../ui/SoftAurora';
import { ORTUR_GRADIENT } from './orturGradientConfig';
import { ORTUR_SOFT_AURORA } from './orturSoftAuroraConfig';

gsap.registerPlugin(ScrollTrigger);

function OrturGradientText({ children, className = '' }) {
  return (
    <GradientText className={className} {...ORTUR_GRADIENT} showBorder={false}>
      {children}
    </GradientText>
  );
}

function OrturGradientLine({ className = '' }) {
  return <GradientFill className={className} {...ORTUR_GRADIENT} />;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;
const smoothstep = (amount) => amount * amount * (3 - 2 * amount);

const SWIPE_DISTANCE = 48;
const SWIPE_AXIS_RATIO = 1.25;
const SWIPE_IGNORE_SELECTOR = 'video, button, a, input, textarea, select, label';

function shouldIgnoreSwipeTarget(target) {
  return target instanceof Element && Boolean(target.closest(SWIPE_IGNORE_SELECTOR));
}

function isHorizontalSwipe(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  if (Math.abs(dx) < SWIPE_DISTANCE) return false;
  return Math.abs(dx) > Math.abs(dy) * SWIPE_AXIS_RATIO;
}

function useSwipeNavigation({ onPrev, onNext, enabled = true }) {
  const gestureRef = useRef(null);

  const handlePointerDown = (event) => {
    if (!enabled || shouldIgnoreSwipeTarget(event.target)) return;
    gestureRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handlePointerUp = (event) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    gestureRef.current = null;

    if (!isHorizontalSwipe(gesture.startX, gesture.startY, event.clientX, event.clientY)) return;

    if (event.clientX < gesture.startX) {
      onNext?.();
    } else {
      onPrev?.();
    }
  };

  const handlePointerCancel = (event) => {
    if (gestureRef.current?.id === event.pointerId) {
      gestureRef.current = null;
    }
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };
}

const orturPreloadedUrls = new Set();

function preloadOrturMediaItems(items, { highPriorityCount = 0 } = {}) {
  items.forEach((item, index) => {
    const url = item.webp || item.src;
    if (!url || orturPreloadedUrls.has(url)) return;

    orturPreloadedUrls.add(url);

    if (index === 0 && item.webp && typeof document !== 'undefined') {
      const selector = `link[data-ortur-preload="${item.webp}"]`;
      if (!document.querySelector(selector)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = item.webp;
        link.type = 'image/webp';
        link.dataset.orturPreload = item.webp;
        document.head.appendChild(link);
      }
    }

    const img = new Image();
    if (index < highPriorityCount) {
      img.fetchPriority = 'high';
    }
    img.decoding = 'async';
    img.src = url;
  });
}

function OrturOptimizedImage({ item, eager = false, onError }) {
  if (!item?.src) return null;

  return (
    <picture>
      {item.webp ? <source srcSet={item.webp} type="image/webp" /> : null}
      <img
        src={item.src}
        alt={item.alt ?? item.id}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        onError={onError}
      />
    </picture>
  );
}

function OrturLabel({ children, className = '', centered = false }) {
  return (
    <div className={`ortur-label${centered ? ' ortur-label--center' : ''} ${className}`.trim()}>
      <OrturGradientLine className="ortur-label__line" />
      {children}
      {centered ? <OrturGradientLine className="ortur-label__line" /> : null}
    </div>
  );
}

function OrturSectionHead({ label, title, intro, introSingleLine = false }) {
  return (
    <div className="ortur-section-head">
      {label ? (
        <OrturLabel centered>
          <OrturGradientText className="ortur-label__text">{label}</OrturGradientText>
        </OrturLabel>
      ) : null}
      <h2 className="ortur-section-title">{title}</h2>
      {intro ? (
        <p className={`ortur-section-intro${introSingleLine ? ' ortur-section-intro--single' : ''}`}>
          {intro}
        </p>
      ) : null}
    </div>
  );
}

const IMPACT_ICON_GRADIENT_ID = 'ortur-impact-icon-gradient';

function ImpactIconDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id={IMPACT_ICON_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#800b0b" />
          <stop offset="45%" stopColor="#bf2323" />
          <stop offset="100%" stopColor="#4a2bd1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const IMPACT_ICONS = {
  channels: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="13" r="5" stroke={`url(#${IMPACT_ICON_GRADIENT_ID})`} strokeWidth="2" />
      <circle cx="11" cy="35" r="5" stroke={`url(#${IMPACT_ICON_GRADIENT_ID})`} strokeWidth="2" />
      <circle cx="37" cy="35" r="5" stroke={`url(#${IMPACT_ICON_GRADIENT_ID})`} strokeWidth="2" />
      <path
        d="M24 18v6M19.5 27.5 14.5 31M28.5 27.5 33.5 31"
        stroke={`url(#${IMPACT_ICON_GRADIENT_ID})`}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  efficiency: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="10"
        y="10"
        width="28"
        height="28"
        rx="6"
        stroke={`url(#${IMPACT_ICON_GRADIENT_ID})`}
        strokeWidth="2"
      />
      <path
        d="M27 14 19 25h6l-5 9"
        stroke={`url(#${IMPACT_ICON_GRADIENT_ID})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  scale: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 34h28M14 26h20M18 18h12"
        stroke={`url(#${IMPACT_ICON_GRADIENT_ID})`}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 14 36 18 30 22"
        stroke={`url(#${IMPACT_ICON_GRADIENT_ID})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function OrturImpactCard({ title, text, iconId }) {
  return (
    <article className="ortur-impact-card">
      <OrturGradientLine className="ortur-impact-card__border" />
      <div className="ortur-impact-card__body">
        <div className="ortur-impact-card__icon" aria-hidden="true">
          {IMPACT_ICONS[iconId] ?? IMPACT_ICONS.scale}
        </div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </article>
  );
}

function MetricCard({ count, suffix, label, scroller }) {
  const metricRef = useRef(null);

  useEffect(() => {
    const el = metricRef.current;
    if (!el || !scroller) return undefined;

    const numberNode = el.querySelector('[data-metric-value]');
    if (!numberNode) return undefined;

    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: count,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        scroller,
        trigger: el,
        start: 'top 85%',
        once: true,
      },
      onUpdate: () => {
        numberNode.textContent = String(Math.floor(obj.val));
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [count, scroller]);

  return (
    <div className="ortur-card ortur-metric-card" ref={metricRef}>
      <div className="ortur-metric">
        <span data-metric-value>0</span>
        {suffix ? (
          <OrturGradientText className="ortur-metric__suffix">{suffix}</OrturGradientText>
        ) : null}
      </div>
      <p>{label}</p>
    </div>
  );
}

function OrturMediaFrame({ item, layout = 'split', showCaption = true }) {
  const [failed, setFailed] = useState(false);
  const isVideo = item.mediaType === 'video';
  const showPlaceholder = !item.src || failed;

  return (
    <figure className={`ortur-figure ortur-figure--${item.layout ?? layout} ortur-reveal-img`}>
      <div className="ortur-media-frame">
        {item.src && !failed ? (
          isVideo ? (
            <video
              src={item.src}
              controls
              playsInline
              preload="metadata"
              onError={() => setFailed(true)}
            />
          ) : (
            <img
              src={item.src}
              alt={item.alt ?? item.id}
              onError={() => setFailed(true)}
            />
          )
        ) : null}
        {showPlaceholder ? (
          <div className="ortur-media-placeholder">
            <span>{item.alt ?? item.id}</span>
            {item.fileName ? <small>{item.fileName}</small> : null}
          </div>
        ) : null}
      </div>
      {showCaption && item.caption ? <figcaption>{item.caption}</figcaption> : null}
    </figure>
  );
}

function ProductShowcaseCard({ item, eager = false }) {
  const body = item.captionBody ?? item.caption ?? '';
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !item.src || failed;

  return (
    <article className="ortur-product-card" data-product-card>
      <figure className="ortur-figure ortur-figure--product">
        <div className="ortur-media-frame">
          {!failed && item.src ? (
            <OrturOptimizedImage
              item={item}
              eager={eager}
              onError={() => setFailed(true)}
            />
          ) : null}
          {showPlaceholder ? (
            <div className="ortur-media-placeholder">
              <span>{item.alt ?? item.id}</span>
              {item.fileName ? <small>{item.fileName}</small> : null}
            </div>
          ) : null}
        </div>
      </figure>
      {item.captionLead || body ? (
        <div className="ortur-product-card__caption">
          <p>
            {item.captionLead ? <strong>{item.captionLead}</strong> : null}
            {body}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function ProductShowcase({ items }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [metrics, setMetrics] = useState({ initialOffset: 0, step: 0, maxIndex: 0 });

  useEffect(() => {
    preloadOrturMediaItems(items);
  }, [items]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return undefined;

    const recalc = () => {
      const firstCard = track.querySelector('[data-product-card]');
      if (!firstCard) {
        setMetrics({ step: 0, maxTranslate: 0, maxIndex: 0 });
        setPageIndex(0);
        return;
      }

      const trackStyles = window.getComputedStyle(track);
      const carouselStyles = window.getComputedStyle(viewport);
      const gap = Number.parseFloat(trackStyles.gap || trackStyles.columnGap || '0') || 0;
      const cardWidth = firstCard.getBoundingClientRect().width;
      const peek = Number.parseFloat(carouselStyles.getPropertyValue('--ortur-product-peek').trim()) || 0;
      const isMobile = window.innerWidth <= 900;
      const cardsInView = isMobile ? 1 : 2;
      const initialWindowWidth =
        cardWidth * cardsInView + gap * (cardsInView + (isMobile ? 0 : 1)) + peek;
      const initialOffset = isMobile
        ? 0
        : Math.max((viewport.clientWidth - initialWindowWidth) / 2, 0);
      const step = cardWidth + gap;
      const maxShift = Math.max(track.scrollWidth + initialOffset - viewport.clientWidth, 0);
      const maxIndex = step > 0 ? Math.ceil(maxShift / step) : 0;

      setMetrics({ initialOffset, step, maxIndex });
      setPageIndex((prev) => Math.min(prev, maxIndex));
    };

    recalc();
    window.addEventListener('resize', recalc);

    const ro = new ResizeObserver(recalc);
    ro.observe(viewport);
    ro.observe(track);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recalc);
    };
  }, [items]);

  const translateX = metrics.initialOffset - pageIndex * metrics.step + dragOffset;
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < metrics.maxIndex;

  const handlePointerDown = (event) => {
    if (metrics.maxIndex <= 0 || shouldIgnoreSwipeTarget(event.target)) return;
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      locked: false,
    };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx) * SWIPE_AXIS_RATIO) {
        dragRef.current = null;
        setIsDragging(false);
        setDragOffset(0);
        return;
      }
      drag.locked = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    let offset = dx;
    if ((pageIndex === 0 && offset > 0) || (pageIndex >= metrics.maxIndex && offset < 0)) {
      offset *= 0.35;
    }
    setDragOffset(offset);
  };

  const finishDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (!drag.locked) {
      setDragOffset(0);
      return;
    }

    const dx = event.clientX - drag.startX;
    const threshold = Math.min(72, Math.max(metrics.step * 0.18, 36));

    if (dx <= -threshold && canNext) {
      setPageIndex((prev) => Math.min(prev + 1, metrics.maxIndex));
    } else if (dx >= threshold && canPrev) {
      setPageIndex((prev) => Math.max(prev - 1, 0));
    }

    setDragOffset(0);
  };

  return (
    <div className="ortur-product-carousel">
      <div
        className="ortur-product-viewport ortur-swipe-surface"
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div
          className={`ortur-product-track${isDragging ? ' is-dragging' : ''}`}
          ref={trackRef}
          style={{ transform: `translate3d(${translateX}px, 0, 0)` }}
        >
          {items.map((item, index) => (
            <ProductShowcaseCard
              item={item}
              eager={index === 0}
              key={item.id ?? item.alt}
            />
          ))}
        </div>
      </div>
      {metrics.maxIndex > 0 ? (
        <div className="ortur-product-controls">
          <button
            className="ortur-product-control"
            type="button"
            onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
            disabled={!canPrev}
            aria-label="查看上一张产品图"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            className="ortur-product-control"
            type="button"
            onClick={() => setPageIndex((prev) => Math.min(prev + 1, metrics.maxIndex))}
            disabled={!canNext}
            aria-label="查看下一张产品图"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FeatureCarousel({ items, layout = 'feature', intervalMs = 4500, preloadImmediately = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState({});
  const timerRef = useRef(null);
  const count = items.length;

  useEffect(() => {
    preloadOrturMediaItems(items, { highPriorityCount: preloadImmediately ? 2 : 1 });
  }, [items, preloadImmediately]);

  const goTo = (index) => {
    if (count <= 0) return;
    setActiveIndex(((index % count) + count) % count);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (count <= 1) return;
    timerRef.current = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, intervalMs);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [count, intervalMs]);

  const activeItem = items[activeIndex] ?? items[0];
  const swipeHandlers = useSwipeNavigation({
    enabled: count > 1,
    onPrev: () => {
      goTo(activeIndex - 1);
      resetTimer();
    },
    onNext: () => {
      goTo(activeIndex + 1);
      resetTimer();
    },
  });

  return (
    <figure
      className={`ortur-figure ortur-figure--${layout} ortur-feature-carousel`}
      onMouseEnter={() => {
        if (timerRef.current) window.clearInterval(timerRef.current);
      }}
      onMouseLeave={resetTimer}
    >
      <div className="ortur-feature-carousel__stage">
        <div className="ortur-feature-carousel__viewport ortur-swipe-surface" {...swipeHandlers}>
          {items.map((item, index) => {
            const showPlaceholder = !item.src || failed[item.id];
            const isActive = index === activeIndex;

            return (
              <div
                key={item.id ?? item.alt ?? index}
                className={`ortur-feature-carousel__slide${isActive ? ' is-active' : ''}`}
                aria-hidden={!isActive}
              >
                <div className="ortur-media-frame">
                  {!failed[item.id] && item.src ? (
                    <OrturOptimizedImage
                      item={item}
                      eager={index === 0 || (preloadImmediately && index === 1)}
                      onError={() => setFailed((prev) => ({ ...prev, [item.id]: true }))}
                    />
                  ) : null}
                  {showPlaceholder ? (
                    <div className="ortur-media-placeholder">
                      <span>{item.alt ?? item.id}</span>
                      {item.fileName ? <small>{item.fileName}</small> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {count > 1 ? (
          <div className="ortur-feature-carousel__nav">
            <button
              className="ortur-feature-carousel__btn"
              type="button"
              onClick={() => {
                goTo(activeIndex - 1);
                resetTimer();
              }}
              aria-label="上一张"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <div className="ortur-feature-carousel__dots" role="tablist" aria-label="品牌视觉轮播">
              {items.map((item, index) => (
                <button
                  key={item.id ?? index}
                  className={`ortur-feature-carousel__dot${index === activeIndex ? ' is-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`第 ${index + 1} 张`}
                  onClick={() => {
                    goTo(index);
                    resetTimer();
                  }}
                />
              ))}
            </div>
            <button
              className="ortur-feature-carousel__btn"
              type="button"
              onClick={() => {
                goTo(activeIndex + 1);
                resetTimer();
              }}
              aria-label="下一张"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        ) : null}
      </div>
      {activeItem?.caption ? <figcaption>{activeItem.caption}</figcaption> : null}
    </figure>
  );
}

function VideoMediaCarousel({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState({});
  const videoRefs = useRef([]);
  const count = items.length;

  useEffect(() => {
    preloadOrturMediaItems(items.filter((item) => item.mediaType !== 'video'));
  }, [items]);

  const goTo = (index) => {
    if (count <= 0) return;
    setActiveIndex(((index % count) + count) % count);
  };

  useEffect(() => {
    videoRefs.current.forEach((node, index) => {
      if (!node) return;
      if (index !== activeIndex) {
        node.pause();
        return;
      }
      if (items[index]?.mediaType === 'video') {
        node.play().catch(() => {});
      }
    });
  }, [activeIndex, items]);

  const activeItem = items[activeIndex] ?? items[0];
  const swipeHandlers = useSwipeNavigation({
    enabled: count > 1,
    onPrev: () => goTo(activeIndex - 1),
    onNext: () => goTo(activeIndex + 1),
  });

  return (
    <figure className="ortur-figure ortur-video-carousel ortur-reveal-img">
      <div className="ortur-video-carousel__stage">
        {count > 1 ? (
          <button
            className="ortur-video-carousel__arrow ortur-video-carousel__arrow--prev"
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="上一项"
          >
            <span aria-hidden="true">‹</span>
          </button>
        ) : null}

        <div className="ortur-video-carousel__viewport ortur-swipe-surface" {...swipeHandlers}>
          {items.map((item, index) => {
            const isVideo = item.mediaType === 'video';
            const isActive = index === activeIndex;
            const shouldLoadVideo = isActive && isVideo;
            const showPlaceholder = !item.src || failed[item.id] || (isVideo && !shouldLoadVideo);

            return (
              <div
                key={item.id ?? item.alt ?? index}
                className={`ortur-video-carousel__slide${isActive ? ' is-active' : ''}`}
                aria-hidden={!isActive}
              >
                <div className="ortur-media-frame">
                  {shouldLoadVideo ? (
                    <video
                      ref={(node) => {
                        videoRefs.current[index] = node;
                      }}
                      src={item.src}
                      controls
                      playsInline
                      preload="metadata"
                      onError={() => setFailed((prev) => ({ ...prev, [item.id]: true }))}
                    />
                  ) : null}
                  {!isVideo && !failed[item.id] && item.src ? (
                    <OrturOptimizedImage
                      item={item}
                      eager={index === 0}
                      onError={() => setFailed((prev) => ({ ...prev, [item.id]: true }))}
                    />
                  ) : null}
                  {showPlaceholder ? (
                    <div className="ortur-media-placeholder">
                      <span>{item.alt ?? item.id}</span>
                      {item.fileName ? <small>{item.fileName}</small> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {count > 1 ? (
          <button
            className="ortur-video-carousel__arrow ortur-video-carousel__arrow--next"
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="下一项"
          >
            <span aria-hidden="true">›</span>
          </button>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="ortur-video-carousel__dots" role="tablist" aria-label="视频内容轮播">
          {items.map((item, index) => (
            <button
              key={item.id ?? index}
              className={`ortur-video-carousel__dot${index === activeIndex ? ' is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`第 ${index + 1} 项`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
      {activeItem?.caption ? <figcaption>{activeItem.caption}</figcaption> : null}
    </figure>
  );
}

function WheelCollage({ items, scroller, tailSyncCount = 0, tailEndSectionId, tailEndAt = 'top 72%', scrollStart = 'top 92%' }) {
  const figureRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const sizeRef = useRef({ width: 1, height: 1 });
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const dragRef = useRef(null);
  const [failed, setFailed] = useState({});

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const cards = cardRefs.current.slice(0, items.length).filter(Boolean);
    if (!cards.length) return undefined;

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      sizeRef.current = {
        width: rect.width || 1,
        height: rect.height || 1,
      };
    };

    const render = () => {
      const { width, height } = sizeRef.current;
      const isMobileLayout = window.innerWidth <= 900;

      if (isMobileLayout) {
        items.forEach((item, index) => {
          const el = cardRefs.current[index];
          if (!el) return;
          gsap.set(el, {
            autoAlpha: 1,
            clearProps: 'transform',
          });
        });
        return;
      }

      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.08;
      const progress = clamp(currentProgressRef.current, 0, 1);

      items.forEach((item, index) => {
        const el = cardRefs.current[index];
        if (!el) return;
        if (item.motion === 'mwg-collection') {
          const spacing = item.spacing ?? 0.24;
          const startX = item.startX ?? 1.38;
          const focusX = item.focusX ?? 0;
          const endX = item.endX ?? -1.4;
          const startY = item.startY ?? item.laneY ?? 0;
          const focusY = item.peakY ?? item.focusY ?? item.laneY ?? 0;
          const endY = item.endY ?? item.laneY ?? 0;
          const shrinkStartX = item.shrinkStartX ?? focusX;
          const startScale = item.startScale ?? 0.55;
          const focusScale = item.peakScale ?? item.focusScale ?? 1;
          const endScale = item.endScale ?? 0.55;
          const maxScale = item.maxScale ?? 1;
          const travel = startX - endX + (items.length - 1) * spacing;
          const xNorm = startX + (item.trackIndex ?? index) * spacing - progress * travel;
          const isVisible = xNorm > endX - 0.1 && xNorm < startX + 0.1;

          if (!isVisible) {
            gsap.set(el, { autoAlpha: 0 });
            return;
          }

          const zIndex = item.layer ?? index + 1;
          const laneDrift = Math.sin((progress * 8 + index) * Math.PI) * (item.float ?? 0.012);
          const x = xNorm * width;
          let baseScale = focusScale;
          let baseY = focusY;

          if (xNorm >= focusX) {
            const growProgress = clamp((xNorm - focusX) / Math.max(startX - focusX, 0.0001), 0, 1);
            baseScale = lerp(focusScale, startScale, growProgress);
            baseY = lerp(focusY, startY, growProgress);
          } else if (xNorm >= shrinkStartX) {
            baseScale = focusScale;
            baseY = focusY;
          } else {
            const shrinkProgress = clamp((shrinkStartX - xNorm) / Math.max(shrinkStartX - endX, 0.0001), 0, 1);
            baseScale = lerp(focusScale, endScale, shrinkProgress);
            baseY = lerp(focusY, endY, shrinkProgress);
          }
          const y = (baseY + laneDrift) * height;
          const scale = Math.min(baseScale * (item.scale ?? 1), maxScale);
          const rotation = 0;
          const rotationY = 0;

          gsap.set(el, {
            autoAlpha: 1,
            xPercent: -50,
            yPercent: -50,
            x,
            y,
            rotation,
            rotationY,
            scale,
            opacity: 1,
            zIndex,
            force3D: true,
          });
          return;
        }

        const timingStart = item.timing?.start ?? 0;
        const timingEnd = item.timing?.end ?? 1;
        const peakThreshold = item.timing?.peak ?? 0.38;
        const holdThreshold = item.timing?.hold ?? 0.72;
        const isVisible = progress >= timingStart && progress <= timingEnd;

        if (!isVisible) {
          gsap.set(el, { autoAlpha: 0 });
          return;
        }

        const cardProgress = (progress - timingStart) / Math.max(timingEnd - timingStart, 0.0001);
        const startState = {
          x: item.from.x ?? 0,
          y: item.from.y ?? 0,
          rotate: item.from.rotate ?? 0,
          scale: item.from.scale ?? 1,
          opacity: item.from.opacity ?? 1,
          z: item.from.z ?? -1200 - (item.layer ?? index) * 55,
        };
        const midState = {
          x: item.to.x ?? 0,
          y: item.to.y ?? 0,
          rotate: item.to.rotate ?? 0,
          scale: item.to.scale ?? 1,
          opacity: item.to.opacity ?? 1,
          z: item.to.z ?? 0,
        };
        const holdState = {
          x: item.hold?.x ?? (item.to.x ?? 0) - 0.16,
          y: item.hold?.y ?? item.to.y ?? 0,
          rotate: item.hold?.rotate ?? item.to.rotate ?? 0,
          scale: item.hold?.scale ?? item.to.scale ?? 1,
          opacity: item.hold?.opacity ?? 1,
          z: item.hold?.z ?? 0,
        };
        const endState = {
          x: item.end?.x ?? item.to.x ?? 0,
          y: item.end?.y ?? item.to.y ?? 0,
          rotate: item.end?.rotate ?? item.to.rotate ?? 0,
          scale: item.end?.scale ?? item.to.scale ?? 1,
          opacity: item.end?.opacity ?? 1,
          z: item.end?.z ?? item.endZ ?? 900 + (item.layer ?? index) * 45,
        };

        let localRaw = 0;
        let fromState = startState;
        let toState = midState;

        if (cardProgress <= peakThreshold) {
          localRaw = cardProgress / Math.max(peakThreshold, 0.0001);
          fromState = startState;
          toState = midState;
        } else if (cardProgress <= holdThreshold) {
          localRaw = (cardProgress - peakThreshold) / Math.max(holdThreshold - peakThreshold, 0.0001);
          fromState = midState;
          toState = holdState;
        } else {
          localRaw = (cardProgress - holdThreshold) / Math.max(1 - holdThreshold, 0.0001);
          fromState = holdState;
          toState = endState;
        }

        const isHoldPhase = cardProgress > peakThreshold && cardProgress <= holdThreshold;
        const positionLocal = isHoldPhase
          ? clamp(localRaw, 0, 1)
          : smoothstep(clamp(localRaw, 0, 1));
        const scaleLocal = clamp(localRaw, 0, 1);

        const xNorm = lerp(fromState.x, toState.x, positionLocal);
        const x = xNorm * width;
        const y = lerp(fromState.y, toState.y, positionLocal) * height;
        const rotation = item.noRotate ? 0 : lerp(fromState.rotate, toState.rotate, positionLocal);
        const baseScale = lerp(fromState.scale, toState.scale, scaleLocal);
        const scale = baseScale;
        const opacity = lerp(fromState.opacity, toState.opacity, positionLocal);
        const centerProximity = 1 - Math.min(Math.abs(xNorm) / 0.42, 1);
        const zIndex = Math.round(centerProximity * 60) + (item.layer ?? index % 5);

        gsap.set(el, {
          autoAlpha: 1,
          xPercent: -50,
          yPercent: -50,
          x,
          y,
          rotation,
          scale,
          opacity,
          zIndex,
          force3D: true,
        });
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    gsap.ticker.add(render);

    return () => {
      ro.disconnect();
      gsap.ticker.remove(render);
    };
  }, [items]);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return undefined;

    if (window.innerWidth <= 900 || !scroller) {
      targetProgressRef.current = 0.5;
      currentProgressRef.current = 0.5;
      return undefined;
    }

    targetProgressRef.current = 0;
    currentProgressRef.current = 0;

    const stageTop = 76;
    const getStageHeight = () => Math.max(window.innerHeight - stageTop, 1);
    const tailCount = Math.max(0, Math.min(tailSyncCount, items.length - 1));
    const tailEndEl = tailEndSectionId ? document.getElementById(tailEndSectionId) : null;
    const useTailSync = tailCount > 0 && tailEndEl;
    const syncStart = useTailSync ? (items.length - tailCount) / items.length : 1;

    const getStickyReleaseScroll = () => {
      const scrollTop = scroller.scrollTop;
      const scrollerRect = scroller.getBoundingClientRect();
      const figureRect = figure.getBoundingClientRect();
      const figureTop = figureRect.top - scrollerRect.top + scrollTop;
      return figureTop + figure.offsetHeight - getStageHeight();
    };

    const mapScrollToProgress = (self) => {
      if (!useTailSync) return self.progress;

      const releaseScroll = getStickyReleaseScroll();
      const total = Math.max(self.end - self.start, 1);
      const releaseProgress = clamp((releaseScroll - self.start) / total, 0.08, 0.92);
      const scrollP = self.progress;

      if (scrollP <= releaseProgress) {
        return (scrollP / releaseProgress) * syncStart;
      }

      const tailScroll = (scrollP - releaseProgress) / Math.max(1 - releaseProgress, 0.0001);
      return syncStart + tailScroll * (1 - syncStart);
    };

    const trigger = ScrollTrigger.create({
      scroller,
      trigger: figure,
      start: scrollStart,
      ...(useTailSync
        ? {
            endTrigger: tailEndEl,
            end: tailEndAt,
          }
        : {
            end: 'bottom bottom',
          }),
      scrub: 0.65,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        targetProgressRef.current = clamp(mapScrollToProgress(self), 0, 1);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [items, scroller, tailSyncCount, tailEndSectionId, tailEndAt, scrollStart]);

  const handlePointerDown = (event) => {
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      progress: targetProgressRef.current,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dragDistance = (drag.startX - event.clientX) / Math.max(window.innerWidth, 1);
    targetProgressRef.current = clamp(drag.progress + dragDistance * 0.9, 0, 1);
  };

  const handlePointerUp = (event) => {
    if (dragRef.current?.id === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  return (
    <figure className="ortur-wheel-collage" ref={figureRef}>
      <div
        className="ortur-wheel-collage__stage"
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {items.map((item, index) => {
          const showPlaceholder = !item.src || failed[item.id];

          return (
            <div
              className={`ortur-wheel-collage__card ortur-wheel-collage__card--${item.variant ?? 'portrait'}`}
              key={item.id ?? item.alt ?? index}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
            >
              <div className="ortur-wheel-collage__frame">
                {item.src && !failed[item.id] ? (
                  <img
                    src={item.src}
                    alt={item.alt ?? item.id}
                    style={{
                      ...(item.objectPosition ? { objectPosition: item.objectPosition } : {}),
                      ...(item.objectFit ? { objectFit: item.objectFit } : {}),
                    }}
                    onError={() => setFailed((prev) => ({ ...prev, [item.id]: true }))}
                  />
                ) : null}
                {showPlaceholder ? (
                  <div className="ortur-media-placeholder">
                    <span>{item.alt ?? item.id}</span>
                    {item.fileName ? <small>{item.fileName}</small> : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

function VisualBlock({ visual, scroller }) {
  if (visual.type === 'media') {
    return <OrturMediaFrame item={visual.media} layout={visual.layout ?? 'feature'} />;
  }

  if (visual.type === 'carousel') {
    return (
      <FeatureCarousel
        items={visual.items}
        layout={visual.layout ?? 'feature'}
        intervalMs={visual.intervalMs ?? 4500}
        preloadImmediately={Boolean(visual.preloadImmediately)}
      />
    );
  }

  if (visual.type === 'video-carousel') {
    return <VideoMediaCarousel items={visual.items} />;
  }

  if (visual.type === 'grid') {
    const colClass = visual.columns === 3 ? 'ortur-col-4' : 'ortur-col-6';
    return (
      <div className="ortur-grid">
        {visual.items.map((item) => (
          <div className={colClass} key={item.id ?? item.alt}>
            <OrturMediaFrame item={item} layout={item.layout ?? 'split'} />
          </div>
        ))}
      </div>
    );
  }

  if (visual.type === 'wheel-collage') {
    return (
      <WheelCollage
        items={visual.items}
        scroller={scroller}
        tailSyncCount={visual.tailSyncCount}
        tailEndSectionId={visual.tailEndSectionId}
        tailEndAt={visual.tailEndAt}
        scrollStart={visual.scrollStart}
      />
    );
  }

  return null;
}

export function preloadProjectOrturPriorityAssets(content) {
  if (!content?.preloadPriorityAssets?.length) return;
  preloadOrturMediaItems(content.preloadPriorityAssets, { highPriorityCount: 2 });
}

export default function ProjectOrturCaseStudy({ project, content, onBackToCorridor, onWakeUp }) {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const [scroller, setScroller] = useState(null);

  useEffect(() => {
    preloadProjectOrturPriorityAssets(content);
  }, [content]);

  useEffect(() => {
    const page = pageRef.current;
    const hero = heroRef.current;

    if (!page) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.defaults({ scroller: page });

      if (hero) {
        gsap.fromTo(
          hero.querySelectorAll('.ortur-animate-in'),
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.1,
            clearProps: 'transform',
          },
        );
      }

      gsap.utils.toArray(page.querySelectorAll('.ortur-section:not(.ortur-hero):not(.ortur-wheel-section)')).forEach((sec) => {
        gsap.fromTo(
          sec.querySelectorAll(':scope > *'),
          { autoAlpha: 0, y: 48 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.08,
            ease: 'power2.out',
            clearProps: 'transform',
            scrollTrigger: {
              trigger: sec,
              start: 'top 82%',
              once: true,
            },
          },
        );
      });

      gsap.utils.toArray(page.querySelectorAll('.ortur-reveal-img')).forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0.6, scale: 0.96 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              once: true,
            },
          },
        );
      });
    }, page);

    const refresh = () => ScrollTrigger.refresh();
    const rafId = window.requestAnimationFrame(refresh);

    return () => {
      window.cancelAnimationFrame(rafId);
      ctx.revert();
      ScrollTrigger.defaults({ scroller: window });
    };
  }, [scroller]);

  if (!content?.hero) {
    return (
      <main className="project-page page-shell project-page--project-02-ortur">
        <p className="ortur-fallback">ORTUR 页面内容加载失败。</p>
      </main>
    );
  }

  const { hero, metrics, blocks, impact } = content;

  return (
    <main
      className="project-page page-shell project-page--project-02-ortur"
      ref={(node) => {
        pageRef.current = node;
        if (node && scroller !== node) {
          setScroller(node);
        }
      }}
    >
      <div className="ortur-grid-bg" aria-hidden="true" />

      <section className="ortur-section ortur-hero" ref={heroRef}>
        <div className="ortur-hero-aurora">
          <SoftAurora {...ORTUR_SOFT_AURORA} />
        </div>
        <div className="ortur-hero-copy">
          <OrturLabel className="ortur-animate-in">{hero.label}</OrturLabel>
          <h1 className="ortur-animate-in">
            {hero.titleBefore}
            <br />
            <OrturGradientText className="ortur-hero-gradient-text">{hero.titleAccent}</OrturGradientText>
          </h1>
          <p className="ortur-animate-in">{hero.description}</p>
          <div className="ortur-hero-scroll ortur-animate-in">
            SCROLL
            <OrturGradientLine className="ortur-hero-scroll__line" />
          </div>
        </div>
      </section>

      <section className="ortur-section">
        <OrturSectionHead label="OVERVIEW" title="交付积累" />
        <div className="ortur-grid ortur-metrics-grid">
          {metrics.map((item) => (
            <div className="ortur-col-3" key={item.label}>
              <MetricCard
                count={item.count}
                suffix={item.suffix}
                label={item.label}
                scroller={scroller}
              />
            </div>
          ))}
        </div>
      </section>

      {blocks.map((block) => (
        <section
          className={`ortur-section${block.visual?.type === 'horizontal' ? ' ortur-product-section' : ''}${block.visual?.type === 'wheel-collage' ? ' ortur-wheel-section' : ''}`}
          key={block.id}
          id={block.id}
        >
          <OrturSectionHead label={block.label} title={block.title} intro={block.intro} introSingleLine />
          <div className="ortur-section-body">
            {block.visual?.type === 'horizontal' ? (
              <ProductShowcase items={block.visual.items} />
            ) : (
              <VisualBlock visual={block.visual} scroller={scroller} />
            )}
          </div>
        </section>
      ))}

      <section className="ortur-section ortur-impact-section">
        <ImpactIconDefs />
        <OrturSectionHead
          label={impact.label}
          title={impact.title}
          intro={impact.text}
          introSingleLine
        />
        {impact.cards?.length ? (
          <div className="ortur-impact-grid">
            {impact.cards.map((card) => (
              <OrturImpactCard
                key={card.id ?? card.title}
                title={card.title}
                text={card.text}
                iconId={card.id}
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
