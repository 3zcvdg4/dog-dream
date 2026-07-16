import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import Home, {
  HOME_DREAM_BUBBLE_IMAGE_URL,
  HOME_INTRO_VIDEO_SOURCES,
  HOME_SLEEP_VIDEO_SOURCES,
  HOME_WAKE_VIDEO_SOURCES,
  preloadHomeVideo,
} from './pages/Home.jsx';
import { ABOUT_LANYARD_INTRO_URL, preloadAboutLanyardAssets } from './components/AboutLanyard.jsx';
import DreamTransitionOverlay from './components/DreamTransitionOverlay.jsx';
import LoadingPercent from './components/LoadingPercent.jsx';
import SiteNav from './components/SiteNav.jsx';
import { projects } from './data/projects.js';
import { getProjectContent } from './data/projectContents/index.js';

const DreamCorridor = lazy(() => import('./pages/DreamCorridor.jsx'));
const ProjectDream = lazy(() => import('./pages/ProjectDream.jsx'));
const SteamLab = lazy(() => import('./pages/SteamLab.jsx'));

const DESKTOP_BREAKPOINT = 1025;
const TRANSITION_WHITE_BACKGROUND = '#f7f6f2';
const DREAM_TRANSITION_WHITE_HOLD_DELAY_MS = 2760;
const DREAM_TRANSITION_SWITCH_DELAY_MS = 2920;
const DREAM_TRANSITION_REVEAL_DELAY_MS = 3040;
const DREAM_TRANSITION_FINISH_DELAY_MS = 5050;
const PROJECT_ENTRY_WHITE_HOLD_DELAY_MS = 560;
const PROJECT_ENTRY_SWITCH_DELAY_MS = 720;
const PROJECT_ENTRY_REVEAL_DELAY_MS = 1180;
const PROJECT_ENTRY_FINISH_DELAY_MS = 1960;
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
const FOCUS_CARD_BACKGROUND_URL = '/assets/Card Background-2.png';
const HOME_PRELOAD_IMAGE_URLS = [
  '/assets/Cushion.png',
  HOME_DREAM_BUBBLE_IMAGE_URL,
  ABOUT_LANYARD_INTRO_URL,
];
const HOME_PRELOAD_VIDEO_URLS = [HOME_INTRO_VIDEO_SOURCES];
const HOME_IDLE_VIDEO_URLS = [HOME_WAKE_VIDEO_SOURCES, HOME_SLEEP_VIDEO_SOURCES];

function resolveProjectNavTheme(projectId) {
  const layout = getProjectContent(projectId)?.layout;
  if (layout === 'project-02-ortur') return 'ortur';
  if (layout === 'project-03-parallax') return 'ortur';
  if (layout === 'project-04-seer') return 'seer';
  if (layout === 'project-01-editorial') return 'editorial';
  return 'light';
}
const HOME_LOADING_MIN_DURATION_MS = 180;
const ROUTE_HOME = 'home';
const ROUTE_CORRIDOR = 'corridor';
const ROUTE_PROJECT = 'project';
const ROUTE_STEAM_LAB = 'steam-lab';

const projectById = new Map(projects.map((project) => [project.id, project]));
const projectBySlug = new Map(projects.map((project) => [project.slug ?? project.id, project]));

const preloadedDreamImages = new Set();
const preloadedImagePromises = new Map();

function normalizeRoutePath(pathname) {
  const normalizedPath = pathname && pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';

  if (normalizedPath === '/corridor') {
    return { view: ROUTE_CORRIDOR };
  }

  if (normalizedPath === '/steam-lab') {
    return { view: ROUTE_STEAM_LAB };
  }

  const projectMatch = normalizedPath.match(/^\/project\/([^/]+)$/);
  if (projectMatch) {
    return { view: ROUTE_PROJECT, projectSlug: decodeURIComponent(projectMatch[1]) };
  }

  return { view: ROUTE_HOME };
}

function buildPathForView(view, projectId) {
  if (view === ROUTE_CORRIDOR) return '/corridor';
  if (view === ROUTE_STEAM_LAB) return '/steam-lab';
  if (view === ROUTE_PROJECT && projectId) {
    const project = projectById.get(projectId);
    const projectSlug = project?.slug ?? projectId;
    return `/project/${encodeURIComponent(projectSlug)}`;
  }
  return '/';
}

function readRouteFromLocation() {
  if (typeof window === 'undefined') {
    return { view: ROUTE_HOME, projectId: projects[0].id };
  }

  const route = normalizeRoutePath(window.location.pathname);
  const resolvedProject = route.projectSlug
    ? projectBySlug.get(route.projectSlug) ?? projectById.get(route.projectSlug)
    : null;

  return {
    view: route.view,
    projectId: resolvedProject?.id ?? projects[0].id,
  };
}

function preloadHomeImage(url) {
  if (typeof window === 'undefined' || !url) {
    return Promise.resolve();
  }

  if (preloadedImagePromises.has(url)) {
    return preloadedImagePromises.get(url);
  }

  const promise = new Promise((resolve) => {
    const image = new window.Image();
    image.decoding = 'async';
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  });

  preloadedImagePromises.set(url, promise);
  return promise;
}

async function preloadHomeExperience(onProgress) {
  const tasks = [
    ...HOME_PRELOAD_IMAGE_URLS.map((url) => () => preloadHomeImage(url)),
    ...HOME_PRELOAD_VIDEO_URLS.map((url) => () => preloadHomeVideo(url)),
    () => {
      preloadAboutLanyardAssets();
      return Promise.resolve();
    },
  ];
  const total = Math.max(tasks.length, 1);
  let completed = 0;

  onProgress?.(0);

  await Promise.all(tasks.map(async (task) => {
    await task();
    completed += 1;
    onProgress?.(completed / total);
  }));
}

function preloadImageAsset(url) {
  if (typeof window === 'undefined' || !url || preloadedDreamImages.has(url)) return;

  void preloadHomeImage(url);
  preloadedDreamImages.add(url);
}

function warmHomeFollowupVideos() {
  HOME_IDLE_VIDEO_URLS.forEach((url) => {
    void preloadHomeVideo(url);
  });
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
    module.preloadCorridorTextures?.({ includePosters: false });
  });
  void import('./pages/ProjectDream.jsx');
  void import('./pages/SteamLab.jsx');
}

async function preloadCorridorExperience() {
  const corridorModulePromise = import('./pages/DreamCorridor.jsx').then((module) => {
    module.preloadCorridorTextures?.({ includePosters: true });
    return module;
  });

  await Promise.all([
    corridorModulePromise,
    ...DREAM_CORRIDOR_TEXTURES.map((url) => preloadHomeImage(url)),
    ...DREAM_CORRIDOR_POSTERS.map((url) => preloadHomeImage(url)),
    preloadHomeImage(FOCUS_CARD_BACKGROUND_URL),
  ]);
}

function preloadDreamAssets() {
  DREAM_CORRIDOR_TEXTURES.forEach(preloadImageAsset);
  preloadImageAsset(FOCUS_CARD_BACKGROUND_URL);
}

async function preloadProjectExperience(projectId) {
  const targetProject = projects.find((project) => project.id === projectId);

  if (targetProject?.imageUrl) {
    preloadImageAsset(targetProject.imageUrl);
  }

  await import('./pages/ProjectDream.jsx').then((module) => {
    module.preloadProjectExperience?.(projectId);
  });
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
  const initialRoute = useMemo(() => readRouteFromLocation(), []);
  const [view, setView] = useState(initialRoute.view);
  const [wakeSignal, setWakeSignal] = useState(0);
  const [homeEntryMode, setHomeEntryMode] = useState(initialRoute.view === ROUTE_HOME ? 'loading' : 'resume');
  const [homeReady, setHomeReady] = useState(initialRoute.view !== ROUTE_HOME);
  const [homeLoadingProgress, setHomeLoadingProgress] = useState(initialRoute.view === ROUTE_HOME ? 0 : 1);
  const [introAboutDismissed, setIntroAboutDismissed] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(initialRoute.projectId);
  const [corridorReturnState, setCorridorReturnState] = useState(null);
  const [corridorSmokePreset, setCorridorSmokePreset] = useState(null);
  const [showRotateTip, setShowRotateTip] = useState(() => shouldShowRotateTip());
  const [dreamTransition, setDreamTransition] = useState(() => createIdleDreamTransitionState());
  const dreamTransitionTimersRef = useRef([]);
  const dreamTransitionRunIdRef = useRef(0);
  const homeSceneCaptureRef = useRef(null);
  const routeSyncRef = useRef(false);

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
    if (view !== ROUTE_HOME || homeReady) return undefined;

    let cancelled = false;
    const startedAt = performance.now();
    setIntroAboutDismissed(false);
    setHomeLoadingProgress(0);

    preloadHomeExperience((progress) => {
      if (cancelled) return;
      setHomeLoadingProgress(progress);
    }).then(() => {
      const remaining = Math.max(0, HOME_LOADING_MIN_DURATION_MS - (performance.now() - startedAt));
      window.setTimeout(() => {
        if (cancelled) return;
        setHomeLoadingProgress(1);
        setHomeReady(true);
        setHomeEntryMode('intro');
      }, remaining);
    });

    return () => {
      cancelled = true;
    };
  }, [homeReady, view]);

  useEffect(() => {
    if (view === ROUTE_HOME || introAboutDismissed) return;
    setIntroAboutDismissed(true);
  }, [introAboutDismissed, view]);

  useEffect(() => {
    if (view !== ROUTE_HOME) return undefined;

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        preloadDreamPages();
      }, { timeout: 1200 });

      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(() => {
      preloadDreamPages();
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [view]);

  useEffect(() => {
    if (view !== ROUTE_HOME || !homeReady) return undefined;

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        warmHomeFollowupVideos();
      }, { timeout: 1200 });

      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(() => {
      warmHomeFollowupVideos();
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [homeReady, view]);

  useEffect(() => {
    const path = buildPathForView(view, activeProjectId);

    if (window.location.pathname === path) {
      routeSyncRef.current = false;
      return;
    }

    const nextState = {
      view,
      projectId: activeProjectId,
    };

    if (routeSyncRef.current) {
      window.history.replaceState(nextState, '', path);
    } else {
      window.history.pushState(nextState, '', path);
    }

    routeSyncRef.current = false;
  }, [activeProjectId, view]);

  useEffect(() => {
    function handlePopState() {
      routeSyncRef.current = true;
      const route = readRouteFromLocation();

      setActiveProjectId(route.projectId);
      setCorridorSmokePreset(null);
      setCorridorReturnState(null);
      clearDreamTransitionTimers();
      setDreamTransition(createIdleDreamTransitionState());

      if (route.view === ROUTE_HOME) {
        setHomeReady(true);
        setHomeEntryMode('resume');
        setHomeLoadingProgress(1);
      }

      setView(route.view);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => () => {
    dreamTransitionTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    dreamTransitionTimersRef.current = [];
  }, []);

  function clearDreamTransitionTimers() {
    dreamTransitionRunIdRef.current += 1;
    dreamTransitionTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    dreamTransitionTimersRef.current = [];
  }

  function waitForTransitionDelay(ms, runId) {
    return new Promise((resolve) => {
      if (ms <= 0) {
        resolve();
        return;
      }

      const timerId = window.setTimeout(() => {
        if (dreamTransitionRunIdRef.current === runId) {
          resolve();
        }
      }, ms);

      dreamTransitionTimersRef.current.push(timerId);
    });
  }

  async function startDreamEntryTransition(origin) {
    if (dreamTransition.phase !== 'idle') return;

    const viewportWidth = window.innerWidth || 1;
    const viewportHeight = window.innerHeight || 1;
    const x = Number.isFinite(origin?.x) ? origin.x : viewportWidth / 2;
    const y = Number.isFinite(origin?.y) ? origin.y : viewportHeight / 2;
    const useSimpleTransition = viewportWidth < 900 || viewportHeight < 900;

    clearDreamTransitionTimers();
    const transitionRunId = dreamTransitionRunIdRef.current;
    const corridorReadyPromise = preloadCorridorExperience().catch(() => undefined);
    preloadDreamPages();

    let snapshotCanvas = null;

    if (!useSimpleTransition) {
      try {
        snapshotCanvas = await captureTransitionSnapshot(homeSceneCaptureRef.current);
      } catch (error) {
        console.warn('[dogdream] Dream transition snapshot failed.', error);
        return;
      }
    }

    const transitionTiming = useSimpleTransition
      ? {
          switchDelayMs: 520,
          whiteHoldDelayMs: 180,
          revealDelayMs: 260,
          finishDelayMs: 760,
          revealDurationMs: 280,
          whiteFillStartMs: 0,
          whiteFillDurationMs: 220,
        }
      : {
          switchDelayMs: DREAM_TRANSITION_SWITCH_DELAY_MS,
          whiteHoldDelayMs: DREAM_TRANSITION_WHITE_HOLD_DELAY_MS,
          revealDelayMs: DREAM_TRANSITION_REVEAL_DELAY_MS,
          finishDelayMs: DREAM_TRANSITION_FINISH_DELAY_MS,
          revealDurationMs: DREAM_TRANSITION_FINISH_DELAY_MS - DREAM_TRANSITION_REVEAL_DELAY_MS,
          whiteFillStartMs: undefined,
          whiteFillDurationMs: undefined,
        };

    setDreamTransition((current) => {
      if (current.phase !== 'idle') return current;

      return {
        phase: 'rippling',
        x,
        y,
        key: current.key + 1,
        snapshotCanvas,
        mode: useSimpleTransition ? 'white-fade' : 'ripple',
        revealDurationMs: transitionTiming.revealDurationMs,
        whiteFillStartMs: transitionTiming.whiteFillStartMs,
        whiteFillDurationMs: transitionTiming.whiteFillDurationMs,
      };
    });

    void (async () => {
      await waitForTransitionDelay(transitionTiming.whiteHoldDelayMs, transitionRunId);
      if (dreamTransitionRunIdRef.current !== transitionRunId) return;

      setDreamTransition((transition) => {
        if (transition.phase === 'idle') return transition;
        return {
          ...transition,
          phase: 'white-hold',
        };
      });

      await Promise.all([
        waitForTransitionDelay(transitionTiming.switchDelayMs - transitionTiming.whiteHoldDelayMs, transitionRunId),
        corridorReadyPromise,
      ]);
      if (dreamTransitionRunIdRef.current !== transitionRunId) return;

      setCorridorSmokePreset(null);
      setCorridorReturnState(null);
      setView('corridor');

      await waitForTransitionDelay(transitionTiming.revealDelayMs - transitionTiming.switchDelayMs, transitionRunId);
      if (dreamTransitionRunIdRef.current !== transitionRunId) return;

      setDreamTransition((transition) => {
        if (transition.phase === 'idle') return transition;
        return {
          ...transition,
          phase: 'revealing',
        };
      });

      await waitForTransitionDelay(transitionTiming.finishDelayMs - transitionTiming.revealDelayMs, transitionRunId);
      if (dreamTransitionRunIdRef.current !== transitionRunId) return;

      setDreamTransition(createIdleDreamTransitionState());
      clearDreamTransitionTimers();
    })();
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

  async function startProjectEntryTransition(projectId, corridorState, origin) {
    if (dreamTransition.phase !== 'idle') return;

    const viewportWidth = window.innerWidth || 1;
    const viewportHeight = window.innerHeight || 1;
    const transitionOrigin = {
      x: Number.isFinite(origin?.x) ? origin.x : viewportWidth * 0.5,
      y: Number.isFinite(origin?.y) ? origin.y : viewportHeight * 0.5,
    };

    clearDreamTransitionTimers();
    const transitionRunId = dreamTransitionRunIdRef.current;
    const projectReadyPromise = preloadProjectExperience(projectId).catch(() => undefined);

    setDreamTransition((current) => {
      if (current.phase !== 'idle') return current;

      return {
        phase: 'rippling',
        x: transitionOrigin.x,
        y: transitionOrigin.y,
        key: current.key + 1,
        snapshotCanvas: null,
        mode: 'radial-white',
        revealDurationMs: PROJECT_ENTRY_FINISH_DELAY_MS - PROJECT_ENTRY_REVEAL_DELAY_MS,
        whiteFillStartMs: 0,
        whiteFillDurationMs: PROJECT_ENTRY_SWITCH_DELAY_MS,
      };
    });

    void (async () => {
      await waitForTransitionDelay(PROJECT_ENTRY_WHITE_HOLD_DELAY_MS, transitionRunId);
      if (dreamTransitionRunIdRef.current !== transitionRunId) return;

      setDreamTransition((transition) => {
        if (transition.phase === 'idle') return transition;
        return {
          ...transition,
          phase: 'white-hold',
        };
      });

      await Promise.all([
        waitForTransitionDelay(PROJECT_ENTRY_SWITCH_DELAY_MS - PROJECT_ENTRY_WHITE_HOLD_DELAY_MS, transitionRunId),
        projectReadyPromise,
      ]);
      if (dreamTransitionRunIdRef.current !== transitionRunId) return;

      setActiveProjectId(projectId);
      setCorridorReturnState(corridorState ?? null);
      setView(ROUTE_PROJECT);

      await waitForTransitionDelay(PROJECT_ENTRY_REVEAL_DELAY_MS - PROJECT_ENTRY_SWITCH_DELAY_MS, transitionRunId);
      if (dreamTransitionRunIdRef.current !== transitionRunId) return;

      setDreamTransition((transition) => {
        if (transition.phase === 'idle') return transition;
        return {
          ...transition,
          phase: 'revealing',
        };
      });

      await waitForTransitionDelay(PROJECT_ENTRY_FINISH_DELAY_MS - PROJECT_ENTRY_REVEAL_DELAY_MS, transitionRunId);
      if (dreamTransitionRunIdRef.current !== transitionRunId) return;

      setDreamTransition(createIdleDreamTransitionState());
      clearDreamTransitionTimers();
    })();
  }

  function wakeUp() {
    clearDreamTransitionTimers();
    setWakeSignal((signal) => signal + 1);
    setHomeReady(true);
    setHomeEntryMode('wake');
    setHomeLoadingProgress(1);
    setCorridorSmokePreset(null);
    setCorridorReturnState(null);
    setView(ROUTE_HOME);
    setDreamTransition(createIdleDreamTransitionState());
  }

  function navigateHomeFromNav() {
    if (view === ROUTE_HOME) return;
    wakeUp();
  }

  function openProjectFromNav(projectId) {
    if (!projectId || (projectId === activeProjectId && view === ROUTE_PROJECT)) {
      return;
    }

    clearDreamTransitionTimers();
    setCorridorSmokePreset(null);
    setCorridorReturnState(null);
    setActiveProjectId(projectId);
    setView(ROUTE_PROJECT);
    setDreamTransition(createIdleDreamTransitionState());
  }

  let content = (
    homeReady ? (
      <Home
        wakeSignal={wakeSignal}
        homeEntryMode={homeEntryMode}
        playbackBlocked={homeEntryMode === 'intro' && !introAboutDismissed}
        onEnterDream={startDreamEntryTransition}
        onEnterSteamLab={() => setView(ROUTE_STEAM_LAB)}
        sceneCaptureRef={homeSceneCaptureRef}
      />
    ) : (
      <main className="home-loading page-shell page-shell--locked" aria-busy="true" aria-live="polite">
        <div
          className="home-loading__stage"
          style={{
            '--loading-progress': Math.max(0, Math.min(1, homeLoadingProgress)),
          }}
        >
          <LoadingPercent
            className="home-loading__percent"
            progress={homeLoadingProgress}
          />
          <div className="home-loading__track-wrap">
            <div
              className="home-loading__progress-shell"
              role="progressbar"
              aria-label="Loading"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={Math.round(homeLoadingProgress * 100)}
            >
              <span className="home-loading__progress-rail" />
              <span
                className="home-loading__progress-fill"
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, homeLoadingProgress))})` }}
              />
              <span className="home-loading__progress-sheen" />
            </div>
          </div>
          <p className="home-loading__label">Loading...</p>
        </div>
      </main>
    )
  );

  if (view === ROUTE_CORRIDOR) {
    content = (
      <DreamCorridor
        initialState={corridorReturnState}
        smokePreset={corridorSmokePreset}
        onConsumeSmokePreset={() => setCorridorSmokePreset(null)}
        onEnterProject={startProjectEntryTransition}
        onWakeUp={wakeUp}
      />
    );
  }

  if (view === ROUTE_PROJECT) {
    content = (
      <ProjectDream
        key={activeProject.id}
        project={activeProject}
        dreamLayoutReady={dreamTransition.phase === 'idle'}
        onBackToCorridor={startCorridorReturnTransition}
        onWakeUp={wakeUp}
      />
    );
  }

  if (view === ROUTE_STEAM_LAB) {
    content = (
      <SteamLab
        onBack={() => setView(ROUTE_HOME)}
        onApplyToCorridor={(settings) => {
          setCorridorSmokePreset(settings ?? null);
          setCorridorReturnState(null);
          setView(ROUTE_CORRIDOR);
        }}
      />
    );
  }

  return (
    <>
      {dreamTransition.phase === 'idle' && !showRotateTip && view === ROUTE_HOME && homeReady ? (
        <SiteNav
          variant="home"
          autoOpenAbout={homeEntryMode === 'intro' && !introAboutDismissed}
          onIntroAboutDismissed={() => setIntroAboutDismissed(true)}
          onHome={navigateHomeFromNav}
          onOpenProject={openProjectFromNav}
        />
      ) : null}

      {dreamTransition.phase === 'idle' && !showRotateTip && view === ROUTE_CORRIDOR ? (
        <SiteNav
          variant="corridor"
          onHome={navigateHomeFromNav}
          onOpenProject={openProjectFromNav}
        />
      ) : null}

      {dreamTransition.phase === 'idle' && !showRotateTip && view === ROUTE_PROJECT ? (
        <SiteNav
          variant="detail"
          theme={resolveProjectNavTheme(activeProjectId)}
          currentProjectId={activeProjectId}
          onHome={navigateHomeFromNav}
          onOpenProject={openProjectFromNav}
          onBackToCorridor={startCorridorReturnTransition}
          onWakeUp={wakeUp}
        />
      ) : null}

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
        <div className="rotate-tip-overlay" role="dialog" aria-modal="true" aria-label="请旋转屏幕">
          <div className="rotate-tip-panel">
            <div className="rotate-tip-icon" aria-hidden="true">
              <span className="rotate-tip-phone">
                <span className="rotate-tip-phone-screen" />
              </span>
            </div>
            <div className="rotate-tip-copy">
              <p className="rotate-tip-title">请旋转屏幕</p>
              <p className="rotate-tip-subtitle">横屏体验更佳，便于阅读和操作</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
