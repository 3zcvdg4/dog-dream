import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useSpring } from 'motion/react';

import './PackagingPlay.css';

const ROTATE_AMPLITUDE = 3;
const SCALE_ON_HOVER = 1.08;
const SPRING = { damping: 30, stiffness: 100, mass: 2 };
const HITS_TO_BREAK = 3;

const PLASTER_STAGES = [
  '/projects/project-03/sections/plaster-00.png',
  '/projects/project-03/sections/plaster-01.png',
  '/projects/project-03/sections/plaster-02.png',
];

const HAMMER_SRC = '/projects/project-03/sections/hammer.png';

const PACK_EXIT_MS = 480;

const HINTS = {
  choose: '',
  opening: '',
  plaster: '',
  cracking: '',
  reveal: '',
};

const PACK_META = {
  神秘探险: { no: '01', english: 'MYSTERY EXPEDITION' },
  神秘寻宝: { no: '02', english: 'MYSTERY TREASURE' },
  神秘考古: { no: '03', english: 'MYSTERY DIG' },
};

function PackCaption({ name, index }) {
  const meta = PACK_META[name] || {
    no: String(index + 1).padStart(2, '0'),
    english: 'PACK SERIES',
  };

  return (
    <span className="packaging-play__caption">
      <span className="packaging-play__caption-no">NO.{meta.no}</span>
      <span className="packaging-play__caption-title" data-text={name}>
        {name}
      </span>
      <span className="packaging-play__caption-english">{meta.english}</span>
      <span className="packaging-play__caption-rule" aria-hidden="true" />
    </span>
  );
}

function pickRandomGem(gems) {
  if (!gems?.length) return null;
  return gems[Math.floor(Math.random() * gems.length)];
}

/**
 * Packaging dig play:
 * choose → selected (tilt) → open to plaster → hammer cracks → random gem.
 */
export default function PackagingPlay({ packs, gems = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [phase, setPhase] = useState('choose');
  const [settled, setSettled] = useState(false);
  const [hits, setHits] = useState(0);
  const [striking, setStriking] = useState(false);
  const [revealedGem, setRevealedGem] = useState(null);
  const [hammerPos, setHammerPos] = useState({ x: 0, y: 0, visible: false });

  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const tiltRef = useRef(null);
  const pendingFlipRef = useRef(null);
  const strikeTimerRef = useRef(0);

  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const scale = useSpring(1, SPRING);

  const crackLevel = Math.min(hits, HITS_TO_BREAK);

  const resetTilt = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  }, [rotateX, rotateY, scale]);

  const handleTiltMove = useCallback(
    (event) => {
      if (phase !== 'selected' || !settled || !tiltRef.current) return;

      const rect = tiltRef.current.getBoundingClientRect();
      const offsetX = event.clientX - rect.left - rect.width / 2;
      const offsetY = event.clientY - rect.top - rect.height / 2;

      rotateX.set((offsetY / (rect.height / 2)) * -ROTATE_AMPLITUDE);
      rotateY.set((offsetX / (rect.width / 2)) * ROTATE_AMPLITUDE);
    },
    [phase, settled, rotateX, rotateY],
  );

  const handleTiltEnter = useCallback(() => {
    if (phase !== 'selected' || !settled) return;
    scale.set(SCALE_ON_HOVER);
  }, [phase, settled, scale]);

  const handleTiltLeave = useCallback(() => {
    resetTilt();
  }, [resetTilt]);

  const handleSelect = useCallback((index) => {
    if (phase !== 'choose') return;

    const card = cardRefs.current[index];
    if (card) {
      pendingFlipRef.current = {
        index,
        first: card.getBoundingClientRect(),
      };
    }

    setSettled(false);
    resetTilt();
    setSelectedIndex(index);
    setPhase('selected');
  }, [phase, resetTilt]);

  useLayoutEffect(() => {
    const pending = pendingFlipRef.current;
    if (!pending || phase !== 'selected') return undefined;

    const card = cardRefs.current[pending.index];
    pendingFlipRef.current = null;
    if (!card) return undefined;

    const last = card.getBoundingClientRect();
    const dx =
      pending.first.left + pending.first.width / 2 - (last.left + last.width / 2);
    const dy =
      pending.first.top + pending.first.height / 2 - (last.top + last.height / 2);
    const flipScale = pending.first.width / Math.max(last.width, 1);

    card.style.transition = 'none';
    card.style.transform = `translate(${dx}px, ${dy}px) scale(${flipScale})`;

    void card.offsetWidth;
    card.style.transition =
      'transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)';
    card.style.transform = 'translate(0px, 0px) scale(1)';

    const clearInline = () => {
      card.style.transition = '';
      card.style.transform = '';
      setSettled(true);
    };

    card.addEventListener('transitionend', clearInline, { once: true });
    const fallback = window.setTimeout(clearInline, 820);

    return () => {
      window.clearTimeout(fallback);
      card.removeEventListener('transitionend', clearInline);
    };
  }, [phase, selectedIndex]);

  const openPack = useCallback(() => {
    if (phase !== 'selected' || !settled) return;
    resetTilt();
    setHits(0);
    setRevealedGem(null);
    setPhase('opening');
  }, [phase, settled, resetTilt]);

  useEffect(() => {
    if (phase !== 'opening') return undefined;
    const timer = window.setTimeout(() => {
      setPhase('plaster');
    }, PACK_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const handleHammerMove = useCallback((event) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    setHammerPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      visible: true,
    });
  }, []);

  const handleHammerLeave = useCallback(() => {
    setHammerPos((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleStrike = useCallback(() => {
    if (phase !== 'plaster' && phase !== 'cracking') return;
    if (striking) return;

    setStriking(true);
    window.clearTimeout(strikeTimerRef.current);
    strikeTimerRef.current = window.setTimeout(() => setStriking(false), 280);

    setHits((prev) => {
      const next = prev + 1;
      if (next >= HITS_TO_BREAK) {
        const gem = pickRandomGem(gems);
        if (gem) {
          const gemIndex = gems.findIndex((item) => item.src === gem.src);
          setRevealedGem({
            ...gem,
            no: String((gemIndex >= 0 ? gemIndex : 0) + 1).padStart(2, '0'),
          });
        } else {
          setRevealedGem(null);
        }
        setPhase('reveal');
      } else {
        setPhase('cracking');
      }
      return next;
    });
  }, [phase, striking, gems]);

  const handleReset = useCallback(() => {
    cardRefs.current.forEach((card) => {
      if (!card) return;
      card.style.transition = '';
      card.style.transform = '';
    });
    window.clearTimeout(strikeTimerRef.current);
    resetTilt();
    setSettled(false);
    setSelectedIndex(null);
    setHits(0);
    setStriking(false);
    setRevealedGem(null);
    setHammerPos({ x: 0, y: 0, visible: false });
    setPhase('choose');
  }, [resetTilt]);

  const showPackStage =
    phase === 'choose' || phase === 'selected' || phase === 'opening';
  const showDigStage =
    phase === 'plaster' || phase === 'cracking' || phase === 'reveal';
  const hintText = HINTS[phase];

  const rootClass = useMemo(
    () =>
      [
        'packaging-play',
        `is-${phase}`,
        settled && phase === 'selected' ? 'is-settled' : '',
        striking ? 'is-striking' : '',
        hammerPos.visible ? 'has-hammer' : '',
      ]
        .filter(Boolean)
        .join(' '),
    [phase, settled, striking, hammerPos.visible],
  );

  if (!packs?.length) return null;

  return (
    <div className={rootClass}>
      {hintText ? (
        <p className="packaging-play__hint" aria-live="polite">
          {hintText}
        </p>
      ) : null}

      <div className="packaging-play__arena">
      {showPackStage ? (
        <div className="packaging-play__stage" role="list" ref={stageRef}>
          {packs.map((pack, index) => {
            const isSelected = selectedIndex === index;
            const isHidden =
              (phase === 'selected' || phase === 'opening') && !isSelected;
            const isExiting = phase === 'opening' && isSelected;

            return (
              <button
                key={pack.src}
                type="button"
                role="listitem"
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                className={[
                  'packaging-play__card',
                  isSelected ? 'is-selected' : '',
                  isHidden ? 'is-hidden' : '',
                  isExiting ? 'is-exiting' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={
                  isSelected && settled && phase === 'selected'
                    ? `打开${pack.alt}`
                    : pack.alt
                }
                aria-pressed={isSelected}
                disabled={phase !== 'choose' && !isSelected}
                onClick={() => {
                  if (phase === 'choose') handleSelect(index);
                  else if (isSelected && phase === 'selected') openPack();
                }}
                onMouseMove={
                  isSelected && phase === 'selected' ? handleTiltMove : undefined
                }
                onMouseEnter={
                  isSelected && phase === 'selected' ? handleTiltEnter : undefined
                }
                onMouseLeave={
                  isSelected && phase === 'selected' ? handleTiltLeave : undefined
                }
              >
                <span
                  className="packaging-play__tilt"
                  ref={isSelected ? tiltRef : undefined}
                >
                  <motion.span
                    className="packaging-play__frame"
                    style={
                      isSelected
                        ? {
                            rotateX,
                            rotateY,
                            scale,
                            transformPerspective: 800,
                          }
                        : undefined
                    }
                  >
                    <img src={pack.src} alt="" loading="lazy" decoding="async" />
                  </motion.span>
                </span>
                {!isHidden ? (
                  <PackCaption name={pack.alt} index={index} />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {showDigStage ? (
        <div
          className="packaging-play__dig"
          ref={stageRef}
          onMouseMove={
            phase === 'reveal' ? undefined : handleHammerMove
          }
          onMouseLeave={
            phase === 'reveal' ? undefined : handleHammerLeave
          }
        >
          {phase !== 'reveal' ? (
            <button
              type="button"
              className={`packaging-play__plaster is-crack-${crackLevel}`}
              aria-label="敲击石膏"
              onClick={handleStrike}
            >
              <img
                className="packaging-play__plaster-img"
                src={PLASTER_STAGES[Math.min(hits, PLASTER_STAGES.length - 1)]}
                alt=""
                draggable={false}
              />
              <span className="packaging-play__plaster-cue" aria-hidden="true">
                <span className="packaging-play__plaster-cue-ring" />
                <span className="packaging-play__plaster-cue-ring packaging-play__plaster-cue-ring--delay" />
              </span>
              <span className="packaging-play__plaster-dust" aria-hidden="true" />
            </button>
          ) : (
            <div className="packaging-play__reveal" role="status">
              {revealedGem ? (
                <>
                  <img
                    className="packaging-play__gem"
                    src={revealedGem.src}
                    alt={revealedGem.alt}
                  />
                  <div className="packaging-play__caption packaging-play__caption--reveal">
                    <span className="packaging-play__caption-no">
                      NO.{revealedGem.no}
                    </span>
                    <span
                      className="packaging-play__caption-title"
                      data-text={revealedGem.alt}
                    >
                      {revealedGem.alt}
                    </span>
                    {revealedGem.english ? (
                      <span className="packaging-play__caption-english">
                        {revealedGem.english}
                      </span>
                    ) : null}
                    <span className="packaging-play__caption-rule" aria-hidden="true" />
                    <p className="packaging-play__next-hint">
                      进入下方宝石图鉴，探索更多发现。
                    </p>
                  </div>
                </>
              ) : (
                <div className="packaging-play__gem-fallback">
                  <span>[占位] 宝石</span>
                  <p>暂无宝石图可抽取</p>
                </div>
              )}
            </div>
          )}

          {phase !== 'reveal' && hammerPos.visible ? (
            <div
              className={`packaging-play__hammer${striking ? ' is-hit' : ''}`}
              style={{ left: hammerPos.x, top: hammerPos.y }}
              aria-hidden="true"
            >
              <img
                className="packaging-play__hammer-img"
                src={HAMMER_SRC}
                alt=""
                draggable={false}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      </div>

      <div className="packaging-play__actions">
        {phase === 'selected' && settled ? (
          <button
            type="button"
            className="packaging-play__reset"
            onClick={handleReset}
          >
            重新选择
          </button>
        ) : null}

        {phase === 'plaster' || phase === 'cracking' ? (
          <button
            type="button"
            className="packaging-play__reset"
            onClick={handleReset}
          >
            重新开始
          </button>
        ) : null}

        {phase === 'reveal' ? (
          <button
            type="button"
            className="packaging-play__action"
            onClick={handleReset}
          >
            再玩一次
          </button>
        ) : null}
      </div>
    </div>
  );
}
