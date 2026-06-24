import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import walkVideo from '../../walk-ffmpeg-1.webm?url';
import wakeupVideo from '../../wakeup-ffmpeg-1.webm?url';
import sleepVideo from '../../sleep-ffmpeg-1.webm?url';
import dreamBubbleImage from '../../Dream Bubble-2.png?url';

const ASSET_PATH = '/assets/';
const HOME_STEAM_LAB_ENTRY_ENABLED = false;
const PHASE_FALLBACK_DURATIONS_MS = {
  intro: 5200,
  waking: 1500,
  sleepingAgain: 1350,
};
const VIDEO_PROBE_TIMEOUT_MS = 1800;
const preloadedHomeVideoPromises = new Map();
const fetchedHomeVideoPromises = new Map();
const resolvedHomeVideoSourcePromises = new Map();
const probedHomeVideoSourcePromises = new Map();

export const HOME_INTRO_VIDEO_SOURCES = [walkVideo];
export const HOME_WAKE_VIDEO_SOURCES = [wakeupVideo];
export const HOME_SLEEP_VIDEO_SOURCES = [sleepVideo];
export const HOME_DREAM_BUBBLE_IMAGE_URL = dreamBubbleImage;

function normalizeHomeVideoSources(input) {
  if (Array.isArray(input)) return input.filter(Boolean);
  return input ? [input] : [];
}

function getHomeVideoSourceCacheKey(sources) {
  return sources.join('||');
}

function fetchHomeVideoUrl(url) {
  if (typeof window === 'undefined' || typeof fetch === 'undefined' || !url) {
    return Promise.resolve(url);
  }

  if (fetchedHomeVideoPromises.has(url)) {
    return fetchedHomeVideoPromises.get(url);
  }

  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to preload video: ${response.status}`);
      }

      return response.arrayBuffer();
    })
    .catch(() => url)
    .then(() => url);

  fetchedHomeVideoPromises.set(url, promise);
  return promise;
}

function probeHomeVideoSource(url) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !url) {
    return Promise.resolve(Boolean(url));
  }

  if (probedHomeVideoSourcePromises.has(url)) {
    return probedHomeVideoSourcePromises.get(url);
  }

  const promise = new Promise((resolve) => {
    const video = document.createElement('video');
    let settled = false;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    const finish = (playable) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('error', handleError);
      cleanup();
      resolve(playable);
    };

    const handleReady = () => finish(true);
    const handleError = () => finish(false);
    const timeoutId = window.setTimeout(() => finish(video.readyState >= 2), VIDEO_PROBE_TIMEOUT_MS);

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);
    video.addEventListener('error', handleError);
    video.src = url;
    video.load();
  });

  probedHomeVideoSourcePromises.set(url, promise);
  return promise;
}

export async function resolvePlayableHomeVideoSource(input) {
  const sources = normalizeHomeVideoSources(input);
  if (!sources.length) return '';

  const cacheKey = getHomeVideoSourceCacheKey(sources);
  if (resolvedHomeVideoSourcePromises.has(cacheKey)) {
    return resolvedHomeVideoSourcePromises.get(cacheKey);
  }

  const promise = (async () => {
    for (const source of sources) {
      if (await probeHomeVideoSource(source)) {
        return source;
      }
    }

    return sources[0];
  })();

  resolvedHomeVideoSourcePromises.set(cacheKey, promise);
  return promise;
}

export function preloadHomeVideo(input) {
  const sources = normalizeHomeVideoSources(input);
  if (!sources.length) {
    return Promise.resolve('');
  }

  const cacheKey = getHomeVideoSourceCacheKey(sources);
  if (preloadedHomeVideoPromises.has(cacheKey)) {
    return preloadedHomeVideoPromises.get(cacheKey);
  }

  const promise = resolvePlayableHomeVideoSource(sources)
    .then((resolvedUrl) => fetchHomeVideoUrl(resolvedUrl))
    .catch(() => sources[0]);

  preloadedHomeVideoPromises.set(cacheKey, promise);
  return promise;
}

export default function Home({ wakeSignal, homeEntryMode = 'intro', playbackBlocked = false, onEnterDream, onEnterSteamLab, sceneCaptureRef }) {
  const videoRef = useRef(null);
  const cushionRef = useRef(null);
  const playbackFallbackTimerRef = useRef(0);
  const prevPlaybackBlockedRef = useRef(playbackBlocked);
  const [phase, setPhase] = useState(homeEntryMode === 'wake' ? 'waking' : 'intro');
  const [bubbleBroken, setBubbleBroken] = useState(false);
  const [videoSources, setVideoSources] = useState(homeEntryMode === 'wake' ? HOME_WAKE_VIDEO_SOURCES : HOME_INTRO_VIDEO_SOURCES);
  const [videoSource, setVideoSource] = useState('');
  const [playbackRequest, setPlaybackRequest] = useState(0);
  const [sleepButtonTop, setSleepButtonTop] = useState(null);
  const showBubble = phase === 'dreamReady';
  const showSleep = phase === 'awake';

  function queueVideoPlayback(nextSources, nextPhase) {
    setPhase(nextPhase);
    setVideoSources(nextSources);
    setVideoSource('');
    setPlaybackRequest((current) => current + 1);
  }

  function settlePlaybackState(currentPhase) {
    if (currentPhase === 'waking') return 'awake';
    if (currentPhase === 'intro' || currentPhase === 'sleepingAgain') return 'dreamReady';
    return currentPhase;
  }

  useEffect(() => {
    const timers = [];
    window.clearTimeout(playbackFallbackTimerRef.current);

    if (homeEntryMode === 'wake') {
      setBubbleBroken(true);
      setPhase('waking');
      setVideoSources(HOME_WAKE_VIDEO_SOURCES);
      setVideoSource('');
      setPlaybackRequest((current) => current + 1);
      timers.push(window.setTimeout(() => setBubbleBroken(false), 1900));
      return () => timers.forEach(window.clearTimeout);
    }

    setPhase('intro');
    setBubbleBroken(false);
    setVideoSources(HOME_INTRO_VIDEO_SOURCES);
    setVideoSource('');
    setPlaybackRequest((current) => current + 1);

    return () => timers.forEach(window.clearTimeout);
  }, [homeEntryMode, wakeSignal]);

  useEffect(() => {
    let cancelled = false;

    resolvePlayableHomeVideoSource(videoSources)
      .then((resolvedSource) => {
        if (cancelled) return;
        setVideoSource(resolvedSource);
      })
      .catch(() => {
        if (cancelled) return;
        setVideoSource(videoSources[0] ?? '');
      });

    return () => {
      cancelled = true;
    };
  }, [videoSources, playbackRequest]);

  useEffect(() => () => {
    window.clearTimeout(playbackFallbackTimerRef.current);
  }, []);

  useEffect(() => {
    if (!videoSource) return undefined;
    if (playbackBlocked) return undefined;
    if (!['intro', 'sleepingAgain', 'waking'].includes(phase)) return undefined;

    let cancelled = false;
    let detachReadyListeners = null;
    const timerId = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      window.clearTimeout(playbackFallbackTimerRef.current);
      video.pause();
      video.currentTime = 0;
      video.muted = true;
      video.playsInline = true;

      const fallbackDuration = PHASE_FALLBACK_DURATIONS_MS[phase] ?? 0;
      if (fallbackDuration > 0) {
        playbackFallbackTimerRef.current = window.setTimeout(() => {
          setPhase((current) => (current === phase ? settlePlaybackState(current) : current));
        }, fallbackDuration);
      }

      let playbackStarted = false;
      const tryPlay = () => {
        if (cancelled || playbackStarted) return;
        playbackStarted = true;

        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => {
            playbackStarted = false;
            // 保留回退计时，不再因为自动播放失败而立刻让梦泡出现。
          });
        }
      };

      const handleReady = () => {
        tryPlay();
      };

      video.addEventListener('loadeddata', handleReady);
      video.addEventListener('canplay', handleReady);
      detachReadyListeners = () => {
        video.removeEventListener('loadeddata', handleReady);
        video.removeEventListener('canplay', handleReady);
      };

      if (video.readyState >= 2) {
        tryPlay();
      } else {
        video.load();
      }

      if (cancelled) {
        detachReadyListeners?.();
      }
    }, 0);

    return () => {
      cancelled = true;
      detachReadyListeners?.();
      window.clearTimeout(timerId);
    };
  }, [phase, videoSource, playbackRequest, playbackBlocked]);

  useEffect(() => {
    if (!playbackBlocked) return undefined;

    const video = videoRef.current;
    if (!video) return undefined;

    window.clearTimeout(playbackFallbackTimerRef.current);
    video.pause();
    video.currentTime = 0;
    return undefined;
  }, [playbackBlocked, videoSource]);

  useEffect(() => {
    const wasBlocked = prevPlaybackBlockedRef.current;
    prevPlaybackBlockedRef.current = playbackBlocked;

    if (wasBlocked && !playbackBlocked && phase === 'intro' && videoSource) {
      setPlaybackRequest((current) => current + 1);
    }
  }, [playbackBlocked, phase, videoSource]);

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
    window.clearTimeout(playbackFallbackTimerRef.current);
    setPhase((current) => {
      return settlePlaybackState(current);
    });
  }

  function handleSleep() {
    queueVideoPlayback(HOME_SLEEP_VIDEO_SOURCES, 'sleepingAgain');
  }

  function handleEnterDream(event) {
    const bubbleRect = event.currentTarget.getBoundingClientRect();
    const anchorX = bubbleRect.left + bubbleRect.width * 0.58;
    const anchorY = bubbleRect.top + bubbleRect.height * 0.42;

    onEnterDream({
      x: anchorX,
      y: anchorY,
    });
  }

  return (
    <main className="home page-shell" ref={sceneCaptureRef}>
      <section
        className="home-card"
        aria-label="Dog dream home scene"
      >
        <h1 className="home-word">EVERYTHING YOU SEE IS PART OF A DREAM</h1>
        <div className="home-line" />

        <div className="home-scene">
          <div className={`home-scene__cluster dog-scene dog-scene--${phase}`}>
            <img className="cushion" ref={cushionRef} src={`${ASSET_PATH}Cushion.png`} alt="坐垫" />
            {videoSource && !playbackBlocked ? (
              <video
                key={videoSource}
                ref={videoRef}
                className="dog-canvas dog-video-display"
                src={videoSource}
                muted
                playsInline
                autoPlay
                preload="auto"
                onEnded={handleVideoEnded}
              />
            ) : null}

            <button
              className={`dream-bubble ${showBubble ? 'is-visible' : ''} ${bubbleBroken ? 'is-broken' : ''}`}
              type="button"
              onClick={handleEnterDream}
              disabled={!showBubble}
              aria-label="进入梦境走廊"
            >
              <span aria-hidden="true" />
              <img src={HOME_DREAM_BUBBLE_IMAGE_URL} alt="" />
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
            睡觉
          </button>
        )}
      </section>
    </main>
  );
}
