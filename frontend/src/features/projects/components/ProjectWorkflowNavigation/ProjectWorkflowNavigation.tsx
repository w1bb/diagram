import { useId, useRef, useState, type TransitionEvent } from 'react';

import { AppLink } from '../../../../app/routing/RouterProvider';
import { projectPath } from '../../../../app/routing/routes';
import { Spinner } from '../../../../components/feedback/Spinner/Spinner';
import { ArrowIcon, CaretIcon, CloseIcon } from '../../../../components/icons/Icons';
import type {
  ProjectSummary,
  ProjectWorkflowSection,
  ProjectWorkflowStepStatus,
} from '../../model/project';
import { useProjectWorkflowNavigation } from '../../providers/ProjectWorkflowNavigationProvider';
import styles from './ProjectWorkflowNavigation.module.css';

interface ProjectWorkflowNavigationProps {
  readonly currentSection: ProjectWorkflowSection;
  readonly project: ProjectSummary;
}

interface WorkflowStep {
  readonly label: string;
  readonly number: string;
  readonly section: ProjectWorkflowSection;
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

export function ProjectWorkflowNavigation({
  currentSection,
  project,
}: ProjectWorkflowNavigationProps) {
  const drawerId = useId();
  const hideButtonRef = useRef<HTMLButtonElement>(null);
  const showButtonRef = useRef<HTMLButtonElement>(null);
  const { isWorkflowNavigationVisible, toggleWorkflowNavigation } =
    useProjectWorkflowNavigation();
  const [isShowControlVisible, setIsShowControlVisible] = useState(
    () => !isWorkflowNavigationVisible,
  );
  const shouldFocusShowButtonRef = useRef(false);

  function hideWorkflowNavigation() {
    hideButtonRef.current?.blur();
    shouldFocusShowButtonRef.current = true;
    setIsShowControlVisible(false);
    toggleWorkflowNavigation();
  }

  function showWorkflowNavigation() {
    shouldFocusShowButtonRef.current = false;
    setIsShowControlVisible(false);
    toggleWorkflowNavigation();
    window.requestAnimationFrame(() => hideButtonRef.current?.focus());
  }

  function finishClosingDrawer(event: TransitionEvent<HTMLDivElement>) {
    if (
      event.currentTarget !== event.target ||
      event.propertyName !== 'grid-template-rows' ||
      isWorkflowNavigationVisible
    ) {
      return;
    }

    setIsShowControlVisible(true);

    if (shouldFocusShowButtonRef.current) {
      shouldFocusShowButtonRef.current = false;
      window.requestAnimationFrame(() => showButtonRef.current?.focus());
    }
  }

  return (
    <div
      className={`${styles.wrapper} ${isWorkflowNavigationVisible ? '' : styles.wrapperCollapsed}`}
    >
      {isShowControlVisible ? (
        <div className={styles.showControl}>
          <button
            aria-controls={drawerId}
            aria-expanded={false}
            aria-label="Show workflow navigation"
            className={styles.showButton}
            onClick={showWorkflowNavigation}
            ref={showButtonRef}
            title="Show workflow navigation"
            type="button"
          >
            <CaretIcon />
          </button>
        </div>
      ) : null}

      <div
        aria-hidden={!isWorkflowNavigationVisible}
        className={`${styles.drawer} ${isWorkflowNavigationVisible ? styles.drawerOpen : ''}`}
        id={drawerId}
        inert={!isWorkflowNavigationVisible}
        onTransitionEnd={finishClosingDrawer}
      >
        <div className={styles.drawerInner}>
          <div className={styles.drawerContent}>
            <nav aria-label={`${project.name} workflow`}>
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
                      {index < workflowSteps.length - 1 ? (
                        <ArrowIcon className={styles.arrow} strokeWidth={1.5} />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </nav>

            <button
              aria-controls={drawerId}
              aria-expanded={true}
              aria-label="Hide workflow navigation"
              className={styles.hideButton}
              onClick={hideWorkflowNavigation}
              ref={hideButtonRef}
              title="Hide workflow navigation"
              type="button"
            >
              <CloseIcon strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
