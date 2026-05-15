import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import walkVideo from '../../walk-ffmpeg-2.webm?url';
import wakeupVideo from '../../wakeup-ffmpeg-1.webm?url';
import sleepVideo from '../../sleep-ffmpeg-1.webm?url';

const ASSET_PATH = '/assets/';
const DESKTOP_BREAKPOINT = 1025;

function shouldShowRotateTip() {
  if (typeof window === 'undefined') return false;

  const { innerWidth, innerHeight } = window;
  const isDesktop = innerWidth >= DESKTOP_BREAKPOINT;
  const isLandscape = innerWidth > innerHeight;

  return !isDesktop && !isLandscape;
}

export default function Home({ wakeSignal, onEnterDream }) {
  const videoRef = useRef(null);
  const cushionRef = useRef(null);
  const [phase, setPhase] = useState(wakeSignal > 0 ? 'waking' : 'intro');
  const [bubbleBroken, setBubbleBroken] = useState(false);
  const [videoSource, setVideoSource] = useState(wakeSignal > 0 ? wakeupVideo : walkVideo);
  const [showRotateTip, setShowRotateTip] = useState(() => shouldShowRotateTip());
  const [sleepButtonTop, setSleepButtonTop] = useState(null);
  const showBubble = phase === 'dreamReady';
  const showSleep = phase === 'awake';

  function settlePlaybackState(currentPhase) {
    if (currentPhase === 'waking') return 'awake';
    if (currentPhase === 'intro' || currentPhase === 'sleepingAgain') return 'dreamReady';
    return currentPhase;
  }

  useEffect(() => {
    const timers = [];

    if (wakeSignal > 0) {
      setBubbleBroken(true);
      setPhase('waking');
      setVideoSource(wakeupVideo);
      timers.push(window.setTimeout(() => setBubbleBroken(false), 1900));
      return () => timers.forEach(window.clearTimeout);
    }

    setPhase('intro');
    setBubbleBroken(false);
    setVideoSource(walkVideo);

    timers.push(window.setTimeout(() => {
      setPhase((current) => (current === 'intro' ? 'dreamReady' : current));
    }, 5200));

    return () => timers.forEach(window.clearTimeout);
  }, [wakeSignal]);

  useEffect(() => {
    if (!['intro', 'sleepingAgain', 'waking'].includes(phase)) return undefined;

    const timerId = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      video.pause();
      video.muted = true;
      video.playsInline = true;

      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {
          setPhase((current) => settlePlaybackState(current));
        });
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [phase, videoSource]);

  useEffect(() => {
    function updateRotateTipState() {
      setShowRotateTip(shouldShowRotateTip());
    }

    updateRotateTipState();
    window.addEventListener('resize', updateRotateTipState);
    window.addEventListener('orientationchange', updateRotateTipState);

    return () => {
      window.removeEventListener('resize', updateRotateTipState);
      window.removeEventListener('orientationchange', updateRotateTipState);
    };
  }, []);

  useLayoutEffect(() => {
    if (!showSleep || showRotateTip) {
      setSleepButtonTop(null);
      return undefined;
    }

    let frameId = 0;
    let resizeObserver;

    function measureSleepButton() {
      const cushion = cushionRef.current;
      if (!cushion) return;

      const cushionRect = cushion.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const gapToViewportBottom = Math.max(0, viewportHeight - cushionRect.bottom);
      const nextTop = cushionRect.bottom + gapToViewportBottom * 0.3;

      setSleepButtonTop((current) => {
        if (current !== null && Math.abs(current - nextTop) < 0.5) return current;
        return nextTop;
      });
    }

    function scheduleMeasurement() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measureSleepButton);
    }

    scheduleMeasurement();
    window.addEventListener('resize', scheduleMeasurement);
    window.addEventListener('orientationchange', scheduleMeasurement);

    if ('ResizeObserver' in window && cushionRef.current) {
      resizeObserver = new ResizeObserver(() => scheduleMeasurement());
      resizeObserver.observe(cushionRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleMeasurement);
      window.removeEventListener('orientationchange', scheduleMeasurement);
      resizeObserver?.disconnect();
    };
  }, [showRotateTip, showSleep, videoSource]);

  function handleVideoEnded() {
    setPhase((current) => {
      return settlePlaybackState(current);
    });
  }

  function handleSleep() {
    setPhase('sleepingAgain');
    setVideoSource(sleepVideo);
  }

  return (
    <main className={`home page-shell ${showRotateTip ? 'page-shell--locked' : ''}`}>
      <section
        className={`home-card ${showRotateTip ? 'is-hidden-for-rotate-tip' : ''}`}
        aria-label="Dog dream home scene"
        aria-hidden={showRotateTip}
      >
        <h1 className="home-word">EVERYTHING YOU SEE IS PART OF A DREAM</h1>
        <div className="home-line" />

        <div className="home-scene">
          <div className={`home-scene__cluster dog-scene dog-scene--${phase}`}>
            <img className="cushion" ref={cushionRef} src={`${ASSET_PATH}Cushion.png`} alt="坐垫" />
            <video
              ref={videoRef}
              className="dog-canvas dog-video-display"
              src={videoSource}
              muted
              playsInline
              preload="auto"
              onEnded={handleVideoEnded}
            />

            <button
              className={`dream-bubble ${showBubble ? 'is-visible' : ''} ${bubbleBroken ? 'is-broken' : ''}`}
              type="button"
              onClick={onEnterDream}
              disabled={!showBubble}
              aria-label="进入梦境走廊"
            >
              <img src={`${ASSET_PATH}Dream Bubble.png`} alt="" />
            </button>
          </div>
        </div>

        {showSleep && (
          <button
            className={`site-button sleep-button ${sleepButtonTop === null ? 'is-measuring' : ''}`}
            type="button"
            onClick={handleSleep}
            style={sleepButtonTop === null ? undefined : { top: `${sleepButtonTop}px` }}
          >
            sleep
          </button>
        )}
      </section>

      {showRotateTip && (
        <div className="rotate-tip-overlay" role="dialog" aria-modal="true" aria-label="横屏浏览提示">
          <div className="rotate-tip-panel">
            <div className="rotate-tip-icon" aria-hidden="true">
              <span className="rotate-tip-phone">
                <span className="rotate-tip-phone-screen" />
              </span>
            </div>
            <div className="rotate-tip-copy">
              <p className="rotate-tip-title">请旋转手机</p>
              <p className="rotate-tip-subtitle">横屏获得最佳体验</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
