import { Spinner } from '../../../../components/feedback/Spinner/Spinner';
import { CheckIcon, CircleXIcon } from '../../../../components/icons/Icons';
import {
  requirementProcessingStatusLabels,
  type RequirementProcessingStage,
} from '../../model/requirementProcessing';
import styles from './RequirementsProcessingDiagram.module.css';

interface RequirementsProcessingDiagramProps {
  readonly stages: readonly RequirementProcessingStage[];
}

export function RequirementsProcessingDiagram({
  stages,
}: RequirementsProcessingDiagramProps) {
  const activeStage = stages.find((stage) => stage.status === 'in-progress');
  const failedStage = stages.find((stage) => stage.status === 'failed');
  const completedStageCount = stages.filter((stage) => stage.status === 'completed').length;
  const liveStatus = failedStage
    ? `${failedStage.label} failed.`
    : activeStage
      ? `${activeStage.label} in progress. ${completedStageCount} of ${stages.length} steps completed.`
      : completedStageCount === stages.length
        ? `Requirements processing completed. ${stages.length} of ${stages.length} steps completed.`
        : 'Requirements processing has not started.';

  return (
    <div className={styles.root}>
      <div className={styles.heading}>
        <div>
          <p>Processing pipeline</p>
          <h3>From source files to final requirements</h3>
        </div>
        <span>{completedStageCount} of {stages.length} completed</span>
      </div>

      <ol aria-label="Requirements processing stages" className={styles.stageList}>
        {stages.map((stage, index) => (
          <li
            aria-current={stage.status === 'in-progress' ? 'step' : undefined}
            className={`${styles.stage} ${styles[stage.status] ?? ''}`}
            key={stage.id}
          >
            <div className={styles.markerColumn}>
              <span aria-hidden="true" className={styles.marker}>
                {stage.status === 'in-progress' ? (
                  <Spinner decorative size={18} strokeWidth={2.5} />
                ) : stage.status === 'completed' ? (
                  <CheckIcon />
                ) : stage.status === 'failed' ? (
                  <CircleXIcon />
                ) : (
                  index + 1
                )}
              </span>
              {index < stages.length - 1 ? <span aria-hidden="true" className={styles.connector} /> : null}
            </div>
            <div className={styles.stageContent}>
              <strong>{stage.label}</strong>
              <span>{stage.description}</span>
              <small>{requirementProcessingStatusLabels[stage.status]}</small>
            </div>
          </li>
        ))}
      </ol>

      <p aria-live="polite" className={styles.liveStatus}>{liveStatus}</p>
    </div>
  );
}
