import { useId } from 'react';

import { CaretIcon } from '../../../../components/icons/Icons';
import {
  requirementPriorityLabels,
  requirementAnchorId,
  requirementTypeLabels,
  type DetectedRequirement,
  type RequirementPriority,
} from '../../model/requirement';
import styles from './RequirementAccordion.module.css';

interface RequirementAccordionProps {
  readonly index: number;
  readonly isExpanded: boolean;
  readonly isTargeted?: boolean;
  readonly onToggle: () => void;
  readonly requirement: DetectedRequirement;
}

const priorityClassNames: Readonly<Record<RequirementPriority, string | undefined>> = {
  critical: styles.priorityCritical,
  high: styles.priorityHigh,
  medium: styles.priorityMedium,
  low: styles.priorityLow,
  unspecified: styles.priorityUnspecified,
};

export function RequirementAccordion({
  index,
  isExpanded,
  isTargeted = false,
  onToggle,
  requirement,
}: RequirementAccordionProps) {
  const panelId = useId();

  return (
    <li
      className={`${styles.item} ${isTargeted ? styles.targeted : ''}`}
      id={requirementAnchorId(requirement.id)}
    >
      <button
        aria-controls={panelId}
        aria-expanded={isExpanded}
        className={styles.header}
        onClick={onToggle}
        type="button"
      >
        <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.summary}>
          <strong>{requirement.label}</strong>
          <span className={styles.description}>{requirement.description}</span>
          <span className={styles.chips}>
            <span
              className={`${styles.chip} ${priorityClassNames[requirement.priority] ?? ''}`}
              data-priority={requirement.priority}
            >
              {requirementPriorityLabels[requirement.priority]} priority
            </span>
            <span
              className={`${styles.chip} ${styles.typeChip}`}
              data-requirement-type={requirement.type}
            >
              {requirementTypeLabels[requirement.type]}
            </span>
          </span>
        </span>
        <CaretIcon className={`${styles.caret} ${isExpanded ? styles.caretExpanded : ''}`} />
      </button>

      <div
        aria-hidden={!isExpanded}
        className={`${styles.panel} ${isExpanded ? styles.panelExpanded : ''}`}
        id={panelId}
      >
        <div className={styles.panelInner}>
          <div className={styles.body}>
            <section className={styles.evidenceSection}>
              <h3>Source</h3>
              <div className={styles.sourceReference}>
                <strong>{requirement.source.filename}</strong>
                <span>{requirement.source.locator}</span>
              </div>
            </section>

            <section className={styles.evidenceSection}>
              <h3>Raw content</h3>
              <blockquote>{requirement.rawContent}</blockquote>
            </section>

            <section className={styles.evidenceSection}>
              <h3>Near duplicates</h3>
              {requirement.nearDuplicates.length > 0 ? (
                <ul className={styles.duplicates}>
                  {requirement.nearDuplicates.map((duplicate) => (
                    <li key={`${duplicate.label}:${duplicate.similarityScore}`}>
                      <div className={styles.duplicateTopline}>
                        <strong>{duplicate.label}</strong>
                        <span>{Math.round(duplicate.similarityScore * 100)}% match</span>
                      </div>
                      <p>{duplicate.reasoning}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noDuplicates}>No close duplicate candidates were detected.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </li>
  );
}
