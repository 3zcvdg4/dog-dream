import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'motion/react';

export default function CountUp({
  to,
  from = 0,
  className = '',
  suffix = '',
}) {
  const ref = useRef(null);
  const motionValue = useMotionValue(from);
  const springValue = useSpring(motionValue, {
    damping: 28,
    stiffness: 140,
  });

  useEffect(() => {
    motionValue.set(to);
  }, [motionValue, to]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (!ref.current) return;
      ref.current.textContent = `${Math.round(latest)}${suffix}`;
    });

    return unsubscribe;
  }, [springValue, suffix]);

  return (
    <span className={className} ref={ref}>
      {from}
      {suffix}
    </span>
  );
}
