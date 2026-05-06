import { useEffect, useRef, useState } from 'react';

const ASSET_PATH = '/assets/';

export default function Home({ wakeSignal, onEnterDream }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState(wakeSignal > 0 ? 'waking' : 'intro');
  const [bubbleBroken, setBubbleBroken] = useState(false);

  useEffect(() => {
    const timers = [];

    if (wakeSignal > 0) {
      setBubbleBroken(true);
      setPhase('waking');
      timers.push(window.setTimeout(() => setPhase('awake'), 1500));
      timers.push(window.setTimeout(() => setBubbleBroken(false), 1900));
      return () => timers.forEach(window.clearTimeout);
    }

    setPhase('intro');
    setBubbleBroken(false);
    const video = videoRef.current;
    if (!video) return undefined;

    video.currentTime = 0;
    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => setPhase('dreamReady'));
    }

    timers.push(window.setTimeout(() => {
      setPhase((current) => (current === 'intro' ? 'dreamReady' : current));
    }, 5200));

    return () => timers.forEach(window.clearTimeout);
  }, [wakeSignal]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return undefined;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return undefined;

    let animationFrame = 0;

    function drawFrame() {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = context.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = frame;

        for (let index = 0; index < data.length; index += 4) {
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const alpha = data[index + 3];
          const average = (red + green + blue) / 3;

          if (red < 42 && green < 42 && blue < 42) {
            data[index + 3] = 0;
          } else if (average < 82) {
            data[index + 3] = Math.round(alpha * (average / 82));
          }
        }

        context.putImageData(frame, 0, 0);
      }

      animationFrame = window.requestAnimationFrame(drawFrame);
    }

    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  function handleVideoEnded() {
    setPhase((current) => (current === 'intro' ? 'dreamReady' : current));
  }

  function handleSleep() {
    setPhase('sleepingAgain');
    window.setTimeout(() => setPhase('dreamReady'), 1350);
  }

  const showBubble = phase === 'dreamReady' || phase === 'sleepingAgain';
  const showSleep = phase === 'awake';

  return (
    <main className="home page-shell">
      <section className="home-card" aria-label="Dog dream home scene">
        <img className="home-word" src={`${ASSET_PATH}word.png`} alt="Everything you see was once a dream" />
        <div className="home-line" />

        <button
          className={`dream-bubble ${showBubble ? 'is-visible' : ''} ${bubbleBroken ? 'is-broken' : ''}`}
          type="button"
          onClick={onEnterDream}
          disabled={!showBubble}
          aria-label="进入梦境走廊"
        >
          <img src={`${ASSET_PATH}Dream Bubble.png`} alt="" />
        </button>

        <div className={`dog-scene dog-scene--${phase}`}>
          <img className="cushion" src={`${ASSET_PATH}Cushion.png`} alt="坐垫" />
          <video
            ref={videoRef}
            className="dog-video-source"
            src={`${ASSET_PATH}4.25.mp4`}
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnded}
          />
          <canvas ref={canvasRef} className="dog-canvas" aria-hidden="true" />
        </div>

        {phase === 'waking' && <div className="wake-lines" aria-hidden="true"><span /><span /></div>}

        {showSleep && (
          <button className="site-button sleep-button" type="button" onClick={handleSleep}>
            sleep
          </button>
        )}
      </section>
    </main>
  );
}
