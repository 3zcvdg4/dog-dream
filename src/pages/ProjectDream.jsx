import { useCallback, useEffect } from 'react';
import { getProjectContent } from '../data/projectContents/index.js';
import ProjectSectionRenderer from '../components/project/ProjectSectionRenderer.jsx';
import ProjectOrturCaseStudy, { preloadProjectOrturPriorityAssets } from '../components/project/ProjectOrturCaseStudy.jsx';
import ProjectSeerCaseStudy from '../components/project/ProjectSeerCaseStudy.jsx';
import ProjectParallaxCaseStudy from '../components/project/ProjectParallaxCaseStudy.jsx';

const PROJECT_MEDIA_URL_PATTERN = /\.(?:avif|gif|jpe?g|mp4|mov|png|svg|webm|webp)(?:\?.*)?$/i;
const preloadedProjectMedia = new Set();

function collectProjectMediaUrls(source, results = new Set()) {
  if (!source) return results;

  if (typeof source === 'string') {
    const normalized = source.trim();

    if (normalized && !normalized.startsWith('data:') && PROJECT_MEDIA_URL_PATTERN.test(normalized)) {
      results.add(normalized);
    }

    return results;
  }

  if (Array.isArray(source)) {
    source.forEach((item) => collectProjectMediaUrls(item, results));
    return results;
  }

  if (typeof source === 'object') {
    Object.values(source).forEach((value) => collectProjectMediaUrls(value, results));
  }

  return results;
}

function preloadProjectMediaUrl(url) {
  if (typeof window === 'undefined' || !url || preloadedProjectMedia.has(url)) {
    return;
  }

  preloadedProjectMedia.add(url);

  if (/\.(?:mp4|mov|webm)(?:\?.*)?$/i.test(url)) {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.load();
    return;
  }

  const image = new window.Image();
  image.decoding = 'async';
  image.src = url;
}

export function preloadProjectExperience(projectId) {
  const content = getProjectContent(projectId);

  if (!content) return;

  if (content.layout === 'project-02-ortur') {
    preloadProjectOrturPriorityAssets(content);
  }

  collectProjectMediaUrls(content).forEach(preloadProjectMediaUrl);
}

function scrollToChapter(chapterId) {
  const block = document.getElementById(chapterId);
  if (!block) {
    return;
  }

  block.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function ProjectDream({ project, dreamLayoutReady = true, onBackToCorridor, onWakeUp }) {
  const content = getProjectContent(project.id);
  const layout = content?.layout ?? 'editorial-dream';
  const sections = content?.sections ?? [];
  const isProject01Editorial = layout === 'project-01-editorial';
  const isProject02Ortur = layout === 'project-02-ortur';
  const isProject03Parallax = layout === 'project-03-parallax';
  const isProject04Seer = layout === 'project-04-seer';
  const project01EndingParagraphs = [
    '这个网站现在还没有真正完成。它可能永远都不会彻底完成。',
    '因为梦本来就不是静止的。它会继续变化。继续生长。',
    '继续向更深的地方延伸。',
  ];
  const pageStyle = {
    '--project-color': project.color,
    ...(isProject01Editorial ? (content?.theme ?? {}) : {}),
  };
  const summaryParagraphs = typeof project.summary === 'string'
    ? project.summary.split('\n').filter(Boolean)
    : [];
  const introSection = sections.find((section) => section.type === 'intro') ?? null;
  const bodySections = isProject01Editorial
    ? sections.filter((section) => section.type !== 'intro')
    : sections;
  const stageChapters = isProject01Editorial
    ? bodySections
      .filter((section) => section.type === 'stageToggle')
      .map((section) => ({ id: section.id, title: section.title }))
    : [];
  const handleChapterNavClick = useCallback((chapterId) => {
    scrollToChapter(chapterId);
  }, []);

  useEffect(() => {
    if (isProject02Ortur) {
      preloadProjectOrturPriorityAssets(content);
    }
  }, [content, isProject02Ortur]);

  if (isProject02Ortur) {
    return (
      <ProjectOrturCaseStudy
        project={project}
        content={content}
        onBackToCorridor={onBackToCorridor}
        onWakeUp={onWakeUp}
      />
    );
  }

  if (isProject03Parallax) {
    return (
      <ProjectParallaxCaseStudy
        project={project}
        content={content}
        dreamLayoutReady={dreamLayoutReady}
        onBackToCorridor={onBackToCorridor}
        onWakeUp={onWakeUp}
      />
    );
  }

  if (isProject04Seer) {
    return (
      <ProjectSeerCaseStudy
        project={project}
        content={content}
        dreamLayoutReady={dreamLayoutReady}
        onBackToCorridor={onBackToCorridor}
        onWakeUp={onWakeUp}
      />
    );
  }

  if (isProject01Editorial) {
    let stageIndex = 0;

    return (
      <main className={`project-page page-shell project-page--${layout}`} style={pageStyle}>
        {stageChapters.length > 0 ? (
          <nav className="project-editorial-chapters-side" aria-label="篇章导航">
            <p className="project-editorial-chapters-side__label">篇章</p>
            <ol className="project-editorial-chapters-side__list">
              {stageChapters.map((chapter, index) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    className="project-editorial-chapters-side__link"
                    onClick={() => handleChapterNavClick(chapter.id)}
                  >
                    <span className="project-editorial-chapters-side__index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="project-editorial-chapters-side__title">{chapter.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <section className="project-editorial-hero">
          <div className="project-editorial-hero__heading">
            <p className="project-editorial-hero__eyebrow">网站搭建记录</p>
            <h1>{project.title}</h1>
            <div className="project-editorial-hero__summary">
              {summaryParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="project-editorial-hero__meta">
            <div>
              <span>年份</span>
              <strong>{project.year}</strong>
            </div>
            <div>
              <span>角色</span>
              <strong>{project.role}</strong>
            </div>
            <div>
              <span>负责</span>
              <strong>{project.services}</strong>
            </div>
          </div>

          <div className="project-editorial-hero__intro">
            {(introSection?.paragraphs ?? []).map((text) => (
              <p key={text.slice(0, 24)}>{text}</p>
            ))}
          </div>
        </section>

        <div className="project-body project-body--editorial">
          {bodySections.map((section, index) => {
            const sectionStageIndex = section.type === 'stageToggle' ? ++stageIndex : undefined;

            return (
              <ProjectSectionRenderer
                key={section.id ?? `${section.type}-${index}`}
                section={section}
                sectionIndex={sectionStageIndex}
                layout={layout}
              />
            );
          })}
        </div>

        <footer className="project-editorial-footer">
          <div className="project-editorial-footer__rule" aria-hidden="true" />
          <div className="project-editorial-footer__layout">
            <div className="project-editorial-footer__closing">
              {project01EndingParagraphs.map((line, index) => (
                index === project01EndingParagraphs.length - 1 ? (
                  <p key={line} className="project-editorial-footer__final">{line}</p>
                ) : (
                <p key={line}>{line}</p>
                )
              ))}
            </div>

            <div className="project-editorial-footer__actions">
              <button
                className="project-editorial-footer__back"
                type="button"
                onClick={onBackToCorridor}
              >
                <span className="project-editorial-footer__back-arrow" aria-hidden="true">←</span>
                <span className="project-editorial-footer__back-label">回到走廊</span>
              </button>
            </div>
          </div>
        </footer>
      </main>
    );
  }

  return (
    <main className={`project-page page-shell project-page--${layout}`} style={pageStyle}>
      <section className="project-hero" style={{ '--project-color': project.color }}>
        <div className="project-cover">
          {project.imageUrl ? <img src={project.imageUrl} alt={project.title} /> : <span>{project.title}</span>}
        </div>
        <article className="project-info">
          <p className="eyebrow">DEEP DREAM</p>
          <h1>{project.title}</h1>
          <p className="project-summary">{project.summary}</p>
          <dl>
            <div><dt>Year</dt><dd>{project.year}</dd></div>
            <div><dt>Role</dt><dd>{project.role}</dd></div>
            <div><dt>Services</dt><dd>{project.services}</dd></div>
          </dl>
          <div className="project-actions project-actions--hero">
            <button className="site-button" type="button" onClick={onBackToCorridor}>回到走廊</button>
            <button className="site-button site-button--ghost" type="button" onClick={onWakeUp}>醒来</button>
          </div>
        </article>
      </section>

      {sections.length > 0 ? (
        <div className="project-body">
          {sections.map((section, index) => (
            <ProjectSectionRenderer
              key={section.id ?? `${section.type}-${index}`}
              section={section}
              layout={layout}
            />
          ))}
        </div>
      ) : (
        <section className="project-body project-body--fallback">
          <p className="project-section__text">{project.detail}</p>
        </section>
      )}

      <footer className="project-footer">
        <div className="project-actions">
          <button className="site-button" type="button" onClick={onBackToCorridor}>回到走廊</button>
          <button className="site-button site-button--ghost" type="button" onClick={onWakeUp}>醒来</button>
        </div>
      </footer>
    </main>
  );
}
