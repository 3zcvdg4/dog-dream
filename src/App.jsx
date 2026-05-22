import { useEffect, useMemo, useState } from 'react';
import Home from './pages/Home.jsx';
import DreamCorridor from './pages/DreamCorridor.jsx';
import ProjectDream from './pages/ProjectDream.jsx';
import SteamLab from './pages/SteamLab.jsx';
import { projects } from './data/projects.js';

const DESKTOP_BREAKPOINT = 1025;

function shouldShowRotateTip() {
  if (typeof window === 'undefined') return false;

  const { innerWidth, innerHeight } = window;
  const isDesktop = innerWidth >= DESKTOP_BREAKPOINT;
  const isLandscape = innerWidth > innerHeight;

  return !isDesktop && !isLandscape;
}

export default function App() {
  const [view, setView] = useState('home');
  const [wakeSignal, setWakeSignal] = useState(0);
  const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
  const [corridorReturnState, setCorridorReturnState] = useState(null);
  const [corridorSmokePreset, setCorridorSmokePreset] = useState(null);
  const [showRotateTip, setShowRotateTip] = useState(() => shouldShowRotateTip());

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId],
  );

  useEffect(() => {
    function updateRotateTipState() {
      setShowRotateTip(shouldShowRotateTip());
    }

    updateRotateTipState();
    window.addEventListener('resize', updateRotateTipState);
    window.addEventListener('orientationchange', updateRotateTipState);

    return () => {
      window.removeEventListener('resize', updateRotateTipState);
      window.removeEventListener('orientationchange', updateRotateTipState);
    };
  }, []);

  function enterProject(projectId, corridorState) {
    setActiveProjectId(projectId);
    setCorridorReturnState(corridorState ?? null);
    setView('project');
  }

  function wakeUp() {
    setWakeSignal((signal) => signal + 1);
    setCorridorReturnState(null);
    setView('home');
  }

  let content = <Home wakeSignal={wakeSignal} onEnterDream={() => {
    setCorridorReturnState(null);
    setView('corridor');
  }} onEnterSteamLab={() => setView('steam-lab')} />;

  if (view === 'corridor') {
    content = (
      <DreamCorridor
        initialState={corridorReturnState}
        smokePreset={corridorSmokePreset}
        onEnterProject={enterProject}
        onWakeUp={wakeUp}
      />
    );
  }

  if (view === 'project') {
    content = (
      <ProjectDream
        project={activeProject}
        onBackToCorridor={() => {
          setCorridorReturnState((current) => {
            if (!current) return current;
            return {
              ...current,
              resumeFromProject: true,
            };
          });
          setView('corridor');
        }}
        onWakeUp={wakeUp}
      />
    );
  }

  if (view === 'steam-lab') {
    content = (
      <SteamLab
        onBack={() => setView('home')}
        onApplyToCorridor={(settings) => {
          setCorridorSmokePreset(settings ?? null);
          setCorridorReturnState(null);
          setView('corridor');
        }}
      />
    );
  }

  return (
    <>
      {content}

      {showRotateTip && (
        <div className="rotate-tip-overlay" role="dialog" aria-modal="true" aria-label="横屏浏览提示">
          <div className="rotate-tip-panel">
            <div className="rotate-tip-icon" aria-hidden="true">
              <span className="rotate-tip-phone">
                <span className="rotate-tip-phone-screen" />
              </span>
            </div>
            <div className="rotate-tip-copy">
              <p className="rotate-tip-title">请旋转手机</p>
              <p className="rotate-tip-subtitle">横屏获得最佳体验</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
