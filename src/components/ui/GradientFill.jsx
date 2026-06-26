import { motion } from 'motion/react';
import { useAnimatedGradient } from './useAnimatedGradient';
import './GradientFill.css';

export default function GradientFill({
  className = '',
  colors,
  animationSpeed,
  direction,
  pauseOnHover,
  yoyo,
}) {
  const { gradientStyle, backgroundPosition } = useAnimatedGradient({
    colors,
    animationSpeed,
    direction,
    pauseOnHover,
    yoyo,
  });

  return (
    <motion.span
      className={`gradient-fill ${className}`.trim()}
      style={{ ...gradientStyle, backgroundPosition }}
      aria-hidden="true"
    />
  );
}
