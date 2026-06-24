import CountUp from './CountUp.jsx';

export default function LoadingPercent({ progress = 0, className = '' }) {
  const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));

  return (
    <CountUp
      className={className}
      from={0}
      to={percent}
      suffix="%"
    />
  );
}
