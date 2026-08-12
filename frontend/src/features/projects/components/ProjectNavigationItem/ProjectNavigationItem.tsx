import {
  CaretIcon,
  CheckIcon,
  CodebaseIcon,
  LogsIcon,
  PencilIcon,
  ReportIcon,
  RequirementsIcon,
  WarningIcon,
} from '../../../../components/icons/Icons';
import { Spinner } from '../../../../components/feedback/Spinner/Spinner';
import { AppLink } from '../../../../app/routing/RouterProvider';
import { projectPath } from '../../../../app/routing/routes';
import type {
  ProjectSection,
  ProjectSummary,
  ProjectWorkflowStepStatus,
} from '../../model/project';
import { ProjectGlyph } from '../ProjectGlyph/ProjectGlyph';
import styles from './ProjectNavigationItem.module.css';

interface ProjectNavigationItemProps {
  readonly activeSection: ProjectSection | undefined;
  readonly isExpanded: boolean;
  readonly onEdit: () => void;
  readonly onToggle: () => void;
  readonly project: ProjectSummary;
}

const navigationItems = [
  { section: 'requirements', label: 'Requirements', icon: RequirementsIcon },
  { section: 'codebase', label: 'Codebase', icon: CodebaseIcon },
  { section: 'report', label: 'Report', icon: ReportIcon },
  { section: 'logs', label: 'Logs', icon: LogsIcon },
] as const;

interface WorkflowStatusIndicatorProps {
  readonly status: ProjectWorkflowStepStatus;
}

function WorkflowStatusIndicator({ status }: WorkflowStatusIndicatorProps) {
  if (status === 'in-progress') {
    return (
      <span className={`${styles.linkStatus} ${styles.statusInProgress}`} title="In progress">
        <span className={styles.visuallyHidden}>In progress</span>
        <Spinner decorative size={15} strokeWidth={2.2} />
      </span>
    );
  }

  if (status === 'ready-for-review') {
    return (
      <span
        className={`${styles.linkStatus} ${styles.statusReadyForReview}`}
        title="Ready for review"
      >
        <span className={styles.visuallyHidden}>Ready for review</span>
        <CheckIcon />
      </span>
    );
  }

  if (status === 'outdated') {
    return (
      <span className={`${styles.linkStatus} ${styles.statusOutdated}`} title="Outdated">
        <span className={styles.visuallyHidden}>Outdated</span>
        <WarningIcon />
      </span>
    );
  }

  return null;
}

export function ProjectNavigationItem({
  activeSection,
  isExpanded,
  onEdit,
  onToggle,
  project,
}: ProjectNavigationItemProps) {
  const panelId = `project-navigation-${project.id}`;

  return (
    <div className={styles.project}>
      <div className={styles.projectHeader}>
        <button
          aria-controls={panelId}
          aria-expanded={isExpanded}
          className={`${styles.projectButton} ${activeSection ? styles.projectButtonActive : ''}`}
          onClick={onToggle}
          type="button"
        >
          <ProjectGlyph className={styles.projectIcon} icon={project.icon} />
          <span className={styles.projectName}>{project.name}</span>
          <CaretIcon className={`${styles.caret} ${isExpanded ? styles.caretOpen : ''}`} />
        </button>
        <button
          aria-label={`Edit ${project.name}`}
          className={styles.editProjectButton}
          onClick={onEdit}
          title={`Edit ${project.name}`}
          type="button"
        >
          <PencilIcon />
        </button>
      </div>

      <div
        className={`${styles.panel} ${isExpanded ? styles.panelOpen : ''}`}
        id={panelId}
      >
        <div className={styles.panelInner}>
          <div className={styles.links}>
            {navigationItems.map(({ section, label, icon: Icon }) => {
              const isActive = activeSection === section;
              const status = section === 'logs'
                ? undefined
                : project.workflowStatuses[section];
              return (
                <AppLink
                  ariaCurrent={isActive ? 'page' : undefined}
                  className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                  key={section}
                  to={projectPath(project.id, section)}
                >
                  <Icon className={styles.linkIcon} />
                  <span className={styles.linkLabel}>{label}</span>
                  {status ? <WorkflowStatusIndicator status={status} /> : null}
                </AppLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
