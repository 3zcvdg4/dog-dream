import { useCallback, useEffect, useRef, useState } from 'react';

/* ── 常量 ── */
const FRAME_MS = 300;           // 每帧动画时长
const STEP_X = 80;              // 脚印对水平步长
const BASE_X  = 100;            // 第 n 对基准 x = 100 + (n-1)*STEP
const PAIR_DX = 40;             // 右脚相对左脚 x 偏移
const PAIR_Y  = 70;             // 所有脚印 y（距顶部百分比）

/* ── 计算第 frameIndex 帧的可见 pair 及目标 alpha ── */
function calcFramePairs(frameIndex) {
  if (frameIndex <= 0) return [];

  if (frameIndex <= 3) {
    return Array.from({ length: frameIndex }, (_, i) => ({
      pairId: i + 1,
      targetAlpha: 1,
    }));
  }

  // 循环：最旧渐隐 + 中间保持 + 最新渐现
  return [
    { pairId: frameIndex - 2, targetAlpha: 0 },
    { pairId: frameIndex - 1, targetAlpha: 1 },
    { pairId: frameIndex,     targetAlpha: 1 },
  ];
}

/* ── pairId → x 坐标 ── */
function pairX(pairId, isRight) {
  const base = BASE_X + (pairId - 1) * STEP_X;
  return isRight ? base + PAIR_DX : base;
}

/* ═══════════════════════════════════════════════════════
   PawTrail — 滚轮触发脚印动画
   - targetFrame 每 +1 触发一帧
   - 内部 currentFrame 以 0.3s/帧 追赶 targetFrame
   - CSS transition 处理 0.3s 淡入/淡出
   ═══════════════════════════════════════════════════════ */
export default function PawTrail({ targetFrame = 0 }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [activePairs, setActivePairs] = useState([]);
  const timerRef = useRef(null);
  const processingRef = useRef(false);

  /* ── 追赶 targetFrame ── */
  useEffect(() => {
    if (targetFrame <= currentFrame) return;
    if (processingRef.current) return;
    advanceOneFrame();
  }, [targetFrame, currentFrame]);

  const advanceOneFrame = useCallback(() => {
    processingRef.current = true;
    const nextFrame = currentFrame + 1;

    const prevPairs = calcFramePairs(nextFrame - 1);
    const nextPairs = calcFramePairs(nextFrame);

    // 合并：保留旧 pair 当前 alpha；新 pair 从 0 开始
    const merged = nextPairs.map((np) => {
      const existing = prevPairs.find((pp) => pp.pairId === np.pairId);
      return {
        pairId: np.pairId,
        currentAlpha: existing ? existing.targetAlpha : 0,
        targetAlpha: np.targetAlpha,
      };
    });

    // 加入需要渐隐的旧 pair
    for (const pp of prevPairs) {
      if (!nextPairs.find((np) => np.pairId === pp.pairId)) {
        merged.push({
          pairId: pp.pairId,
          currentAlpha: pp.targetAlpha,
          targetAlpha: 0,
        });
      }
    }

    merged.sort((a, b) => a.pairId - b.pairId);
    setActivePairs(merged);

    // 下一帧触发 CSS transition
    requestAnimationFrame(() => {
      setActivePairs((prev) =>
        prev.map((p) => ({ ...p, currentAlpha: p.targetAlpha })),
      );
    });

    timerRef.current = setTimeout(() => {
      setCurrentFrame(nextFrame);
      setActivePairs((prev) =>
        prev.filter((p) => p.targetAlpha > 0.01 || p.currentAlpha > 0.01),
      );
      processingRef.current = false;
    }, FRAME_MS);
  }, [currentFrame]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (activePairs.length === 0 && currentFrame === 0) return null;

  return (
    <div className="paw-trail" aria-hidden="true">
      {activePairs.map((p) => (
        <span
          key={p.pairId}
          className="paw-pair"
          style={{
            position: 'absolute',
            left: `${pairX(p.pairId, false)}px`,
            top:  `${PAIR_Y}%`,
            pointerEvents: 'none',
          }}
        >
          <img
            className="paw-print"
            src="/left-footprint.png"
            alt=""
            style={{
              opacity: p.currentAlpha,
              transition: `opacity ${FRAME_MS}ms ease`,
              position: 'absolute',
              width: 'auto',
              height: 'auto',
            }}
          />
          <img
            className="paw-print"
            src="/right-footprint.png"
            alt=""
            style={{
              position: 'absolute',
              left: `${PAIR_DX}px`,
              opacity: p.currentAlpha,
              transition: `opacity ${FRAME_MS}ms ease`,
              width: 'auto',
              height: 'auto',
            }}
          />
        </span>
      ))}
    </div>
  );
}

