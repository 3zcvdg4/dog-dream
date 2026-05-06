import { useMemo, useState } from 'react';
import Home from './pages/Home.jsx';
import DreamCorridor from './pages/DreamCorridor.jsx';
import ProjectDream from './pages/ProjectDream.jsx';
import { projects } from './data/projects.js';

export default function App() {
  const [view, setView] = useState('home');
  const [wakeSignal, setWakeSignal] = useState(0);
  const [activeProjectId, setActiveProjectId] = useState(projects[0].id);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId],
  );

  function enterProject(projectId) {
    setActiveProjectId(projectId);
    setView('project');
  }

  function wakeUp() {
    setWakeSignal((signal) => signal + 1);
    setView('home');
  }

  if (view === 'corridor') {
    return (
      <DreamCorridor
        onEnterProject={enterProject}
        onWakeUp={wakeUp}
      />
    );
  }

  if (view === 'project') {
    return (
      <ProjectDream
        project={activeProject}
        onBackToCorridor={() => setView('corridor')}
        onWakeUp={wakeUp}
      />
    );
  }

  return <Home wakeSignal={wakeSignal} onEnterDream={() => setView('corridor')} />;
}
