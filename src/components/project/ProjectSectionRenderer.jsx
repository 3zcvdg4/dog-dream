import { useCallback, useEffect, useRef, useState } from 'react';

function SectionIntro({ section }) {
  return (
    <div className="project-section project-section--intro">
      {section.paragraphs.map((text) => (
        <p key={text.slice(0, 24)} className="project-section__lead">{text}</p>
      ))}
    </div>
  );
}

function SectionHeading({ section }) {
  const Tag = section.level === 3 ? 'h4' : 'h2';
  return <Tag className="project-section__heading">{section.text}</Tag>;
}

function SectionSubheading({ section }) {
  return <h3 className="project-section__subheading">{section.text}</h3>;
}

function SectionParagraph({ section }) {
  return <p className="project-section__text">{section.text}</p>;
}

function SectionParagraphs({ section }) {
  return (
    <div className="project-section project-section--paragraphs">
      {section.items.map((text) => (
        <p key={text.slice(0, 24)} className="project-section__text">{text}</p>
      ))}
    </div>
  );
}

function SectionSteps({ section }) {
  return (
    <ol className="project-section project-section--steps">
      {section.items.map((item) => (
        <li key={item.text.slice(0, 24)} className="project-step">
          {item.title ? <strong className="project-step__title">{item.title}</strong> : null}
          <span>{item.text}</span>
        </li>
      ))}
    </ol>
  );
}

function SectionQuote({ section }) {
  return (
    <blockquote className="project-section project-section--quote">
      <p>{section.text}</p>
      {section.cite ? <cite>{section.cite}</cite> : null}
    </blockquote>
  );
}

function SectionDivider() {
  return <hr className="project-section project-section--divider" />;
}

function SectionBulletList({ section }) {
  return (
    <ul className="project-section project-section--list">
      {section.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SectionTable({ section }) {
  return (
    <div className="project-section project-section--table-wrap">
      <table className="project-table">
        <thead>
          <tr>
            {section.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row) => (
            <tr key={row.join('-').slice(0, 32)}>
              {row.map((cell) => (
                <td key={cell.slice(0, 16)}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTimeline({ section }) {
  return (
    <div className="project-section project-section--timeline">
      {section.items.map((item) => (
        <article key={`${item.date}-${item.event}`.slice(0, 32)} className="project-timeline-item">
          <div className="project-timeline-item__meta">
            <span className="project-timeline-item__date">{item.date}</span>
            <span className="project-timeline-item__phase">{item.phase}</span>
          </div>
          <p className="project-timeline-item__event">{item.event}</p>
          {item.tool ? <p className="project-timeline-item__tool">{item.tool}</p> : null}
        </article>
      ))}
    </div>
  );
}

function GalleryImage({ image }) {
  return (
    <figure className="project-gallery__item">
      <div className="project-gallery__frame">
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
            const placeholder = event.currentTarget.nextElementSibling;
            if (placeholder) placeholder.hidden = false;
          }}
        />
        <div className="project-gallery__placeholder" hidden>
          <span>{image.alt || '图片占位'}</span>
        </div>
      </div>
      {image.caption ? <figcaption>{image.caption}</figcaption> : null}
    </figure>
  );
}

function StageMediaLightbox({ media, onClose }) {
  const [zoomSize, setZoomSize] = useState(null);

  useEffect(() => {
    if (!media) {
      setZoomSize(null);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [media, onClose]);

  useEffect(() => {
    if (!media) {
      return undefined;
    }

    let cancelled = false;
    const loader = new window.Image();
    loader.src = media.src;
    loader.onload = () => {
      if (cancelled) {
        return;
      }

      const maxWidth = window.innerWidth * 0.96;
      const maxHeight = window.innerHeight * 0.9;
      const minZoomWidth = Math.min(
        loader.naturalWidth,
        Math.max((media.thumbWidth ?? 0) * 1.6, (media.thumbWidth ?? 0) + 280),
      );

      let width = Math.min(loader.naturalWidth, maxWidth);
      width = Math.max(width, Math.min(minZoomWidth, maxWidth));

      let height = (width / loader.naturalWidth) * loader.naturalHeight;
      if (height > maxHeight) {
        height = maxHeight;
        width = (height / loader.naturalHeight) * loader.naturalWidth;
      }

      setZoomSize({ width, height });
    };

    return () => {
      cancelled = true;
    };
  }, [media]);

  if (!media) {
    return null;
  }

  return (
    <div
      className="project-stage-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={media.alt || '放大查看图片'}
      onClick={onClose}
    >
      <button
        type="button"
        className="project-stage-lightbox__close"
        aria-label="关闭"
        onClick={onClose}
      >
        关闭
      </button>
      <img
        className="project-stage-lightbox__image"
        src={media.src}
        alt={media.alt}
        style={zoomSize ? { width: `${zoomSize.width}px`, height: `${zoomSize.height}px` } : undefined}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

function StageDocModal({ doc, onClose }) {
  useEffect(() => {
    if (!doc) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [doc, onClose]);

  if (!doc) {
    return null;
  }

  return (
    <div
      className="project-stage-doc-modal"
      role="dialog"
      aria-modal="true"
      aria-label={doc.label}
      onClick={onClose}
    >
      <div
        className="project-stage-doc-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="project-stage-doc-modal__close"
          aria-label="关闭"
          onClick={onClose}
        >
          关闭
        </button>
        <h4 className="project-stage-doc-modal__title">{doc.label}</h4>
        <p className="project-stage-doc-modal__note">把这份文档提供给 VS Code，按步骤自行配置即可。</p>
        <a
          className="project-stage-doc-modal__download"
          href={doc.file}
          download={doc.downloadName}
        >
          下载文档
        </a>
      </div>
    </div>
  );
}

function renderCaptionSegment(segment, index, onDocOpen) {
  if (segment.type === 'text') {
    return <span key={`text-${index}`}>{segment.value}</span>;
  }

  if (segment.type === 'link') {
    return (
      <a
        key={`link-${index}`}
        href={segment.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {segment.label}
      </a>
    );
  }

  if (segment.type === 'doc') {
    return (
      <button
        key={`doc-${index}`}
        type="button"
        className="project-stage__caption-doc-link"
        onClick={() => onDocOpen(segment)}
      >
        {segment.label}
      </button>
    );
  }

  return null;
}

function StageRichCaption({ blocks }) {
  const [activeDoc, setActiveDoc] = useState(null);

  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <>
      <div className="project-stage__carousel-caption project-stage__carousel-caption--rich">
        {blocks.map((block, blockIndex) => (
          <p key={`caption-block-${blockIndex}`}>
            {block.text
              ? block.text
              : block.segments?.map((segment, segmentIndex) => renderCaptionSegment(segment, segmentIndex, setActiveDoc))}
          </p>
        ))}
      </div>
      <StageDocModal doc={activeDoc} onClose={() => setActiveDoc(null)} />
    </>
  );
}

function isStageVideo(image) {
  if (image.mediaType === 'video') {
    return true;
  }

  return /\.(mov|mp4|webm|ogg)(\?.*)?$/i.test(image.src);
}

function StageImage({ image, variant = 'detail', onExpand, showCaption = true }) {
  const [imageError, setImageError] = useState(false);
  const isVideo = isStageVideo(image);

  return (
    <figure className={`project-stage__figure project-stage__figure--${variant}`}>
      <div className="project-stage__image-frame">
        {isVideo ? (
          <video
            key={image.src}
            src={image.src}
            autoPlay
            loop={image.loop !== false}
            muted
            playsInline
            preload="auto"
            aria-label={image.alt}
          />
        ) : imageError ? (
          <div className="project-stage__image-placeholder">
            <span>{image.alt || '图片占位'}</span>
          </div>
        ) : (
          <button
            type="button"
            className="project-stage__image-trigger"
            aria-label={`放大查看：${image.alt || '图片'}`}
            onClick={(event) => {
              const frame = event.currentTarget.closest('.project-stage__image-frame');
              const thumbWidth = frame?.getBoundingClientRect().width ?? 0;
              onExpand?.({ src: image.src, alt: image.alt, thumbWidth });
            }}
          >
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </button>
        )}
      </div>
      {showCaption && image.caption ? <figcaption>{image.caption}</figcaption> : null}
    </figure>
  );
}

function StageCarouselSlide({ image, isActive, onExpand, onVideoEnded }) {
  const videoRef = useRef(null);
  const [imageError, setImageError] = useState(false);
  const isVideo = isStageVideo(image);

  useEffect(() => {
    if (!isActive || !isVideo) {
      return undefined;
    }

    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }

    return undefined;
  }, [isActive, isVideo, image.src]);

  return (
    <figure className={`project-stage__figure project-stage__figure--${image.layout ?? 'feature'}`}>
      <div className="project-stage__image-frame">
        {isVideo ? (
          <video
            ref={videoRef}
            src={image.src}
            muted
            playsInline
            preload="auto"
            loop={false}
            aria-label={image.alt}
            onEnded={() => {
              if (isActive) {
                onVideoEnded?.();
              }
            }}
          />
        ) : imageError ? (
          <div className="project-stage__image-placeholder">
            <span>{image.alt || '图片占位'}</span>
          </div>
        ) : (
          <button
            type="button"
            className="project-stage__image-trigger"
            aria-label={`放大查看：${image.alt || '图片'}`}
            onClick={(event) => {
              const frame = event.currentTarget.closest('.project-stage__image-frame');
              const thumbWidth = frame?.getBoundingClientRect().width ?? 0;
              onExpand?.({ src: image.src, alt: image.alt, thumbWidth });
            }}
          >
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </button>
        )}
      </div>
    </figure>
  );
}

function StageImageCarousel({ images, caption, captionRich, onExpand }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayRef = useRef(null);
  const advanceTimeoutRef = useRef(null);
  const count = images.length;
  const currentImage = images[activeIndex] ?? images[0];

  const clearTimers = useCallback(() => {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }

    if (advanceTimeoutRef.current) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const goTo = useCallback((index) => {
    setActiveIndex((index + count) % count);
  }, [count]);

  useEffect(() => {
    clearTimers();

    if (count <= 1) {
      return undefined;
    }

    const slide = images[activeIndex];
    if (slide && isStageVideo(slide)) {
      return undefined;
    }

    autoplayRef.current = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % count);
    }, 5000);

    return clearTimers;
  }, [activeIndex, count, images, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleVideoEnded = () => {
    clearTimers();
    advanceTimeoutRef.current = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % count);
    }, 1000);
  };

  const handlePrev = () => {
    clearTimers();
    goTo(activeIndex - 1);
  };

  const handleNext = () => {
    clearTimers();
    goTo(activeIndex + 1);
  };

  if (!currentImage) {
    return null;
  }

  return (
    <div className="project-stage__carousel">
      <div className="project-stage__carousel-shell">
        {count > 1 ? (
          <button
            type="button"
            className="project-stage__carousel-btn project-stage__carousel-btn--prev"
            aria-label="上一张"
            onClick={handlePrev}
          >
            ‹
          </button>
        ) : null}

        <div className="project-stage__carousel-stage">
          <StageCarouselSlide
            key={currentImage.src}
            image={currentImage}
            isActive
            onExpand={onExpand}
            onVideoEnded={handleVideoEnded}
          />
        </div>

        {count > 1 ? (
          <button
            type="button"
            className="project-stage__carousel-btn project-stage__carousel-btn--next"
            aria-label="下一张"
            onClick={handleNext}
          >
            ›
          </button>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="project-stage__carousel-dots" aria-hidden="true">
          {images.map((image, index) => (
            <span
              key={image.src}
              className={`project-stage__carousel-dot ${index === activeIndex ? 'is-active' : ''}`}
            />
          ))}
        </div>
      ) : null}

      {captionRich ? (
        <StageRichCaption blocks={captionRich} />
      ) : caption ? (
        <p className="project-stage__carousel-caption">{caption}</p>
      ) : null}
    </div>
  );
}

function StageStackLayer({ image, isActive, onExpand }) {
  const [imageError, setImageError] = useState(false);
  const layout = image.layout ?? 'feature';

  const handleExpand = (event) => {
    event.stopPropagation();
    const frame = event.currentTarget.closest('.project-stage__image-frame');
    const thumbWidth = frame?.getBoundingClientRect().width ?? 0;
    onExpand?.({ src: image.src, alt: image.alt, thumbWidth });
  };

  return (
    <div
      className={`project-stage__stack-layer ${isActive ? 'is-active' : ''}`}
      aria-hidden={!isActive}
    >
      <figure className={`project-stage__figure project-stage__figure--${layout}`}>
        <div className="project-stage__image-frame">
          {imageError ? (
            <div className="project-stage__image-placeholder">
              <span>{image.alt || '图片占位'}</span>
            </div>
          ) : (
            <>
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                onError={() => setImageError(true)}
              />
              {isActive ? (
                <button
                  type="button"
                  className="project-stage__stack-expand"
                  aria-label={`放大查看：${image.alt || '图片'}`}
                  onClick={handleExpand}
                >
                  ⤢
                </button>
              ) : null}
            </>
          )}
        </div>
      </figure>
    </div>
  );
}

function StageImageStackCarousel({ images, caption, captionRich, onExpand }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayRef = useRef(null);
  const count = images.length;
  const layout = images[0]?.layout ?? 'feature';

  const clearAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    clearAutoplay();
    if (count <= 1) {
      return;
    }

    autoplayRef.current = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % count);
    }, 4500);
  }, [clearAutoplay, count]);

  const advanceFrame = useCallback(() => {
    setActiveIndex((index) => (index + 1) % count);
    startAutoplay();
  }, [count, startAutoplay]);

  useEffect(() => {
    startAutoplay();
    return clearAutoplay;
  }, [activeIndex, startAutoplay, clearAutoplay]);

  if (count === 0) {
    return null;
  }

  return (
    <div className="project-stage__stack-carousel">
      <button
        type="button"
        className={`project-stage__stack-stage project-stage__stack-stage--${layout}`}
        aria-label="下一帧"
        onClick={advanceFrame}
      >
        {images.map((image, index) => (
          <StageStackLayer
            key={image.src}
            image={image}
            isActive={index === activeIndex}
            onExpand={onExpand}
          />
        ))}

        {count > 1 ? (
          <span className="project-stage__stack-frame" aria-hidden="true">
            {String(activeIndex + 1).padStart(2, '0')}
            {' / '}
            {String(count).padStart(2, '0')}
          </span>
        ) : null}
      </button>

      {captionRich ? (
        <StageRichCaption blocks={captionRich} />
      ) : caption ? (
        <p className="project-stage__carousel-caption">{caption}</p>
      ) : null}
    </div>
  );
}

function StageImageSet({ images, carousel = false, carouselMode = 'slide', caption, captionRich }) {
  const [lightboxMedia, setLightboxMedia] = useState(null);

  if (!images || images.length === 0) {
    return null;
  }

  if (carousel && images.length > 1) {
    const CarouselComponent = carouselMode === 'stack' ? StageImageStackCarousel : StageImageCarousel;

    return (
      <>
        <CarouselComponent
          images={images}
          caption={caption}
          captionRich={captionRich}
          onExpand={setLightboxMedia}
        />
        <StageMediaLightbox
          media={lightboxMedia}
          onClose={() => setLightboxMedia(null)}
        />
      </>
    );
  }

  const featureImage = images[0] ?? null;
  const secondaryImages = images.slice(1);

  return (
    <>
      <div className="project-stage__visuals">
        {featureImage ? (
          <StageImage
            image={featureImage}
            variant={featureImage.layout ?? 'feature'}
            onExpand={setLightboxMedia}
          />
        ) : null}

        {secondaryImages.length > 0 ? (
          <div className="project-stage__visual-grid">
            {secondaryImages.map((image) => (
              <StageImage
                key={image.src}
                image={image}
                variant={image.layout ?? 'detail'}
                onExpand={setLightboxMedia}
              />
            ))}
          </div>
        ) : null}
      </div>

      {captionRich ? (
        <StageRichCaption blocks={captionRich} />
      ) : caption ? (
        <p className="project-stage__carousel-caption">{caption}</p>
      ) : null}

      <StageMediaLightbox
        media={lightboxMedia}
        onClose={() => setLightboxMedia(null)}
      />
    </>
  );
}

function SectionGallery({ section }) {
  const columns = section.columns ?? 2;
  return (
    <div
      className="project-section project-section--gallery"
      style={{ '--gallery-columns': columns }}
    >
      {section.images.map((image) => (
        <GalleryImage key={image.src} image={image} />
      ))}
    </div>
  );
}

function SectionProgress({ section }) {
  return (
    <div className="project-section project-section--progress">
      <div className="project-progress__summary">
        <span>{section.label}</span>
        <strong>{section.value}%</strong>
      </div>
      <div className="project-progress__bar" aria-hidden="true">
        <span style={{ width: `${section.value}%` }} />
      </div>
      <ul className="project-progress__items">
        {section.items.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <div className="project-progress__mini-bar" aria-hidden="true">
              <span style={{ width: `${item.value}%` }} />
            </div>
            <em>{item.value}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionCallout({ section }) {
  return (
    <aside className={`project-section project-section--callout project-section--callout-${section.variant ?? 'note'}`}>
      <p>{section.text}</p>
    </aside>
  );
}

function StageToggleTabPanel({ tab }) {
  const paragraphs = tab.paragraphs ?? [];
  const steps = tab.steps ?? [];
  const entries = tab.entries ?? [];
  const images = tab.images ?? [];

  return (
    <article className="project-stage__panel" key={tab.id}>
      <div className="project-stage__content">
        <div className="project-stage__copy">
          {tab.intro ? (
            Array.isArray(tab.intro) ? (
              <div className="project-stage__intro-group">
                {tab.intro.map((line) => (
                  <p key={line} className="project-stage__intro">{line}</p>
                ))}
              </div>
            ) : (
              <p className="project-stage__intro">{tab.intro}</p>
            )
          ) : null}

          {paragraphs.length > 0 ? (
            <div className="project-stage__paragraphs">
              {paragraphs.map((text) => (
                <p key={text.slice(0, 24)} className="project-section__text">{text}</p>
              ))}
            </div>
          ) : null}

          {steps.length > 0 ? (
            <ol className="project-stage__steps">
              {steps.map((item) => (
                <li key={item.text.slice(0, 24)} className="project-step">
                  {item.title ? <strong className="project-step__title">{item.title}</strong> : null}
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>
          ) : null}

          {entries.length > 0 ? (
            <div className="project-stage__entries">
              {entries.map((entry, index) => (
                <article key={`${(entry.title ?? entry.text ?? `entry-${index}`).slice(0, 24)}-${index}`} className="project-stage__entry">
                  <div className="project-stage__entry-copy">
                    <div className="project-stage__entry-index">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="project-stage__entry-body">
                      {entry.title ? <p className="project-stage__entry-title">{entry.title}</p> : null}
                      {entry.text ? (
                        <p className={entry.title ? 'project-stage__entry-text' : 'project-stage__entry-title'}>
                          {entry.text}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {entry.images?.length ? (
                    <div className="project-stage__entry-images">
                      <StageImageSet
                        images={entry.images}
                        carousel={entry.carousel}
                        carouselMode={entry.carouselMode}
                        caption={entry.caption}
                        captionRich={entry.captionRich}
                      />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>

        {entries.length === 0 && images.length > 0 ? <StageImageSet images={images} /> : null}
      </div>
    </article>
  );
}

function scrollToProjectBlock(blockId) {
  if (!blockId) {
    return;
  }

  const block = document.getElementById(blockId);
  if (!block) {
    return;
  }

  block.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function SectionStageToggle({ section, sectionIndex }) {
  const tabs = section.tabs ?? [];
  const initialTabId = tabs[0]?.id ?? null;
  const [activeTabId, setActiveTabId] = useState(initialTabId);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0] ?? null;

  const handleTabSelect = (tabId) => {
    if (tabId === activeTabId) {
      scrollToProjectBlock(section.id);
      return;
    }

    setActiveTabId(tabId);
    window.requestAnimationFrame(() => {
      scrollToProjectBlock(section.id);
    });
  };

  if (!activeTab) {
    return null;
  }

  return (
    <div className="project-section project-section--stage-toggle">
      <div className="project-stage__grid">
        <header className="project-stage__header">
          <p className="project-stage__eyebrow">章节 {String(sectionIndex ?? '').padStart(2, '0')}</p>
          <h3 className="project-stage__title">{section.title}</h3>
          {section.subtitle ? <p className="project-stage__subtitle">{section.subtitle}</p> : null}

          <div className="project-stage__tab-list" role="tablist" aria-label={`${section.title} 内容切换`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`project-stage__tab ${tab.id === activeTab.id ? 'is-active' : ''}`}
                role="tab"
                aria-selected={tab.id === activeTab.id}
                onClick={() => handleTabSelect(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="project-stage__panel-wrap" role="tabpanel">
          <StageToggleTabPanel tab={activeTab} />
        </div>
      </div>
    </div>
  );
}

const SECTION_RENDERERS = {
  intro: SectionIntro,
  heading: SectionHeading,
  subheading: SectionSubheading,
  paragraph: SectionParagraph,
  paragraphs: SectionParagraphs,
  steps: SectionSteps,
  quote: SectionQuote,
  divider: SectionDivider,
  bulletList: SectionBulletList,
  table: SectionTable,
  timeline: SectionTimeline,
  gallery: SectionGallery,
  progress: SectionProgress,
  callout: SectionCallout,
  stageToggle: SectionStageToggle,
};

export default function ProjectSectionRenderer({ section, sectionIndex }) {
  const Renderer = SECTION_RENDERERS[section.type];

  if (!Renderer) {
    return null;
  }

  return (
    <section
      className="project-block"
      data-section-type={section.type}
      id={section.id}
    >
      <Renderer section={section} sectionIndex={sectionIndex} />
    </section>
  );
}
