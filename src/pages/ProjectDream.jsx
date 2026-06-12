import { getProjectContent } from '../data/projectContents/index.js';
import ProjectSectionRenderer from '../components/project/ProjectSectionRenderer.jsx';

export default function ProjectDream({ project, onBackToCorridor, onWakeUp }) {
  const content = getProjectContent(project.id);
  const layout = content?.layout ?? 'editorial-dream';
  const sections = content?.sections ?? [];
  const isProject01Editorial = layout === 'project-01-editorial';
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

  if (isProject01Editorial) {
    let stageIndex = 0;

    return (
      <main className={`project-page page-shell project-page--${layout}`} style={pageStyle}>
        <header className="project-editorial-nav">
          <button className="project-editorial-nav__link" type="button" onClick={onBackToCorridor}>回到走廊</button>
          <div className="project-editorial-nav__meta">
            <span>Dogdream</span>
          </div>
          <button className="project-editorial-nav__link project-editorial-nav__link--ghost" type="button" onClick={onWakeUp}>醒来</button>
        </header>

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
              <span>服务</span>
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
          <div className="project-editorial-footer__closing">
            {project01EndingParagraphs.map((line, index) => (
              index === project01EndingParagraphs.length - 1 ? (
                <p key={line} className="project-editorial-footer__final">{line}</p>
              ) : (
              <p key={line}>{line}</p>
              )
            ))}
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
            <button className="site-button site-button--ghost" type="button" onClick={onWakeUp}>wake up</button>
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
          <button className="site-button site-button--ghost" type="button" onClick={onWakeUp}>wake up</button>
        </div>
      </footer>
    </main>
  );
}
