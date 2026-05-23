import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import walkVideo from '../../walk-ffmpeg-2.webm?url';
import wakeupVideo from '../../wakeup-ffmpeg-1.webm?url';
import sleepVideo from '../../sleep-ffmpeg-1.webm?url';

const ASSET_PATH = '/assets/';
const HOME_STEAM_LAB_ENTRY_ENABLED = false;

export default function Home({ wakeSignal, onEnterDream, onEnterSteamLab }) {
  const videoRef = useRef(null);
  const cushionRef = useRef(null);
  const [phase, setPhase] = useState(wakeSignal > 0 ? 'waking' : 'intro');
  const [bubbleBroken, setBubbleBroken] = useState(false);
  const [videoSource, setVideoSource] = useState(wakeSignal > 0 ? wakeupVideo : walkVideo);
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

  useLayoutEffect(() => {
    if (!showSleep) {
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
  }, [showSleep, videoSource]);

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
    <main className="home page-shell">
      <section
        className="home-card"
        aria-label="Dog dream home scene"
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

        {showSleep && HOME_STEAM_LAB_ENTRY_ENABLED && (
          <button className="site-button site-button--ghost" type="button" onClick={onEnterSteamLab}>
            steam lab
          </button>
        )}

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
    </main>
  );
}
