import { useEffect, useRef, useState } from 'react';
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';

import './ComicFlipBook.css';

export default function ComicFlipBook({ images }) {
  const hostRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !images?.length) return undefined;

    host.innerHTML = '';
    const bookEl = document.createElement('div');
    bookEl.className = 'comic-flip-book__book';
    host.appendChild(bookEl);

    const pageFlip = new PageFlip(bookEl, {
      width: 852,
      height: 1193,
      size: 'stretch',
      minWidth: 280,
      maxWidth: 1114,
      minHeight: 390,
      maxHeight: 1559,
      drawShadow: true,
      flippingTime: 850,
      usePortrait: true,
      startZIndex: 0,
      autoSize: true,
      maxShadowOpacity: 0.28,
      showCover: true,
      mobileScrollSupport: false,
      useMouseEvents: true,
    });

    pageFlip.loadFromImages(images.map((image) => image.src));
    setPageCount(pageFlip.getPageCount());
    setPageIndex(pageFlip.getCurrentPageIndex());

    const onFlip = (event) => {
      setPageIndex(event.data);
    };

    pageFlip.on('flip', onFlip);

    return () => {
      pageFlip.off('flip');
      try {
        pageFlip.destroy();
      } catch {
        // ignore teardown races
      }
      host.innerHTML = '';
    };
  }, [images]);

  if (!images?.length) return null;

  return (
    <div className="comic-flip-book">
      <div ref={hostRef} className="comic-flip-book__host" />

      <p className="comic-flip-book__hint" aria-live="polite">
        点击书页翻页 · {pageIndex + 1} / {Math.max(pageCount, images.length)}
      </p>
    </div>
  );
}
