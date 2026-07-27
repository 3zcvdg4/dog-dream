import { useLayoutEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import parallaxSceneSvg from './parallax/parallax-scene.svg?raw';
import { initParallaxScroll } from './parallax/initParallaxScroll.js';
import { initIntroDwellScroll, INTRO_COPY } from './parallax/initIntroDwellScroll.js';
import ParallaxScrollSections from './parallax/ParallaxScrollSections.jsx';

/** One extra frame after dream transition + SiteNav mount. */
const POST_READY_REFRESH_MS = [0, 50, 200, 600];

function svgHasLayout(svg) {
  if (!svg) return false;
  try {
    const box = svg.getBBox();
    return box.width > 0 && box.height > 0;
  } catch {
    return false;
  }
}

export default function ProjectParallaxCaseStudy({
  project,
  dreamLayoutReady = true,
  onBackToCorridor,
}) {
  const pageRef = useRef(null);
  const sceneRootRef = useRef(null);
  const sceneStageRef = useRef(null);
  const [scroller, setScroller] = useState(null);

  useLayoutEffect(() => {
    const page = pageRef.current;
    const sceneRoot = sceneRootRef.current;
    if (!page || !sceneRoot || !scroller || !dreamLayoutReady) {
      return undefined;
    }

    let cancelled = false;
    let cleanupAnim = null;
    let cleanupIntroDwell = null;
    let rafWait = 0;
    const timers = [];

    const refresh = () => {
      if (!cancelled) {
        ScrollTrigger.refresh(true);
      }
    };

    const start = () => {
      if (cancelled) return;

      const svg = sceneRoot.querySelector('svg.parallax') || sceneRoot.querySelector('svg');
      if (!svgHasLayout(svg)) {
        rafWait = window.requestAnimationFrame(start);
        return;
      }

      ScrollTrigger.clearScrollMemory();
      ScrollTrigger.defaults({ scroller: page });
      page.scrollTop = 0;
      cleanupAnim?.();
      cleanupIntroDwell?.();
      cleanupAnim = initParallaxScroll(sceneRoot, page);
      cleanupIntroDwell = initIntroDwellScroll(page);
      sceneStageRef.current?.classList.add('is-parallax-ready');
      refresh();

      window.requestAnimationFrame(() => {
        page.scrollTop = 0;
        refresh();
        window.requestAnimationFrame(refresh);
      });
      POST_READY_REFRESH_MS.forEach((ms) => {
        timers.push(window.setTimeout(refresh, ms));
      });
    };

    start();

    const onScroll = () => {
      ScrollTrigger.update();
    };

    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          refresh();
        })
      : null;
    ro?.observe(page);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    page.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', refresh);
    document.addEventListener('visibilitychange', onVisibility);

    const onWheel = (event) => {
      if (page.scrollHeight <= page.clientHeight + 1) return;

      let node = event.target;
      while (node && node !== document.body) {
        if (node === page) return;
        if (node instanceof HTMLElement) {
          const style = window.getComputedStyle(node);
          const canScrollY = /auto|scroll|overlay/.test(style.overflowY)
            && node.scrollHeight > node.clientHeight + 1;
          if (canScrollY) return;
        }
        node = node.parentElement;
      }

      page.scrollTop += event.deltaY;
      event.preventDefault();
    };

    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafWait);
      timers.forEach((id) => window.clearTimeout(id));
      ro?.disconnect();
      page.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
      cleanupAnim?.();
      cleanupIntroDwell?.();
      sceneStageRef.current?.classList.remove('is-parallax-ready');
      ScrollTrigger.defaults({ scroller: window });
    };
  }, [scroller, dreamLayoutReady]);

  return (
    <main
      className="project-page project-page--project-03-parallax"
      aria-label={project?.title ?? 'FINDING STONE'}
      ref={(node) => {
        pageRef.current = node;
        if (node && scroller !== node) {
          setScroller(node);
        }
      }}
    >
      <div className="parallax03-wrapper" ref={sceneRootRef}>
        <div className="parallax03-scene" ref={sceneStageRef}>
          <div
            className="parallax03-scene__svg"
            dangerouslySetInnerHTML={{ __html: parallaxSceneSvg }}
          />
          <div className="intro-dwell-stage">
            <header id="brand-intro-actor" className="page-section__head page-section__head--intro">
              <p className="page-section__eyebrow">{INTRO_COPY.eyebrow}</p>
              <h2 className="page-section__title">{INTRO_COPY.title}</h2>
              {INTRO_COPY.lead.map((paragraph) => (
                <p key={paragraph} className="page-section__lead">{paragraph}</p>
              ))}
            </header>
          </div>
        </div>
        <div className="scrollElement" aria-hidden="true" />
        <div className="scroll-gem-hold" aria-hidden="true" />
        <div className="scroll-intro" aria-hidden="true" />
        <div className="scroll-dwell" aria-hidden="true" />
      </div>
      <ParallaxScrollSections project={project} onBackToCorridor={onBackToCorridor} />
    </main>
  );
}
