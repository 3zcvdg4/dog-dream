import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const SEER_DEFAULT_TITLE_LINES = ['SEER', '500'];

function getScrollerOffset(element, scroller) {
  const elementRect = element.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  return elementRect.top - scrollerRect.top + scroller.scrollTop;
}

function waitForImages(container) {
  const images = Array.from(container.querySelectorAll('img'));
  if (!images.length) {
    return Promise.resolve();
  }

  return Promise.all(images.map((img) => {
    if (img.complete) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }));
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getVideoSeekThreshold(progress) {
  return progress > 0.5 ? 0.05 : 0.022;
}

function createVideoScrubber(videoRef, durationRef, readyRef) {
  let pendingTime = null;
  let seeking = false;
  let seekFallbackTimer = 0;

  const flushSeek = () => {
    const video = videoRef.current;
    if (!video || pendingTime == null) {
      seeking = false;
      return;
    }

    const targetTime = pendingTime;
    pendingTime = null;
    seeking = true;
    let seekComplete = false;

    const finishSeek = () => {
      if (seekComplete) {
        return;
      }
      seekComplete = true;
      window.clearTimeout(seekFallbackTimer);
      video.removeEventListener('seeked', finishSeek);
      seeking = false;
      if (pendingTime != null) {
        flushSeek();
      }
    };

    video.addEventListener('seeked', finishSeek);
    seekFallbackTimer = window.setTimeout(finishSeek, 140);

    try {
      if (typeof video.fastSeek === 'function') {
        video.fastSeek(targetTime);
      } else {
        video.currentTime = targetTime;
      }
    } catch {
      finishSeek();
    }

    if (!video.paused) {
      video.pause();
    }
  };

  return (progress) => {
    const video = videoRef.current;
    if (!video || !readyRef.current || durationRef.current <= 0) {
      return;
    }

    const targetTime = progress * durationRef.current;
    const threshold = getVideoSeekThreshold(progress);

    if (Math.abs(video.currentTime - targetTime) < threshold && pendingTime == null) {
      return;
    }

    pendingTime = targetTime;
    if (!seeking) {
      flushSeek();
    }
  };
}

const REVEAL_CONTACT = 0.72;

function getSeerHeroScrollRatio(root) {
  const raw = getComputedStyle(root ?? document.documentElement)
    .getPropertyValue('--seer-hero-scene-height')
    .trim();
  const sceneVh = Number.parseFloat(raw) || 360;
  return Math.max(sceneVh / 100 - 1, 1);
}

function getScrollTransforms(revealProgress) {
  const contactProgress = 1 - REVEAL_CONTACT;

  if (revealProgress <= contactProgress) {
    return {
      heroLift: 0,
      revealPercent: (1 - revealProgress) * 100,
    };
  }

  const coupledT = (revealProgress - contactProgress) / (1 - contactProgress);
  const heroLift = coupledT * REVEAL_CONTACT;

  return {
    heroLift,
    revealPercent: (REVEAL_CONTACT - heroLift) * 100,
  };
}

function SeerTypewriter({ lines, speed = 68 }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const safeLines = lines?.length ? lines : SEER_DEFAULT_TITLE_LINES;
  const label = safeLines.join(' ');

  useEffect(() => {
    let cancelled = false;

    const waitForFonts = async () => {
      if (document.fonts?.load) {
        await Promise.all([
          document.fonts.load('900 1em Inter'),
          document.fonts.ready,
        ]).catch(() => undefined);
      } else if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      if (!cancelled) {
        setFontsReady(true);
      }
    };

    waitForFonts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fontsReady) {
      return undefined;
    }

    setLineIndex(0);
    setCharIndex(0);
    setDone(false);
  }, [fontsReady, safeLines]);

  useEffect(() => {
    if (!fontsReady || done) {
      return undefined;
    }

    const currentLine = safeLines[lineIndex] ?? '';
    const timer = window.setTimeout(() => {
      if (charIndex < currentLine.length) {
        setCharIndex((value) => value + 1);
        return;
      }

      if (lineIndex < safeLines.length - 1) {
        setLineIndex((value) => value + 1);
        setCharIndex(0);
        return;
      }

      setDone(true);
    }, speed);

    return () => window.clearTimeout(timer);
  }, [charIndex, done, fontsReady, lineIndex, safeLines, speed]);

  return (
    <h1 className="seer-hero__title" aria-label={label}>
      <span className="seer-hero__title-ghost" aria-hidden="true">
        {safeLines.map((line) => (
          <span key={`ghost-${line}`} className="seer-hero__title-line">{line}</span>
        ))}
      </span>

      <span className="seer-hero__title-live" aria-hidden="true">
        {safeLines.map((line, index) => {
          const visibleChars = !fontsReady
            ? ''
            : index < lineIndex
              ? line
              : index === lineIndex
                ? line.slice(0, charIndex)
                : '';

          return (
            <span key={`live-${line}`} className="seer-hero__title-line">
              {visibleChars}
              {fontsReady && !done && index === lineIndex ? (
                <span className="seer-hero__cursor">|</span>
              ) : null}
            </span>
          );
        })}
      </span>
    </h1>
  );
}

function SeerSectionInner({ children, className = '' }) {
  return (
    <div className={`seer-section-inner${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

function SeerImageSlot({ item, className = '' }) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !item?.src || failed;
  const aspect = item?.aspect ?? 'landscape';

  return (
    <figure className={`seer-slot seer-slot--${aspect}${className ? ` ${className}` : ''}`}>
      <div className="seer-slot__frame">
        {!showPlaceholder ? (
          <img
            src={item.src}
            alt={item.alt ?? item.caption ?? '图片'}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="seer-slot__placeholder">
            <span className="seer-slot__label">{item.alt ?? '图片占位'}</span>
            {item.caption ? <small>{item.caption}</small> : null}
          </div>
        )}
      </div>
      {item.caption ? <figcaption className="seer-slot__caption">{item.caption}</figcaption> : null}
    </figure>
  );
}

function SeerStoryHeader({ label, lead, detail }) {
  if (!label && !lead && !detail) {
    return null;
  }

  return (
    <header className="seer-story-head">
      {label ? <p className="seer-story-head__label">{label}</p> : null}
      {lead ? (
        <p className="seer-story-head__lead">
          {lead.split('\n').map((line) => (
            <span key={line} className="seer-story-head__lead-line">{line}</span>
          ))}
        </p>
      ) : null}
      {detail ? <p className="seer-story-head__detail">{detail}</p> : null}
    </header>
  );
}

function SeerSectionHeader({ label, title, intro, number, kicker }) {
  return (
    <header className="seer-block-head">
      {number && kicker ? (
        <div className="seer-block-head__rail">
          <span className="seer-block-head__number">{number}</span>
          <span className="seer-block-head__kicker">{kicker}</span>
        </div>
      ) : null}
      {!number && label ? <p className="seer-block-head__label">{label}</p> : null}
      <h2 className="seer-block-head__title">{title}</h2>
      {intro ? <p className="seer-block-head__intro">{intro}</p> : null}
    </header>
  );
}

function SeerParagraphs({ paragraphs, className = 'seer-block-copy' }) {
  if (!paragraphs?.length) {
    return null;
  }

  return (
    <div className={className}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function SeerOverviewRevealPanel({ overview }) {
  return (
    <section className="seer-overview-panel" id="seer-overview">
      <div className="seer-overview-panel__inner">
        {overview.role ? (
          <div className="seer-overview-panel__meta">
            <div className="seer-overview-panel__meta-item">
              <span className="seer-overview-panel__meta-label">角色</span>
              <p className="seer-overview-panel__meta-value">{overview.role}</p>
            </div>
          </div>
        ) : null}

        {overview.scopeTags?.length ? (
          <div className="seer-overview-panel__tags">
            {overview.scopeTags.map((tag) => (
              <span key={tag} className="seer-overview-panel__tag">{tag}</span>
            ))}
          </div>
        ) : null}

        <div className="seer-overview-panel__story">
          <p className="seer-overview-panel__label">{overview.label}</p>

          <div className="seer-overview-panel__copy">
            {overview.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                className={index === 0
                  ? 'seer-overview-panel__lead'
                  : 'seer-overview-panel__detail'}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {overview.visual ? (
            <div className="seer-overview-panel__image">
              <SeerImageSlot item={overview.visual} />
            </div>
          ) : (
            <div className="seer-overview-panel__image seer-overview-panel__image--placeholder">
              <span>项目展示图（后续替换）</span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

function SeerStickyTabsSection({ section }) {
  const [activeId, setActiveId] = useState(section.platformTabs?.[0]?.id ?? '');
  const pillsRef = useRef(null);
  const screenRef = useRef(null);
  const dragStateRef = useRef({ active: false, startY: 0, startScrollTop: 0 });
  const [indicator, setIndicator] = useState({ width: 0, x: 0 });
  const [canScroll, setCanScroll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const toneClass = section.theme === 'light' ? 'seer-block--light' : 'seer-block--dark';

  const syncScreenScrollable = useCallback(() => {
    const screen = screenRef.current;
    if (!screen) {
      setCanScroll(false);
      return;
    }

    setCanScroll(screen.scrollHeight > screen.clientHeight + 8);
  }, []);

  const handleTabSelect = useCallback((tabId) => {
    setActiveId(tabId);
    if (screenRef.current) {
      screenRef.current.scrollTop = 0;
    }
    window.requestAnimationFrame(syncScreenScrollable);
  }, [syncScreenScrollable]);

  const handleScreenMouseDown = useCallback((event) => {
    if (event.button !== 0 || !canScroll) {
      return;
    }

    const screen = screenRef.current;
    if (!screen) {
      return;
    }

    event.preventDefault();
    dragStateRef.current = {
      active: true,
      startY: event.clientY,
      startScrollTop: screen.scrollTop,
    };
    setIsDragging(true);
  }, [canScroll]);

  const syncIndicator = useCallback(() => {
    const pills = pillsRef.current;
    if (!pills) {
      return;
    }

    const activeButton = pills.querySelector(`[data-tab-id="${activeId}"]`);
    if (!activeButton) {
      return;
    }

    setIndicator({
      width: activeButton.offsetWidth,
      x: activeButton.offsetLeft,
    });
  }, [activeId]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [syncIndicator, section.platformTabs]);

  useEffect(() => {
    window.addEventListener('resize', syncIndicator);
    return () => window.removeEventListener('resize', syncIndicator);
  }, [syncIndicator]);

  useEffect(() => {
    syncScreenScrollable();
    window.addEventListener('resize', syncScreenScrollable);

    return () => window.removeEventListener('resize', syncScreenScrollable);
  }, [activeId, syncScreenScrollable]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!dragStateRef.current.active) {
        return;
      }

      const screen = screenRef.current;
      if (!screen) {
        return;
      }

      const deltaY = event.clientY - dragStateRef.current.startY;
      screen.scrollTop = dragStateRef.current.startScrollTop - deltaY;
    };

    const endDrag = () => {
      if (!dragStateRef.current.active) {
        return;
      }

      dragStateRef.current.active = false;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', endDrag);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', endDrag);
    };
  }, []);

  return (
    <section
      id={section.id}
      className={`seer-block ${toneClass} seer-block--sticky-tabs`}
    >
      <SeerSectionInner>
        <SeerStoryHeader
          label={section.label}
          lead={section.lead}
          detail={section.detail}
        />

        {section.heroVisual?.src && section.platformTabs?.length ? (
          <div className="seer-sticky-tabs__stage">
            <div className="seer-sticky-tabs__device-wrap">
              <div className="seer-sticky-tabs__device">
                <img
                  className="seer-sticky-tabs__frame"
                  src={section.heroVisual.src}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                />

                <div
                  ref={screenRef}
                  className={[
                    'seer-sticky-tabs__screen',
                    canScroll ? 'is-scrollable' : '',
                    isDragging ? 'is-dragging' : '',
                  ].filter(Boolean).join(' ')}
                  role="tabpanel"
                  onMouseDown={handleScreenMouseDown}
                >
                  {section.platformTabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={`seer-sticky-tabs__panel${tab.id === activeId ? ' is-active' : ''}`}
                      aria-hidden={tab.id !== activeId}
                    >
                      <img
                        src={tab.image}
                        alt={tab.alt ?? tab.label}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onLoad={syncScreenScrollable}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="seer-sticky-tabs__scroll-hint" aria-hidden="true">
                <span className="seer-sticky-tabs__scroll-hint-icon seer-sticky-tabs__scroll-hint-icon--up">
                  <span />
                  <span />
                </span>
                <span className="seer-sticky-tabs__scroll-hint-label">滑动浏览</span>
                <span className="seer-sticky-tabs__scroll-hint-icon seer-sticky-tabs__scroll-hint-icon--down">
                  <span />
                  <span />
                </span>
              </div>
            </div>

            <div
              ref={pillsRef}
              className="seer-sticky-tabs__pills"
              role="tablist"
              aria-label={section.navLabel ?? '渠道视觉'}
            >
              <span
                className="seer-sticky-tabs__pill-indicator"
                aria-hidden="true"
                style={{
                  width: `${indicator.width}px`,
                  transform: `translateX(${indicator.x}px)`,
                }}
              />
              {section.platformTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  data-tab-id={tab.id}
                  aria-selected={tab.id === activeId}
                  className={tab.id === activeId ? 'is-active' : ''}
                  onClick={() => handleTabSelect(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </SeerSectionInner>
    </section>
  );
}

function readHorizontalPinMetric(sectionEl, name, fallback) {
  const value = Number.parseFloat(getComputedStyle(sectionEl).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function getHorizontalPinScrollDistance(track, stage, endPadding) {
  const viewportWidth = stage?.clientWidth ?? 0;
  if (!track || viewportWidth <= 0) {
    return 0;
  }

  const posters = track.querySelectorAll('.seer-horizontal-pin__poster');
  const lastPoster = posters[posters.length - 1];
  const widthBasedDistance = Math.max(track.scrollWidth - viewportWidth, 0);

  if (!lastPoster) {
    return widthBasedDistance;
  }

  const lastRight = lastPoster.offsetLeft + lastPoster.offsetWidth;
  const revealDistance = Math.max(lastRight + endPadding - viewportWidth, 0);

  return Math.max(widthBasedDistance, revealDistance);
}

function SeerHorizontalPinSection({ section }) {
  const sceneRef = useRef(null);
  const trackRef = useRef(null);
  const sectionRef = useRef(null);
  const metricsRef = useRef({ scrollDistance: 0, totalDistance: 0 });
  const toneClass = section.theme === 'light' ? 'seer-horizontal-pin--light' : 'seer-horizontal-pin--dark';

  const syncMetrics = useCallback(() => {
    const scene = sceneRef.current;
    const track = trackRef.current;
    const sectionEl = sectionRef.current;
    const page = scene?.closest('.project-page--project-04-seer');
    const stage = scene?.querySelector('.seer-horizontal-pin__stage');
    if (!scene || !track || !page || !sectionEl) {
      return;
    }

    const endPadding = readHorizontalPinMetric(sectionEl, '--seer-horizontal-pin-end-padding', 96);
    const dwellDistance = readHorizontalPinMetric(sectionEl, '--seer-horizontal-pin-dwell', 160);
    const scrollDistance = getHorizontalPinScrollDistance(track, stage, endPadding);
    const totalDistance = scrollDistance + dwellDistance;

    metricsRef.current.scrollDistance = scrollDistance;
    metricsRef.current.totalDistance = totalDistance;
    scene.style.height = `${page.clientHeight + totalDistance}px`;
  }, []);

  const updateScene = useCallback(() => {
    const scene = sceneRef.current;
    const track = trackRef.current;
    const page = scene?.closest('.project-page--project-04-seer');
    const { scrollDistance } = metricsRef.current;

    if (!scene || !track || !page) {
      return;
    }

    if (scrollDistance <= 0) {
      track.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    const sceneStart = getScrollerOffset(scene, page);
    const scrolled = Math.max(page.scrollTop - sceneStart, 0);
    const horizontalOffset = Math.min(scrolled, scrollDistance);
    track.style.transform = `translate3d(${-horizontalOffset}px, 0, 0)`;
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const page = scene?.closest('.project-page--project-04-seer');
    if (!scene || !page) {
      return undefined;
    }

    let rafId = 0;

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateScene);
    };

    const setup = async () => {
      if (trackRef.current) {
        await waitForImages(trackRef.current);
      }
      syncMetrics();
      updateScene();
    };

    setup();

    const handleResize = () => {
      syncMetrics();
      scheduleUpdate();
    };

    page.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      page.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', handleResize);
    };
  }, [section.id, section.visuals, syncMetrics, updateScene]);

  return (
    <section
      ref={sectionRef}
      id={section.id}
      className={`seer-horizontal-pin ${toneClass}`}
    >
      <div ref={sceneRef} className="seer-horizontal-pin__scene">
        <div className="seer-horizontal-pin__stage">
          <div ref={trackRef} className="seer-horizontal-pin__track">
            <div className="seer-horizontal-pin__intro">
              <SeerStoryHeader
                label={section.label}
                lead={section.lead}
                detail={section.detail}
              />
            </div>

            {section.visuals?.map((item) => (
              <figure key={item.id ?? item.alt} className="seer-horizontal-pin__poster">
                {item.src ? (
                  <img
                    src={item.src}
                    alt={item.alt ?? ''}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onLoad={() => {
                      syncMetrics();
                      updateScene();
                    }}
                  />
                ) : (
                  <div className="seer-horizontal-pin__poster-placeholder">
                    <span>{item.alt ?? '图片占位'}</span>
                  </div>
                )}
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SeerPackagingSection({ section }) {
  const items = section.packagingItems ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const activeItem = items[activeIndex] ?? items[0];

  useEffect(() => {
    setImageFailed(false);
  }, [activeIndex, activeItem?.image]);

  if (!activeItem) {
    return null;
  }

  const goPrev = () => {
    setActiveIndex((index) => (index - 1 + items.length) % items.length);
  };

  const goNext = () => {
    setActiveIndex((index) => (index + 1) % items.length);
  };

  return (
    <section
      id={section.id}
      className="seer-packaging seer-packaging--light"
    >
      <div className="seer-packaging__inner">
        <SeerStoryHeader
          label={section.label}
          lead={section.lead}
          detail={section.detail}
        />

        <div className="seer-packaging__card">
          <div className="seer-packaging__main">
            <div className="seer-packaging__left">
              <div className="seer-packaging__preview">
                {activeItem.image && !imageFailed ? (
                  <img
                    key={activeItem.id}
                    src={activeItem.image}
                    alt={activeItem.alt ?? activeItem.title ?? ''}
                    className="seer-packaging__preview-image"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="seer-packaging__preview-placeholder">
                    <span className="seer-packaging__preview-title">
                      {activeItem.previewTitle ?? activeItem.title}
                    </span>
                    <small className="seer-packaging__preview-hint">
                      {activeItem.previewHint ?? '这里放包装盒效果图'}
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div className="seer-packaging__right">
              <p className="seer-story-head__label">{section.label ?? 'Packaging'}</p>
              <h3 className="seer-packaging__item-title">{activeItem.title}</h3>
              <p className="seer-packaging__item-type">{activeItem.type}</p>

              {activeItem.info?.length ? (
                <dl className="seer-packaging__info">
                  {activeItem.info.map((entry) => (
                    <div key={entry.label}>
                      <dt>{entry.label}</dt>
                      <dd>{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <div className="seer-packaging__space" aria-hidden="true" />
            </div>
          </div>

          <div className="seer-packaging__bottom">
            <div className="seer-packaging__tabs" role="tablist" aria-label="包装物料">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  className={`seer-packaging__tab${index === activeIndex ? ' is-active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                >
                  {item.tab}
                </button>
              ))}
            </div>

            <div className="seer-packaging__buttons">
              <button type="button" className="seer-packaging__button" onClick={goPrev}>
                ← 上一项
              </button>
              <button type="button" className="seer-packaging__button" onClick={goNext}>
                下一项 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SeerGallerySection({ section }) {
  const toneClass = section.theme === 'light' ? 'seer-block--light' : 'seer-block--dark';
  const layoutClass = section.layout ? ` seer-block--${section.layout}` : '';

  return (
    <section
      id={section.id}
      className={`seer-block ${toneClass}${layoutClass}`}
    >
      <SeerSectionInner>
        {section.lead ? (
          <SeerStoryHeader
            label={section.label}
            lead={section.lead}
            detail={section.detail}
          />
        ) : (
          <>
            <SeerSectionHeader
              title={section.title}
              intro={section.intro}
              number={section.number}
              kicker={section.kicker}
            />
            <SeerParagraphs paragraphs={section.paragraphs} />
          </>
        )}
        {section.note ? <p className="seer-block-note">{section.note}</p> : null}

        <div className={`seer-block__gallery seer-block__gallery--${section.layout ?? 'grid'}`}>
          {section.visuals.map((item) => (
            <SeerImageSlot key={item.id ?? item.alt} item={item} />
          ))}
        </div>
      </SeerSectionInner>
    </section>
  );
}

function SeerProcessSection({ stories }) {
  const story = stories.entries[0];

  return (
    <section className="seer-block seer-block--dark seer-block--process" id="seer-stories">
      <SeerSectionInner>
        <SeerSectionHeader label={stories.label} title={stories.title} intro={stories.intro} />

        {stories.topics?.length ? (
          <ul className="seer-process-topics">
            {stories.topics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        ) : null}

        {story ? (
          <article className="seer-process-card">
            <div className="seer-process-card__copy">
              <h3>{story.title}</h3>
              <p>{story.summary}</p>
              <dl className="seer-process-card__meta">
                {story.items.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {story.visuals?.length ? (
              <div className="seer-process-card__visuals">
                {story.visuals.map((item) => (
                  <SeerImageSlot key={item.id ?? item.alt} item={item} />
                ))}
              </div>
            ) : null}
          </article>
        ) : null}
      </SeerSectionInner>
    </section>
  );
}

function SeerClosingSection({ closing, onBackToCorridor }) {
  return (
    <section className="seer-closing" id="seer-closing">
      <div className="seer-closing__glow" aria-hidden="true" />

      {closing.chapterNumber ? (
        <div className="seer-closing__chapter" aria-hidden="true">{closing.chapterNumber}</div>
      ) : null}

      <div className="seer-closing__center">
        <div className="seer-closing__panel">
          {closing.label ? <p className="seer-closing__label">{closing.label}</p> : null}

          {closing.brand ? <p className="seer-closing__brand">{closing.brand}</p> : null}

          {closing.title ? (
            <h2 className="seer-closing__title">{closing.title}</h2>
          ) : null}

          {closing.descriptionLines?.length ? (
            <p className="seer-closing__desc">
              {closing.descriptionLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index < closing.descriptionLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          ) : null}

          {closing.systemItems?.length ? (
            <div className="seer-closing__system" aria-label="项目系统范围">
              {closing.systemItems.map((item) => (
                <span key={item} className="seer-closing__item">{item}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {onBackToCorridor ? (
        <button
          className="seer-closing__back"
          type="button"
          onClick={onBackToCorridor}
        >
          <span className="seer-closing__back-arrow" aria-hidden="true">←</span>
          <span className="seer-closing__back-label">{closing.backLabel ?? '回到走廊'}</span>
        </button>
      ) : null}

      {closing.sideText ? (
        <div className="seer-closing__footer">
          <p className="seer-closing__side">{closing.sideText}</p>
        </div>
      ) : null}
    </section>
  );
}

function SeerSectionNav({ items }) {
  return (
    <nav className="seer-section-nav" aria-label="章节导航">
      <ol className="seer-section-nav__list">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SeerHeroScrollScene({ hero, overview, children }) {
  const sceneRef = useRef(null);
  const videoRef = useRef(null);
  const revealRef = useRef(null);
  const revealContentRef = useRef(null);
  const heroRef = useRef(null);
  const rafRef = useRef(0);
  const durationRef = useRef(0);
  const videoReadyRef = useRef(false);
  const scrubVideoRef = useRef(null);
  const metricsRef = useRef({
    videoRevealScroll: 1,
    overviewOverflow: 0,
    viewportHeight: 1,
  });
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    scrubVideoRef.current = createVideoScrubber(videoRef, durationRef, videoReadyRef);
  }, []);

  const syncSceneMetrics = useCallback(() => {
    const scene = sceneRef.current;
    const revealContent = revealContentRef.current;
    if (!scene) {
      return;
    }

    const scrollRoot = scene.closest('.project-page');
    const viewportHeight = scrollRoot?.clientHeight ?? window.innerHeight;
    const scrollRatio = getSeerHeroScrollRatio(scene.closest('.project-page--project-04-seer'));
    const videoRevealScroll = viewportHeight * scrollRatio;
    const overviewPanel = revealContent?.querySelector('.seer-overview-panel');
    const contentHeight = revealContent?.scrollHeight ?? overviewPanel?.scrollHeight ?? 0;
    const overviewOverflow = Math.max(0, contentHeight - viewportHeight);

    metricsRef.current = {
      videoRevealScroll,
      overviewOverflow,
      viewportHeight,
    };

    scene.style.height = `${viewportHeight + videoRevealScroll + overviewOverflow}px`;
  }, []);

  const updateScene = useCallback(() => {
    const scene = sceneRef.current;
    const reveal = revealRef.current;
    const revealContent = revealContentRef.current;
    const heroEl = heroRef.current;
    if (!scene) {
      return;
    }

    const scrollRoot = scene.closest('.project-page');
    const { videoRevealScroll, overviewOverflow } = metricsRef.current;
    const scrollable = Math.max(videoRevealScroll + overviewOverflow, 1);
    const scrolled = clamp(
      scrollRoot
        ? scrollRoot.scrollTop - scene.offsetTop
        : window.scrollY - scene.offsetTop,
      0,
      scrollable,
    );
    const phaseProgress = clamp(scrolled / Math.max(videoRevealScroll, 1));

    scrubVideoRef.current?.(phaseProgress);

    const revealProgress = phaseProgress <= 0.5 ? 0 : (phaseProgress - 0.5) / 0.5;
    const { heroLift, revealPercent } = getScrollTransforms(revealProgress);

    if (heroEl) {
      heroEl.style.transform = heroLift > 0
        ? `translate3d(0, ${-heroLift * 100}%, 0)`
        : '';
      heroEl.classList.toggle('is-lifting', heroLift > 0 && heroLift < REVEAL_CONTACT * 0.995);
    }

    if (reveal) {
      reveal.style.transform = `translate3d(0, ${revealPercent}%, 0)`;
      reveal.classList.toggle('is-revealing', revealProgress > 0 && revealProgress < 0.995);
      reveal.classList.toggle('is-settled', phaseProgress >= 0.995 || scrolled > videoRevealScroll);
    }

    if (revealContent) {
      if (scrolled > videoRevealScroll && overviewOverflow > 0) {
        const overviewT = clamp((scrolled - videoRevealScroll) / overviewOverflow);
        revealContent.style.transform = `translate3d(0, ${-overviewT * overviewOverflow}px, 0)`;
        revealContent.classList.toggle('is-scrolling', overviewT > 0 && overviewT < 0.995);
      } else {
        revealContent.style.transform = '';
        revealContent.classList.remove('is-scrolling');
      }
    }
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const revealContent = revealContentRef.current;
    if (!scene) {
      return undefined;
    }

    syncSceneMetrics();
    updateScene();

    const scrollRoot = scene.closest('.project-page') ?? window;
    const onScroll = () => {
      if (rafRef.current) {
        return;
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        updateScene();
      });
    };

    const onResize = () => {
      syncSceneMetrics();
      onScroll();
    };

    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    let resizeObserver;
    if (revealContent && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(revealContent);
    }

    return () => {
      scrollRoot.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      resizeObserver?.disconnect();
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [syncSceneMetrics, updateScene]);

  useEffect(() => {
    if (overview) {
      syncSceneMetrics();
      updateScene();
    }
  }, [overview, syncSceneMetrics, updateScene]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hero.video) {
      return undefined;
    }

    durationRef.current = 0;
    videoReadyRef.current = false;
    setVideoReady(false);

    const markReady = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      durationRef.current = video.duration;
      videoReadyRef.current = true;
      setVideoReady(true);
      updateScene();
    };

    const primeVideo = async () => {
      video.muted = true;
      video.playsInline = true;
      video.pause();

      try {
        await video.play();
        video.pause();
        video.currentTime = 0;
      } catch {
        // Scrubbing can still work once metadata is available.
      }

      markReady();
    };

    video.addEventListener('loadedmetadata', markReady);
    video.addEventListener('loadeddata', markReady);
    video.addEventListener('durationchange', markReady);
    video.addEventListener('canplay', markReady);

    if (video.readyState >= 1) {
      markReady();
      primeVideo();
    } else {
      video.addEventListener('loadeddata', () => {
        primeVideo();
      }, { once: true });
    }

    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', markReady);
      video.removeEventListener('loadeddata', markReady);
      video.removeEventListener('durationchange', markReady);
      video.removeEventListener('canplay', markReady);
    };
  }, [hero.video, updateScene]);

  useEffect(() => {
    if (videoReady) {
      updateScene();
    }
  }, [videoReady, updateScene]);

  return (
    <>
      <div ref={sceneRef} className="seer-hero-scene">
        <div className="seer-hero-scene__sticky">
          <section ref={heroRef} className="seer-hero" id="top" aria-label="SEER 500 主视觉">
            <div className="seer-hero__copy">
              <SeerTypewriter lines={hero.typedTitleLines ?? SEER_DEFAULT_TITLE_LINES} />
              {hero.subtitle ? (
                <p className="seer-hero__subtitle">{hero.subtitle}</p>
              ) : null}
              {hero.description ? (
                <p className="seer-hero__description">{hero.description}</p>
              ) : null}
            </div>

            {hero.video ? (
              <div className="seer-hero__visual">
                <video
                  ref={videoRef}
                  key={hero.video}
                  className="seer-hero__video"
                  src={hero.video}
                  poster={hero.videoPoster}
                  muted
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  aria-label="SEER 500 主视觉动画"
                />
              </div>
            ) : null}
          </section>

          <div ref={revealRef} className="seer-hero__reveal">
            <div className="seer-hero__reveal-curtain" aria-hidden="true" />
            {overview ? (
              <div ref={revealContentRef} className="seer-hero__reveal-content">
                <SeerOverviewRevealPanel overview={overview} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {children}
    </>
  );
}

export default function ProjectSeerCaseStudy({ content, onBackToCorridor }) {
  const navItems = useMemo(() => (
    [
      { id: 'top', label: 'Hero' },
      { id: 'seer-overview', label: content.overview?.navLabel ?? content.overview?.label ?? '项目概述' },
      ...(content.streams ?? []).map((stream) => ({
        id: stream.id,
        label: stream.navLabel ?? stream.kicker,
      })),
      ...(content.stories ? [{ id: 'seer-stories', label: content.stories?.navLabel ?? content.stories?.label ?? '关键判断' }] : []),
      { id: 'seer-closing', label: content.closing?.navLabel ?? content.closing?.label ?? '结束' },
    ]
  ), [content]);

  if (!content?.hero) {
    return (
      <main className="project-page page-shell project-page--project-04-seer">
        <p className="seer-fallback">Seer 500 页面内容加载失败。</p>
      </main>
    );
  }

  return (
    <main className="project-page page-shell project-page--project-04-seer">
      <SeerSectionNav items={navItems} />

      <SeerHeroScrollScene hero={content.hero} overview={content.overview}>
        <div className="seer-body">
          {content.streams?.map((section) => (
            section.layout === 'sticky-tabs' ? (
              <SeerStickyTabsSection key={section.id} section={section} />
            ) : section.layout === 'horizontal-pin' ? (
              <SeerHorizontalPinSection key={section.id} section={section} />
            ) : section.layout === 'packaging' ? (
              <SeerPackagingSection key={section.id} section={section} />
            ) : (
              <SeerGallerySection key={section.id} section={section} />
            )
          ))}

          {content.stories ? (
            <SeerProcessSection stories={content.stories} />
          ) : null}

          {content.closing ? (
            <SeerClosingSection closing={content.closing} onBackToCorridor={onBackToCorridor} />
          ) : null}
        </div>
      </SeerHeroScrollScene>
    </main>
  );
}
