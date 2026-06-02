import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import Home from './pages/Home.jsx';
import DreamTransitionOverlay from './components/DreamTransitionOverlay.jsx';
import { projects } from './data/projects.js';

const DreamCorridor = lazy(() => import('./pages/DreamCorridor.jsx'));
const ProjectDream = lazy(() => import('./pages/ProjectDream.jsx'));
const SteamLab = lazy(() => import('./pages/SteamLab.jsx'));

const DESKTOP_BREAKPOINT = 1025;
const TRANSITION_WHITE_BACKGROUND = '#f7f6f2';
const DREAM_TRANSITION_WHITE_HOLD_DELAY_MS = 2760;
const DREAM_TRANSITION_SWITCH_DELAY_MS = 2920;
const DREAM_TRANSITION_REVEAL_DELAY_MS = 3040;
const DREAM_TRANSITION_FINISH_DELAY_MS = 5050;
const CORRIDOR_RETURN_WHITE_HOLD_DELAY_MS = 320;
const CORRIDOR_RETURN_SWITCH_DELAY_MS = 400;
const CORRIDOR_RETURN_REVEAL_DELAY_MS = 820;
const CORRIDOR_RETURN_FINISH_DELAY_MS = 1820;
const CORRIDOR_RETURN_WHITE_FILL_START_MS = 36;
const CORRIDOR_RETURN_WHITE_FILL_DURATION_MS = 380;
const DREAM_CORRIDOR_TEXTURES = [
  '/assets/corridor-ceiling.png',
  '/assets/corridor-floor.png',
  '/assets/corridor-left-wall.png',
  '/assets/corridor-right-wall.png',
];
const DREAM_CORRIDOR_POSTERS = projects.map((project) => project.imageUrl).filter(Boolean);

const preloadedDreamImages = new Set();

function preloadImageAsset(url) {
  if (typeof window === 'undefined' || !url || preloadedDreamImages.has(url)) return;

  const image = new window.Image();
  image.decoding = 'async';
  image.src = url;
  preloadedDreamImages.add(url);
}

function shouldShowRotateTip() {
  if (typeof window === 'undefined') return false;

  const { innerWidth, innerHeight } = window;
  const isDesktop = innerWidth >= DESKTOP_BREAKPOINT;
  const isLandscape = innerWidth > innerHeight;

  return !isDesktop && !isLandscape;
}

function preloadDreamPages() {
  void import('./pages/DreamCorridor.jsx').then((module) => {
    module.preloadCorridorTextures?.();
  });
  void import('./pages/ProjectDream.jsx');
  void import('./pages/SteamLab.jsx');
}

function preloadDreamAssets() {
  DREAM_CORRIDOR_TEXTURES.forEach(preloadImageAsset);
  DREAM_CORRIDOR_POSTERS.forEach(preloadImageAsset);
}

function createIdleDreamTransitionState() {
  return {
    phase: 'idle',
    x: 0,
    y: 0,
    key: 0,
    snapshotCanvas: null,
    mode: 'ripple',
    revealDurationMs: null,
    whiteFillStartMs: null,
    whiteFillDurationMs: null,
  };
}

function resolveObjectPositionValue(token, availableSpace) {
  if (!token) return availableSpace * 0.5;

  if (token === 'left' || token === 'top') return 0;
  if (token === 'center') return availableSpace * 0.5;
  if (token === 'right' || token === 'bottom') return availableSpace;

  if (token.endsWith('%')) {
    return availableSpace * (Number.parseFloat(token) / 100);
  }

  const numericValue = Number.parseFloat(token);
  return Number.isFinite(numericValue) ? numericValue : availableSpace * 0.5;
}

function computeMediaDrawBox(elementRect, mediaWidth, mediaHeight, objectFit, objectPosition) {
  const boxWidth = Math.max(elementRect.width, 1);
  const boxHeight = Math.max(elementRect.height, 1);
  const safeMediaWidth = Math.max(mediaWidth, 1);
  const safeMediaHeight = Math.max(mediaHeight, 1);
  const mediaAspect = safeMediaWidth / safeMediaHeight;
  const boxAspect = boxWidth / boxHeight;
  const positionTokens = objectPosition.trim().split(/\s+/);
  const horizontalToken = positionTokens[0] ?? '50%';
  const verticalToken = positionTokens[1] ?? positionTokens[0] ?? '50%';

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = safeMediaWidth;
  let sourceHeight = safeMediaHeight;
  let drawWidth = boxWidth;
  let drawHeight = boxHeight;

  if (objectFit === 'contain' || objectFit === 'scale-down') {
    if (boxAspect > mediaAspect) {
      drawHeight = boxHeight;
      drawWidth = drawHeight * mediaAspect;
    } else {
      drawWidth = boxWidth;
      drawHeight = drawWidth / mediaAspect;
    }
  } else if (objectFit === 'cover') {
    if (boxAspect > mediaAspect) {
      sourceHeight = safeMediaWidth / boxAspect;
      sourceY = (safeMediaHeight - sourceHeight) * 0.5;
    } else {
      sourceWidth = safeMediaHeight * boxAspect;
      sourceX = (safeMediaWidth - sourceWidth) * 0.5;
    }
  } else if (objectFit === 'none') {
    drawWidth = safeMediaWidth;
    drawHeight = safeMediaHeight;
  } else {
    drawWidth = boxWidth;
    drawHeight = boxHeight;
  }

  if (objectFit === 'scale-down') {
    drawWidth = Math.min(drawWidth, safeMediaWidth);
    drawHeight = Math.min(drawHeight, safeMediaHeight);
  }

  const availableX = boxWidth - drawWidth;
  const availableY = boxHeight - drawHeight;
  const offsetX = resolveObjectPositionValue(horizontalToken, availableX);
  const offsetY = resolveObjectPositionValue(verticalToken, availableY);

  return {
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    drawX: elementRect.left + offsetX,
    drawY: elementRect.top + offsetY,
    drawWidth,
    drawHeight,
  };
}

function paintLiveVideosIntoSnapshot(target, snapshotCanvas) {
  const context = snapshotCanvas.getContext('2d');
  if (!context) return;

  const targetRect = target.getBoundingClientRect();
  const scaleX = snapshotCanvas.width / Math.max(targetRect.width, 1);
  const scaleY = snapshotCanvas.height / Math.max(targetRect.height, 1);
  const videos = target.querySelectorAll('video');

  videos.forEach((video) => {
    if (!(video instanceof HTMLVideoElement)) return;
    if (video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) return;

    const videoRect = video.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(video);
    const drawBox = computeMediaDrawBox(
      videoRect,
      video.videoWidth,
      video.videoHeight,
      computedStyle.objectFit || 'fill',
      computedStyle.objectPosition || '50% 50%',
    );
    const previousFilter = context.filter;
    const previousAlpha = context.globalAlpha;

    context.save();
    context.filter = computedStyle.filter && computedStyle.filter !== 'none'
      ? computedStyle.filter
      : 'none';
    context.globalAlpha = Number.parseFloat(computedStyle.opacity || '1') || 1;
    context.drawImage(
      video,
      drawBox.sourceX,
      drawBox.sourceY,
      drawBox.sourceWidth,
      drawBox.sourceHeight,
      (drawBox.drawX - targetRect.left) * scaleX,
      (drawBox.drawY - targetRect.top) * scaleY,
      drawBox.drawWidth * scaleX,
      drawBox.drawHeight * scaleY,
    );
    context.restore();
    context.filter = previousFilter;
    context.globalAlpha = previousAlpha;
  });
}

async function captureTransitionSnapshot(target) {
  if (!target) return null;

  const capturedCanvas = await html2canvas(target, {
    backgroundColor: TRANSITION_WHITE_BACKGROUND,
    useCORS: true,
    scale: Math.min(window.devicePixelRatio || 1, 1.5),
    logging: false,
    ignoreElements: (element) => {
      if (!(element instanceof HTMLElement)) return false;

      return element.classList.contains('dream-transition');
    },
  });

  const snapshotCanvas = document.createElement('canvas');
  snapshotCanvas.width = capturedCanvas.width;
  snapshotCanvas.height = capturedCanvas.height;
  const context = snapshotCanvas.getContext('2d');

  if (!context) return capturedCanvas;

  context.drawImage(capturedCanvas, 0, 0);
  paintLiveVideosIntoSnapshot(target, snapshotCanvas);
  return snapshotCanvas;
}

export default function App() {
  const [view, setView] = useState('home');
  const [wakeSignal, setWakeSignal] = useState(0);
  const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
  const [corridorReturnState, setCorridorReturnState] = useState(null);
  const [corridorSmokePreset, setCorridorSmokePreset] = useState(null);
  const [showRotateTip, setShowRotateTip] = useState(() => shouldShowRotateTip());
  const [dreamTransition, setDreamTransition] = useState(() => createIdleDreamTransitionState());
  const dreamTransitionTimersRef = useRef([]);
  const homeSceneCaptureRef = useRef(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId],
  );

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

  useEffect(() => {
    if (view !== 'home') return undefined;

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        preloadDreamPages();
        preloadDreamAssets();
      }, { timeout: 1200 });

      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(() => {
      preloadDreamPages();
      preloadDreamAssets();
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [view]);

  useEffect(() => () => {
    dreamTransitionTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    dreamTransitionTimersRef.current = [];
  }, []);

  function clearDreamTransitionTimers() {
    dreamTransitionTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    dreamTransitionTimersRef.current = [];
  }

  async function startDreamEntryTransition(origin) {
    if (dreamTransition.phase !== 'idle') return;

    const viewportWidth = window.innerWidth || 1;
    const viewportHeight = window.innerHeight || 1;
    const x = Number.isFinite(origin?.x) ? origin.x : viewportWidth / 2;
    const y = Number.isFinite(origin?.y) ? origin.y : viewportHeight / 2;

    clearDreamTransitionTimers();
    preloadDreamPages();
    preloadDreamAssets();

    let snapshotCanvas = null;

    try {
      snapshotCanvas = await captureTransitionSnapshot(homeSceneCaptureRef.current);
    } catch (error) {
      console.warn('[dogdream] Dream transition snapshot failed.', error);
      return;
    }

    setDreamTransition((current) => {
      if (current.phase !== 'idle') return current;

      dreamTransitionTimersRef.current = [
        window.setTimeout(() => {
          setCorridorSmokePreset(null);
          setCorridorReturnState(null);
          setView('corridor');
        }, DREAM_TRANSITION_SWITCH_DELAY_MS),
        window.setTimeout(() => {
          setDreamTransition((transition) => {
            if (transition.phase === 'idle') return transition;
            return {
              ...transition,
              phase: 'white-hold',
            };
          });
        }, DREAM_TRANSITION_WHITE_HOLD_DELAY_MS),
        window.setTimeout(() => {
          setDreamTransition((transition) => {
            if (transition.phase === 'idle') return transition;
            return {
              ...transition,
              phase: 'revealing',
            };
          });
        }, DREAM_TRANSITION_REVEAL_DELAY_MS),
        window.setTimeout(() => {
          setDreamTransition(createIdleDreamTransitionState());
          clearDreamTransitionTimers();
        }, DREAM_TRANSITION_FINISH_DELAY_MS),
      ];

      return {
        phase: 'rippling',
        x,
        y,
        key: current.key + 1,
        snapshotCanvas,
        mode: 'ripple',
        revealDurationMs: DREAM_TRANSITION_FINISH_DELAY_MS - DREAM_TRANSITION_REVEAL_DELAY_MS,
        whiteFillStartMs: undefined,
        whiteFillDurationMs: undefined,
      };
    });
  }

  async function startCorridorReturnTransition() {
    if (dreamTransition.phase !== 'idle') return;

    clearDreamTransitionTimers();
    preloadDreamPages();
    preloadDreamAssets();

    setDreamTransition((current) => {
      if (current.phase !== 'idle') return current;

      dreamTransitionTimersRef.current = [
        window.setTimeout(() => {
          setCorridorReturnState((state) => {
            if (!state) return state;
            return {
              ...state,
              resumeFromProject: true,
            };
          });
          setCorridorSmokePreset(null);
          setView('corridor');
        }, CORRIDOR_RETURN_SWITCH_DELAY_MS),
        window.setTimeout(() => {
          setDreamTransition((transition) => {
            if (transition.phase === 'idle') return transition;
            return {
              ...transition,
              phase: 'white-hold',
            };
          });
        }, CORRIDOR_RETURN_WHITE_HOLD_DELAY_MS),
        window.setTimeout(() => {
          setDreamTransition((transition) => {
            if (transition.phase === 'idle') return transition;
            return {
              ...transition,
              phase: 'revealing',
            };
          });
        }, CORRIDOR_RETURN_REVEAL_DELAY_MS),
        window.setTimeout(() => {
          setDreamTransition(createIdleDreamTransitionState());
          clearDreamTransitionTimers();
        }, CORRIDOR_RETURN_FINISH_DELAY_MS),
      ];

      return {
        phase: 'rippling',
        x: (window.innerWidth || 1) * 0.5,
        y: (window.innerHeight || 1) * 0.5,
        key: current.key + 1,
        snapshotCanvas: null,
        mode: 'white-fade',
        revealDurationMs: CORRIDOR_RETURN_FINISH_DELAY_MS - CORRIDOR_RETURN_REVEAL_DELAY_MS,
        whiteFillStartMs: CORRIDOR_RETURN_WHITE_FILL_START_MS,
        whiteFillDurationMs: CORRIDOR_RETURN_WHITE_FILL_DURATION_MS,
      };
    });
  }

  function enterProject(projectId, corridorState) {
    setActiveProjectId(projectId);
    setCorridorReturnState(corridorState ?? null);
    setView('project');
  }

  function wakeUp() {
    clearDreamTransitionTimers();
    setWakeSignal((signal) => signal + 1);
    setCorridorSmokePreset(null);
    setCorridorReturnState(null);
    setView('home');
    setDreamTransition(createIdleDreamTransitionState());
  }

  let content = (
    <Home
      wakeSignal={wakeSignal}
      onEnterDream={startDreamEntryTransition}
      onEnterSteamLab={() => setView('steam-lab')}
      sceneCaptureRef={homeSceneCaptureRef}
    />
  );

  if (view === 'corridor') {
    content = (
      <DreamCorridor
        initialState={corridorReturnState}
        smokePreset={corridorSmokePreset}
        onConsumeSmokePreset={() => setCorridorSmokePreset(null)}
        onEnterProject={enterProject}
        onWakeUp={wakeUp}
      />
    );
  }

  if (view === 'project') {
    content = (
      <ProjectDream
        project={activeProject}
        onBackToCorridor={startCorridorReturnTransition}
        onWakeUp={wakeUp}
      />
    );
  }

  if (view === 'steam-lab') {
    content = (
      <SteamLab
        onBack={() => setView('home')}
        onApplyToCorridor={(settings) => {
          setCorridorSmokePreset(settings ?? null);
          setCorridorReturnState(null);
          setView('corridor');
        }}
      />
    );
  }

  return (
    <>
      <Suspense fallback={<main className="page-shell page-shell--locked" aria-busy="true" />}>
        {content}
      </Suspense>

      {dreamTransition.phase !== 'idle' && (
        <DreamTransitionOverlay
          mode={dreamTransition.mode ?? 'ripple'}
          phase={dreamTransition.phase}
          transitionKey={dreamTransition.key}
          snapshotCanvas={dreamTransition.snapshotCanvas}
          origin={{ x: dreamTransition.x, y: dreamTransition.y }}
          revealDurationMs={dreamTransition.revealDurationMs ?? (DREAM_TRANSITION_FINISH_DELAY_MS - DREAM_TRANSITION_REVEAL_DELAY_MS)}
          whiteFillStartMs={dreamTransition.whiteFillStartMs ?? undefined}
          whiteFillDurationMs={dreamTransition.whiteFillDurationMs ?? undefined}
        />
      )}

      {showRotateTip && (
        <div className="rotate-tip-overlay" role="dialog" aria-modal="true" aria-label="??????">
          <div className="rotate-tip-panel">
            <div className="rotate-tip-icon" aria-hidden="true">
              <span className="rotate-tip-phone">
                <span className="rotate-tip-phone-screen" />
              </span>
            </div>
            <div className="rotate-tip-copy">
              <p className="rotate-tip-title">?????</p>
              <p className="rotate-tip-subtitle">????????</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
