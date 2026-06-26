import { motion } from 'motion/react';
import { useAnimatedGradient } from './useAnimatedGradient';
import './GradientText.css';

export default function GradientText({
  children,
  className = '',
  colors = ['#5227FF', '#FF9FFC', '#B497CF'],
  animationSpeed = 8,
  showBorder = false,
  direction = 'horizontal',
  pauseOnHover = false,
  yoyo = true,
}) {
  const { gradientStyle, backgroundPosition, handleMouseEnter, handleMouseLeave } = useAnimatedGradient({
    colors,
    animationSpeed,
    direction,
    pauseOnHover,
    yoyo,
  });

  return (
    <motion.span
      className={`animated-gradient-text ${showBorder ? 'with-border' : ''} ${className}`.trim()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showBorder && (
        <motion.span className="gradient-overlay" style={{ ...gradientStyle, backgroundPosition }} aria-hidden="true" />
      )}
      <motion.span className="text-content" style={{ ...gradientStyle, backgroundPosition }}>
        {children}
      </motion.span>
    </motion.span>
  );
}
