import { AppLink } from '../../../../app/routing/RouterProvider';
import { projectPath } from '../../../../app/routing/routes';
import { Spinner } from '../../../../components/feedback/Spinner/Spinner';
import type {
  ProjectSection,
  ProjectSummary,
  ProjectWorkflowStepStatus,
} from '../../model/project';
import styles from './ProjectWorkflowNavigation.module.css';

interface ProjectWorkflowNavigationProps {
  readonly currentSection: ProjectSection;
  readonly project: ProjectSummary;
}

interface WorkflowStep {
  readonly label: string;
  readonly number: string;
  readonly section: ProjectSection;
  readonly sublabel: string;
}

const workflowSteps: readonly WorkflowStep[] = [
  {
    number: '01',
    section: 'requirements',
    label: 'Requirements',
    sublabel: 'Define and approve scope',
  },
  {
    number: '02',
    section: 'codebase',
    label: 'Codebase',
    sublabel: 'Connect implementation',
  },
  {
    number: '03',
    section: 'report',
    label: 'Report',
    sublabel: 'Review verification results',
  },
];

const statusLabels: Readonly<Record<ProjectWorkflowStepStatus, string>> = {
  complete: 'Complete',
  'in-progress': 'In progress',
  'not-started': 'Not started',
  outdated: 'Outdated',
  'ready-for-review': 'Ready for review',
};

const statusClassNames: Readonly<Record<ProjectWorkflowStepStatus, string | undefined>> = {
  complete: styles.statusComplete,
  'in-progress': styles.statusInProgress,
  'not-started': styles.statusNotStarted,
  outdated: styles.statusOutdated,
  'ready-for-review': styles.statusReadyForReview,
};

function WorkflowArrow() {
  return (
    <svg
      aria-hidden="true"
      className={styles.arrow}
      fill="none"
      viewBox="0 0 32 20"
    >
      <path
        d="M1 10h28M21 2l8 8-8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ProjectWorkflowNavigation({
  currentSection,
  project,
}: ProjectWorkflowNavigationProps) {
  return (
    <nav aria-label={`${project.name} workflow`} className={styles.navigation}>
      <ol className={styles.steps}>
        {workflowSteps.map((step, index) => {
          const isCurrent = currentSection === step.section;
          const status = project.workflowStatuses[step.section];

          return (
            <li className={styles.step} key={step.section}>
              <AppLink
                ariaCurrent={isCurrent ? 'page' : undefined}
                className={`${styles.link} ${isCurrent ? styles.current : ''}`}
                to={projectPath(project.id, step.section)}
              >
                <span
                  aria-hidden="true"
                  className={`${styles.number} ${status === 'in-progress' ? styles.numberInProgress : ''}`}
                >
                  {status === 'in-progress' ? (
                    <Spinner decorative size={20} strokeWidth={2.5} />
                  ) : (
                    step.number
                  )}
                </span>
                <span className={styles.copy}>
                  <strong className={styles.label}>{step.label}</strong>
                  <span className={styles.sublabel}>{step.sublabel}</span>
                  <span className={`${styles.status} ${statusClassNames[status] ?? ''}`}>
                    <span aria-hidden="true" className={styles.statusDot} />
                    {statusLabels[status]}
                  </span>
                </span>
              </AppLink>
              {index < workflowSteps.length - 1 ? <WorkflowArrow /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
