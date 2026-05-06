const PAW_POINTS = [
  { side: 'left', x: -52, y: -126, scale: 0.58, opacity: 0.48, rotation: -8 },
  { side: 'right', x: 8, y: -118, scale: 0.64, opacity: 0.6, rotation: 8 },
  { side: 'left', x: -40, y: -80, scale: 0.78, opacity: 0.74, rotation: -8 },
  { side: 'right', x: 22, y: -72, scale: 0.86, opacity: 0.88, rotation: 8 },
];

export default function PawTrail({ active, phase }) {
  const pointCount = PAW_POINTS.length;
  const phaseStep = Math.floor(Math.max(phase, 0));
  const current = PAW_POINTS[phaseStep % pointCount];

  const style = {
    '--paw-x': `${current.x}px`,
    '--paw-y': `${current.y}px`,
    '--paw-scale': current.scale,
    '--paw-opacity': current.opacity,
    '--paw-rotate': `${current.rotation}deg`,
  };

  return (
    <div
      className={[
        'paw-overlay',
        active ? 'is-active' : '',
        `paw-overlay--${current.side}`,
      ].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
    >
      <div key={`${phaseStep}-${current.side}`} className="paw-overlay__print">
        <span className="paw-overlay__pad" />
        <span className="paw-overlay__toe paw-overlay__toe--left" />
        <span className="paw-overlay__toe paw-overlay__toe--middle" />
        <span className="paw-overlay__toe paw-overlay__toe--right" />
      </div>
    </div>
  );
}
