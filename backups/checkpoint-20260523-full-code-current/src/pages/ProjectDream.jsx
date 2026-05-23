export default function ProjectDream({ project, onBackToCorridor, onWakeUp }) {
  return (
    <main className="project-page page-shell">
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
          <p>{project.detail}</p>
          <div className="project-actions">
            <button className="site-button" type="button" onClick={onBackToCorridor}>回到走廊</button>
            <button className="site-button site-button--ghost" type="button" onClick={onWakeUp}>wake up</button>
          </div>
        </article>
      </section>
      <section className="project-placeholders" aria-label="项目图片占位">
        <div /><div /><div />
      </section>
    </main>
  );
}
