import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { projects } from '../data/projects.js';
import AboutLanyard, { preloadAboutLanyardAssets } from './AboutLanyard.jsx';

const COLLAPSE_DELAY_MS = 2500;
const PROJECT_MENU_CLOSE_DELAY_MS = 180;

function AboutCurtainPanel({ open, sessionKey, onClose, closing, onCloseRequest, theme }) {
  const showPanel = open || closing;

  return (
    <div
      className={[
        'site-nav__curtain-shell',
        showPanel ? 'is-open' : '',
        closing ? 'is-closing' : '',
      ].filter(Boolean).join(' ')}
      aria-hidden={!showPanel}
    >
      {showPanel ? (
        <Suspense fallback={null}>
          <AboutLanyard
            sessionKey={sessionKey}
            closing={closing}
            theme={theme}
            onCloseRequest={onCloseRequest}
            onPullComplete={onClose}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

export default function SiteNav({
  variant = 'home',
  theme = 'light',
  currentProjectId = '',
  autoOpenAbout = false,
  onIntroAboutDismissed,
  onHome,
  onOpenProject,
  onBackToCorridor,
  onWakeUp,
  hidden = false,
}) {
  const rootRef = useRef(null);
  const collapseTimerRef = useRef(0);
  const projectCloseTimerRef = useRef(0);
  const autoOpenedAboutRef = useRef(false);
  const isCollapsible = variant === 'corridor';
  const isPinned = variant === 'home' || variant === 'detail';
  const [isExpanded, setIsExpanded] = useState(isPinned);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAboutClosing, setIsAboutClosing] = useState(false);
  const [aboutSession, setAboutSession] = useState(0);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  const publishedProjects = useMemo(
    () => projects.filter((project) => project.published),
    [],
  );

  const finishAboutClose = useCallback(() => {
    setIsAboutOpen(false);
    setIsAboutClosing(false);
    onIntroAboutDismissed?.();
  }, [onIntroAboutDismissed]);

  const requestAboutClose = useCallback(() => {
    setIsAboutOpen((open) => {
      if (open) setIsAboutClosing(true);
      return open;
    });
  }, []);

  useEffect(() => {
    preloadAboutLanyardAssets();
  }, []);

  useEffect(() => {
    if (!autoOpenAbout) {
      autoOpenedAboutRef.current = false;
      return undefined;
    }

    if (autoOpenedAboutRef.current) return undefined;

    autoOpenedAboutRef.current = true;
    setIsAboutClosing(false);
    setAboutSession((session) => session + 1);
    setIsAboutOpen(true);
    return undefined;
  }, [autoOpenAbout]);

  useEffect(() => {
    window.clearTimeout(collapseTimerRef.current);
    setIsExpanded(isPinned);
    if (!autoOpenAbout) {
      setIsAboutOpen(false);
      setIsAboutClosing(false);
    }
    setIsProjectsOpen(false);
  }, [autoOpenAbout, isPinned, variant]);

  useEffect(() => () => {
    window.clearTimeout(collapseTimerRef.current);
    window.clearTimeout(projectCloseTimerRef.current);
  }, []);

  useEffect(() => {
    if (hidden) return undefined;

    function handlePointerDown(event) {
      const root = rootRef.current;
      if (!root || root.contains(event.target)) return;

      if (isAboutOpen && !isAboutClosing) {
        requestAboutClose();
        return;
      }

      setIsAboutOpen(false);
      setIsAboutClosing(false);
      setIsProjectsOpen(false);

      if (isCollapsible) {
        setIsExpanded(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;

      if (isAboutOpen && !isAboutClosing) {
        requestAboutClose();
        return;
      }

      setIsAboutOpen(false);
      setIsAboutClosing(false);
      setIsProjectsOpen(false);

      if (isCollapsible) {
        setIsExpanded(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hidden, isCollapsible, isAboutOpen, isAboutClosing, requestAboutClose]);

  function clearCollapseTimer() {
    window.clearTimeout(collapseTimerRef.current);
  }

  function clearProjectCloseTimer() {
    window.clearTimeout(projectCloseTimerRef.current);
  }

  function scheduleCollapse() {
    if (!isCollapsible || isAboutOpen) return;

    clearCollapseTimer();
    collapseTimerRef.current = window.setTimeout(() => {
      setIsExpanded(false);
      setIsProjectsOpen(false);
    }, COLLAPSE_DELAY_MS);
  }

  function openNav() {
    clearCollapseTimer();
    setIsExpanded(true);
  }

  function collapseNav() {
    if (!isCollapsible) return;
    clearCollapseTimer();
    clearProjectCloseTimer();
    setIsExpanded(false);
    setIsProjectsOpen(false);
  }

  function handleHomeClick() {
    if (isAboutOpen) onIntroAboutDismissed?.();
    setIsAboutOpen(false);
    setIsAboutClosing(false);
    setIsProjectsOpen(false);
    onHome?.();
    collapseNav();
  }

  function handleProjectSelect(projectId) {
    clearProjectCloseTimer();
    if (projectId === currentProjectId) {
      setIsProjectsOpen(false);
      return;
    }

    if (isAboutOpen) onIntroAboutDismissed?.();
    setIsAboutOpen(false);
    setIsAboutClosing(false);
    setIsProjectsOpen(false);
    onOpenProject?.(projectId);
    collapseNav();
  }

  function handleAboutToggle() {
    openNav();
    clearProjectCloseTimer();
    setIsProjectsOpen(false);

    if (isAboutOpen) {
      if (!isAboutClosing) requestAboutClose();
      return;
    }

    setIsAboutClosing(false);
    setAboutSession((session) => session + 1);
    setIsAboutOpen(true);
  }

  function openProjectsMenu() {
    openNav();
    clearProjectCloseTimer();
    setIsProjectsOpen(true);
  }

  function scheduleProjectClose() {
    clearProjectCloseTimer();
    projectCloseTimerRef.current = window.setTimeout(() => {
      setIsProjectsOpen(false);
    }, PROJECT_MENU_CLOSE_DELAY_MS);
  }

  function toggleProjectsMenu() {
    if (isProjectsOpen) {
      clearProjectCloseTimer();
      setIsProjectsOpen(false);
      return;
    }

    openProjectsMenu();
  }

  if (hidden) return null;

  return (
    <div
      ref={rootRef}
      className={[
        'site-nav',
        `site-nav--${variant}`,
        `site-nav--${theme}`,
        isExpanded ? 'is-expanded' : 'is-collapsed',
        isAboutOpen ? 'has-about-open' : '',
        isProjectsOpen ? 'has-projects-open' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={openNav}
      onMouseLeave={scheduleCollapse}
    >
      {isCollapsible ? (
        <button
          className="site-nav__edge"
          type="button"
          aria-label="展开导航"
          onClick={openNav}
        />
      ) : null}

      {isAboutOpen ? (
        <button
          className="site-nav__scrim"
          type="button"
          aria-label="关闭关于面板"
          onClick={requestAboutClose}
        />
      ) : null}

      <div className="site-nav__bar" role="presentation">
        <div className="site-nav__section site-nav__section--left">
          {variant === 'detail' ? (
            <button className="site-nav__action" type="button" onClick={onBackToCorridor}>
              回到走廊
            </button>
          ) : (
            <span className="site-nav__spacer" aria-hidden="true" />
          )}
        </div>

        <nav className="site-nav__center" aria-label="主导航">
          <button className="site-nav__link" type="button" onClick={handleHomeClick}>
            首页
          </button>

          <div
            className="site-nav__dropdown"
            onMouseEnter={openProjectsMenu}
            onMouseLeave={scheduleProjectClose}
          >
            <button
              className={`site-nav__link${isProjectsOpen ? ' is-active' : ''}`}
              type="button"
              aria-haspopup="menu"
              aria-expanded={isProjectsOpen}
              onClick={toggleProjectsMenu}
            >
              选择深梦
            </button>

            <div className={`site-nav__dropdown-panel${isProjectsOpen ? ' is-open' : ''}`} role="menu" aria-label="项目列表">
              {publishedProjects.map((project) => {
                const isCurrent = project.id === currentProjectId;
                return (
                  <button
                    key={project.id}
                    className={`site-nav__project-link${isCurrent ? ' is-current' : ''}`}
                    type="button"
                    role="menuitem"
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={() => handleProjectSelect(project.id)}
                  >
                    <span>{project.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className={`site-nav__link${isAboutOpen ? ' is-active' : ''}`}
            type="button"
            aria-expanded={isAboutOpen}
            onMouseEnter={preloadAboutLanyardAssets}
            onClick={handleAboutToggle}
          >
            关于
          </button>
        </nav>

        <div className="site-nav__section site-nav__section--right">
          {variant === 'detail' ? (
            <button className="site-nav__action site-nav__action--ghost" type="button" onClick={onWakeUp}>
              醒来
            </button>
          ) : null}
        </div>
      </div>

      <AboutCurtainPanel
        open={isAboutOpen}
        closing={isAboutClosing}
        sessionKey={aboutSession}
        theme={theme}
        onCloseRequest={requestAboutClose}
        onClose={finishAboutClose}
      />
    </div>
  );
}
