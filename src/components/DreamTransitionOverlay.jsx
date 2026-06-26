import { useEffect, useRef } from 'react';

const RIPPLE_SPREAD_DURATION_MS = 5080;
const DEFAULT_WHITE_FILL_START_MS = 120;
const DEFAULT_WHITE_FILL_DURATION_MS = 2550;
const RIPPLE_TILE_SIZE = 6;
const RIPPLE_LAYERS = [
  {
    delayMs: 0,
    frontWidth: 128,
    trailWidth: 224,
    pushStrength: 24,
    pullStrength: 9.2,
    glowAlpha: 0.16,
    speedMultiplier: 0.72,
  },
  {
    delayMs: 760,
    frontWidth: 118,
    trailWidth: 208,
    pushStrength: 20.5,
    pullStrength: 8.2,
    glowAlpha: 0.14,
    speedMultiplier: 0.84,
  },
  {
    delayMs: 1480,
    frontWidth: 108,
    trailWidth: 186,
    pushStrength: 18,
    pullStrength: 7.8,
    glowAlpha: 0.12,
    speedMultiplier: 0.94,
  },
  {
    delayMs: 2440,
    frontWidth: 102,
    trailWidth: 174,
    pushStrength: 14,
    pullStrength: 6.4,
    glowAlpha: 0.10,
    speedMultiplier: 1,
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - ((1 - value) ** 3);
}

function easeInOutSine(value) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function easeInCubic(value) {
  return value ** 3;
}

function computeRadialWhiteState(elapsedMs, whiteFillStartMs, whiteFillDurationMs, holdTargetRadius) {
  const fillProgress = clamp(
    (elapsedMs - whiteFillStartMs) / Math.max(whiteFillDurationMs, 1),
    0,
    1,
  );
  const easedProgress = easeInOutSine(fillProgress);

  return {
    radius: Math.max(48, holdTargetRadius * easedProgress),
    whiteOpacity: 0.16 + easedProgress * 0.84,
    glowOpacity: 0.3 - easedProgress * 0.24,
    glowScale: 0.8 + easedProgress * 0.28,
  };
}

function computeWhiteOpacity(elapsedMs, whiteFillStartMs, whiteFillDurationMs) {
  const fillProgress = clamp(
    (elapsedMs - whiteFillStartMs) / whiteFillDurationMs,
    0,
    1,
  );

  return easeInOutSine(fillProgress);
}

function buildActiveRipples(elapsedMs, maxRadius, scale) {
  return RIPPLE_LAYERS
    .map((layer) => {
      const progress = clamp((elapsedMs - layer.delayMs) / RIPPLE_SPREAD_DURATION_MS, 0, 1);
      const radiusProgress = clamp(progress * (layer.speedMultiplier ?? 1), 0, 1);

      if (progress <= 0) return null;

      return {
        radius: maxRadius * easeOutCubic(radiusProgress),
        frontWidth: layer.frontWidth * scale,
        trailWidth: layer.trailWidth * scale,
        pushStrength: layer.pushStrength * scale * (1 - progress * 0.18),
        pullStrength: layer.pullStrength * scale * (1 - progress * 0.12),
        glowAlpha: layer.glowAlpha * (1 - progress * 0.15),
      };
    })
    .filter(Boolean);
}

function drawRippleGlow(ctx, originX, originY, ripple) {
  const { radius, frontWidth, glowAlpha } = ripple;

  if (glowAlpha <= 0 || radius <= 0) return;

  const gradient = ctx.createRadialGradient(
    originX,
    originY,
    Math.max(0, radius - frontWidth * 0.9),
    originX,
    originY,
    radius + frontWidth,
  );

  gradient.addColorStop(0, 'rgba(255, 254, 252, 0)');
  gradient.addColorStop(0.68, `rgba(255, 254, 252, ${glowAlpha * 0.2})`);
  gradient.addColorStop(0.82, `rgba(255, 254, 252, ${glowAlpha})`);
  gradient.addColorStop(1, 'rgba(255, 254, 252, 0)');

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(originX, originY, radius + frontWidth, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function computeRippleDisplacement(delta, ripple) {
  if (delta < -ripple.trailWidth || delta > ripple.frontWidth) {
    return 0;
  }

  if (delta <= 0) {
    const trailingProgress = Math.abs(delta) / ripple.trailWidth;
    return ripple.pushStrength * (Math.cos(trailingProgress * Math.PI * 0.5) ** 2);
  }

  const leadingProgress = delta / ripple.frontWidth;
  return -ripple.pullStrength * (Math.cos(leadingProgress * Math.PI * 0.5) ** 2);
}

function drawRippleFrame(ctx, sourceCanvas, metrics) {
  const { originX, originY, elapsedMs } = metrics;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const viewportWidth = Math.max(window.innerWidth, 1);
  const viewportHeight = Math.max(window.innerHeight, 1);
  const scaleX = width / viewportWidth;
  const scaleY = height / viewportHeight;
  const scale = (scaleX + scaleY) * 0.5;
  const maxRadius = Math.hypot(
    Math.max(originX, width - originX),
    Math.max(originY, height - originY),
  );
  const tileSize = Math.max(4, Math.round(RIPPLE_TILE_SIZE * scale));
  const activeRipples = buildActiveRipples(elapsedMs, maxRadius, scale);

  if (activeRipples.length === 0) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(sourceCanvas, 0, 0, width, height);
    return;
  }

  const furthestRipple = activeRipples[activeRipples.length - 1];
  const widestFront = Math.max(...activeRipples.map((ripple) => ripple.frontWidth));
  const widestTrail = Math.max(...activeRipples.map((ripple) => ripple.trailWidth));
  const minX = clamp(Math.floor((originX - furthestRipple.radius - widestTrail) / tileSize) * tileSize, 0, width);
  const maxX = clamp(Math.ceil((originX + furthestRipple.radius + widestFront) / tileSize) * tileSize, 0, width);
  const minY = clamp(Math.floor((originY - furthestRipple.radius - widestTrail) / tileSize) * tileSize, 0, height);
  const maxY = clamp(Math.ceil((originY + furthestRipple.radius + widestFront) / tileSize) * tileSize, 0, height);

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  for (let y = minY; y < maxY; y += tileSize) {
    for (let x = minX; x < maxX; x += tileSize) {
      const sampleWidth = Math.min(tileSize, width - x);
      const sampleHeight = Math.min(tileSize, height - y);
      const centerX = x + sampleWidth * 0.5;
      const centerY = y + sampleHeight * 0.5;
      const offsetX = centerX - originX;
      const offsetY = centerY - originY;
      const distance = Math.hypot(offsetX, offsetY);

      if (distance < 0.0001) continue;

      const normalX = offsetX / distance;
      const normalY = offsetY / distance;
      let displacement = 0;

      for (const ripple of activeRipples) {
        const delta = distance - ripple.radius;
        displacement += computeRippleDisplacement(delta, ripple);
      }

      if (Math.abs(displacement) < 0.1) continue;

      const sourceX = clamp(x - normalX * displacement, 0, Math.max(0, width - sampleWidth));
      const sourceY = clamp(y - normalY * displacement, 0, Math.max(0, height - sampleHeight));

      ctx.drawImage(
        sourceCanvas,
        sourceX,
        sourceY,
        sampleWidth,
        sampleHeight,
        x,
        y,
        sampleWidth,
        sampleHeight,
      );
    }
  }

  activeRipples.forEach((ripple) => {
    drawRippleGlow(ctx, originX, originY, ripple);
  });
}

export default function DreamTransitionOverlay({
  mode = 'ripple',
  phase,
  transitionKey,
  snapshotCanvas,
  origin,
  revealDurationMs = 560,
  whiteFillStartMs = DEFAULT_WHITE_FILL_START_MS,
  whiteFillDurationMs = DEFAULT_WHITE_FILL_DURATION_MS,
}) {
  const canvasRef = useRef(null);
  const whiteLayerRef = useRef(null);
  const glowLayerRef = useRef(null);
  const animationFrameRef = useRef(0);
  const startedAtRef = useRef(0);
  const revealStartedAtRef = useRef(null);
  const latestPhaseRef = useRef(phase);

  useEffect(() => {
    latestPhaseRef.current = phase;

    if (phase === 'revealing') {
      revealStartedAtRef.current = performance.now();
    }
    if (phase !== 'revealing') {
      revealStartedAtRef.current = null;
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const whiteLayer = whiteLayerRef.current;
    const glowLayer = glowLayerRef.current;
    if (!canvas || !whiteLayer || !glowLayer) return undefined;

    canvas.style.opacity = '1';
    whiteLayer.style.opacity = '0';
    whiteLayer.style.clipPath = '';
    whiteLayer.style.webkitClipPath = '';
    whiteLayer.style.maskImage = '';
    whiteLayer.style.webkitMaskImage = '';
    glowLayer.style.opacity = '0';

    if (mode === 'white-fade') {
      canvas.style.opacity = '0';
      canvas.width = Math.max(window.innerWidth, 1);
      canvas.height = Math.max(window.innerHeight, 1);
      startedAtRef.current = performance.now();
      revealStartedAtRef.current = null;

      function renderWhiteFadeFrame(now) {
        const currentPhase = latestPhaseRef.current;
        const rawElapsedMs = now - startedAtRef.current;

        if (currentPhase === 'revealing') {
          if (revealStartedAtRef.current === null) {
            revealStartedAtRef.current = now;
          }

          const revealProgress = clamp(
            (now - revealStartedAtRef.current) / revealDurationMs,
            0,
            1,
          );

          whiteLayer.style.opacity = `${1 - easeInCubic(revealProgress)}`;
        } else if (currentPhase === 'white-hold') {
          whiteLayer.style.opacity = '1';
        } else {
          whiteLayer.style.opacity = `${computeWhiteOpacity(rawElapsedMs, whiteFillStartMs, whiteFillDurationMs)}`;
        }

        animationFrameRef.current = window.requestAnimationFrame(renderWhiteFadeFrame);
      }

      animationFrameRef.current = window.requestAnimationFrame(renderWhiteFadeFrame);

      return () => {
        window.cancelAnimationFrame(animationFrameRef.current);
      };
    }

    if (mode === 'radial-white') {
      canvas.style.opacity = '0';
      canvas.width = Math.max(window.innerWidth, 1);
      canvas.height = Math.max(window.innerHeight, 1);
      startedAtRef.current = performance.now();
      revealStartedAtRef.current = null;

      const viewportWidth = Math.max(window.innerWidth, 1);
      const viewportHeight = Math.max(window.innerHeight, 1);
      const originX = clamp(origin.x, 0, viewportWidth);
      const originY = clamp(origin.y, 0, viewportHeight);
      const maxRadius = Math.hypot(
        Math.max(originX, viewportWidth - originX),
        Math.max(originY, viewportHeight - originY),
      ) + 160;

      whiteLayer.style.setProperty('--dream-transition-origin-x', `${originX}px`);
      whiteLayer.style.setProperty('--dream-transition-origin-y', `${originY}px`);

      function applySpread(radius, whiteOpacity, glowOpacity, glowScale = 1) {
        const diameter = Math.max(radius * 2 * glowScale, 72);
        const featherRadius = clamp(radius * 0.32, 120, 320);
        const coreRadius = Math.max(0, radius - featherRadius * 0.92);
        const outerRadius = radius + featherRadius * 0.96;
        const maskValue = `radial-gradient(circle at ${originX}px ${originY}px, rgba(0, 0, 0, 0.94) 0px, rgba(0, 0, 0, 0.94) ${coreRadius}px, rgba(0, 0, 0, 0.82) ${coreRadius + featherRadius * 0.18}px, rgba(0, 0, 0, 0.58) ${coreRadius + featherRadius * 0.42}px, rgba(0, 0, 0, 0.3) ${coreRadius + featherRadius * 0.66}px, rgba(0, 0, 0, 0.12) ${coreRadius + featherRadius * 0.86}px, rgba(0, 0, 0, 0) ${outerRadius}px)`;

        whiteLayer.style.opacity = `${whiteOpacity}`;
        whiteLayer.style.clipPath = 'none';
        whiteLayer.style.webkitClipPath = 'none';
        whiteLayer.style.maskImage = maskValue;
        whiteLayer.style.webkitMaskImage = maskValue;

        glowLayer.style.opacity = `${glowOpacity}`;
        glowLayer.style.left = `${originX}px`;
        glowLayer.style.top = `${originY}px`;
        glowLayer.style.width = `${diameter}px`;
        glowLayer.style.height = `${diameter}px`;
      }

      function renderRadialFrame(now) {
        const currentPhase = latestPhaseRef.current;
        const rawElapsedMs = now - startedAtRef.current;
        const holdTargetRadius = maxRadius + 220;
        const radialState = computeRadialWhiteState(
          rawElapsedMs,
          whiteFillStartMs,
          whiteFillDurationMs,
          holdTargetRadius,
        );

        if (currentPhase === 'revealing') {
          if (revealStartedAtRef.current === null) {
            revealStartedAtRef.current = now;
          }

          const revealProgress = clamp(
            (now - revealStartedAtRef.current) / revealDurationMs,
            0,
            1,
          );
          const easedReveal = easeInOutSine(revealProgress);
          const opacity = 1 - easedReveal;

          applySpread(holdTargetRadius, opacity, opacity * 0.14, 1.08);
        } else {
          applySpread(
            radialState.radius,
            radialState.whiteOpacity,
            radialState.glowOpacity,
            radialState.glowScale,
          );
        }

        animationFrameRef.current = window.requestAnimationFrame(renderRadialFrame);
      }

      animationFrameRef.current = window.requestAnimationFrame(renderRadialFrame);

      return () => {
        window.cancelAnimationFrame(animationFrameRef.current);
      };
    }

    if (!snapshotCanvas) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    const viewportWidth = Math.max(window.innerWidth, 1);
    const viewportHeight = Math.max(window.innerHeight, 1);
    const scaleX = snapshotCanvas.width / viewportWidth;
    const scaleY = snapshotCanvas.height / viewportHeight;
    const originX = origin.x * scaleX;
    const originY = origin.y * scaleY;

    canvas.width = snapshotCanvas.width;
    canvas.height = snapshotCanvas.height;
    startedAtRef.current = performance.now();
    revealStartedAtRef.current = null;

    function renderFrame(now) {
      const currentPhase = latestPhaseRef.current;
      const rawElapsedMs = now - startedAtRef.current;
      const elapsedMs = Math.min(
        rawElapsedMs,
        RIPPLE_SPREAD_DURATION_MS + RIPPLE_LAYERS[RIPPLE_LAYERS.length - 1].delayMs,
      );

      if (currentPhase === 'revealing') {
        if (revealStartedAtRef.current === null) {
          revealStartedAtRef.current = now;
        }

        const revealProgress = clamp(
          (now - revealStartedAtRef.current) / revealDurationMs,
          0,
          1,
        );

        canvas.style.opacity = '0';
        whiteLayer.style.opacity = `${1 - easeInCubic(revealProgress)}`;
      } else if (currentPhase === 'white-hold') {
        canvas.style.opacity = '1';
        whiteLayer.style.opacity = '1';
      } else {
        canvas.style.opacity = '1';
        whiteLayer.style.opacity = `${computeWhiteOpacity(elapsedMs, whiteFillStartMs, whiteFillDurationMs)}`;
        drawRippleFrame(context, snapshotCanvas, {
          originX,
          originY,
          elapsedMs,
        });
      }

      animationFrameRef.current = window.requestAnimationFrame(renderFrame);
    }

    animationFrameRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mode, origin.x, origin.y, revealDurationMs, snapshotCanvas, transitionKey, whiteFillDurationMs, whiteFillStartMs]);

  return (
    <div className={`dream-transition dream-transition--${phase}`} aria-hidden="true">
      <canvas className="dream-transition__canvas" ref={canvasRef} />
      <div className="dream-transition__white" ref={whiteLayerRef} />
      <div className="dream-transition__glow" ref={glowLayerRef} />
    </div>
  );
}
