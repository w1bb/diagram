import { ArrowIcon } from '../../components/icons/Icons';
import { PageHeader } from '../../components/page/PageHeader/PageHeader';
import { AppLink } from '../../app/routing/RouterProvider';
import { projectPath } from '../../app/routing/routes';
import { useProjects } from '../../features/projects/providers/ProjectProvider';
import { ProjectGlyph } from '../../features/projects/components/ProjectGlyph/ProjectGlyph';
import styles from './HomePage.module.css';

export function HomePage() {
  const { projects } = useProjects();
  const totalRequirements = projects.reduce(
    (total, project) => total + project.requirementsCount,
    0,
  );
  const totalOpenFindings = projects.reduce(
    (total, project) => total + project.openFindingsCount,
    0,
  );

  return (
    <div className={styles.page}>
      <PageHeader
        description="Connect requirements to code and test evidence, then turn every gap into an actionable finding."
        eyebrow="Project assurance"
        title="Know what is built—and what is still missing."
      />

      <section aria-label="Workspace summary" className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{projects.length}</span>
          <span className={styles.summaryLabel}>Active projects</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{totalRequirements}</span>
          <span className={styles.summaryLabel}>Requirements tracked</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{totalOpenFindings}</span>
          <span className={styles.summaryLabel}>Open findings</span>
        </div>
      </section>

      <section aria-labelledby="projects-heading" className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>Workspace</p>
            <h2 id="projects-heading">Projects</h2>
          </div>
          <p>Select a project to continue its verification workflow.</p>
        </div>

        <div className={styles.projectGrid}>
          {projects.map((project) => (
            <AppLink
              className={styles.projectCard}
              key={project.id}
              to={projectPath(project.id, 'requirements')}
            >
              <div className={styles.cardTopline}>
                <span className={styles.projectMark}>
                  <ProjectGlyph icon={project.icon} />
                </span>
                <ArrowIcon className={styles.arrow} />
              </div>
              <div>
                <h3>{project.name}</h3>
                <p>{project.description || 'No description yet.'}</p>
              </div>
              <div className={styles.cardMeta}>
                <span>{project.requirementsCount} requirements</span>
                <span className={project.openFindingsCount > 0 ? styles.attention : styles.clear}>
                  {project.openFindingsCount > 0
                    ? `${project.openFindingsCount} open findings`
                    : 'No open findings'}
                </span>
              </div>
            </AppLink>
          ))}
        </div>
      </section>
    </div>
  );
}
