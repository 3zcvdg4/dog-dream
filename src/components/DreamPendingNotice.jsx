import { useEffect, useState } from 'react';

const EXIT_MS = 520;

export default function DreamPendingNotice({ visible, onReturnToCorridor }) {
  const [phase, setPhase] = useState('hidden');

  useEffect(() => {
    if (visible) {
      setPhase('enter');
      return undefined;
    }

    setPhase((current) => (current === 'hidden' ? 'hidden' : 'exit'));
    return undefined;
  }, [visible]);

  useEffect(() => {
    if (phase !== 'enter') return undefined;

    const enterTimer = window.setTimeout(() => setPhase('visible'), 40);
    return () => window.clearTimeout(enterTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exit') return undefined;

    const exitTimer = window.setTimeout(() => setPhase('hidden'), EXIT_MS);
    return () => window.clearTimeout(exitTimer);
  }, [phase]);

  if (phase === 'hidden') {
    return null;
  }

  return (
    <div
      className={[
        'dream-pending-overlay',
        phase === 'enter' || phase === 'visible' ? 'is-active' : '',
        phase === 'exit' ? 'is-leaving' : '',
      ].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      id="unpublished-dream-notice"
    >
      <div className="dream-pending-overlay__veil" aria-hidden="true" />

      <div className="dream-pending-float">
        <div className="dream-pending-card">
          <div className="dream-pending-ink" aria-hidden="true">
            <svg className="dream-pending-ink__defs" aria-hidden="true">
              <defs>
                <filter id="dream-ink-turbulence" x="-40%" y="-40%" width="180%" height="180%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.012 0.018"
                    numOctaves="3"
                    seed="7"
                    result="noise"
                  >
                    <animate
                      attributeName="baseFrequency"
                      dur="8s"
                      values="0.012 0.018;0.02 0.014;0.014 0.022;0.012 0.018"
                      repeatCount="indefinite"
                    />
                  </feTurbulence>
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="48"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>
            </svg>

            <div className="dream-pending-ink__swirl dream-pending-ink__swirl--a" />
            <div className="dream-pending-ink__swirl dream-pending-ink__swirl--b" />
            <div className="dream-pending-ink__swirl dream-pending-ink__swirl--c" />
            <div className="dream-pending-ink__core" />
            <div className="dream-pending-ink__mist" />
          </div>

          <div className="dream-pending-ink__shadow" aria-hidden="true" />

          <div className="dream-pending-copy">
            <p className="dream-pending-card__eyebrow">MEMORY IN PROGRESS</p>

            <h3 className="dream-pending-card__title">
              梦境正在构筑
            </h3>

            <p className="dream-pending-card__lead">
              这个空间仍在创造中，
              <br />
              等待下一次与你相遇。
            </p>

            <button
              className="dream-pending-card__return"
              type="button"
              onClick={onReturnToCorridor}
            >
              <span className="dream-pending-card__return-icon" aria-hidden="true" />
              回到走廊
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
