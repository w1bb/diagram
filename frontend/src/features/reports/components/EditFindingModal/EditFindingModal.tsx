import { useEffect, useId, useState, type FormEvent } from 'react';

import { ReportIcon } from '../../../../components/icons/Icons';
import { Modal } from '../../../../components/overlay/Modal/Modal';
import type { FindingSeverity, ReportFinding } from '../../model/report';
import styles from './EditFindingModal.module.css';

interface EditFindingModalProps {
  readonly finding: ReportFinding | undefined;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (finding: ReportFinding) => void;
}

const severityOptions: readonly { label: string; value: FindingSeverity }[] = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
  { label: 'Info', value: 'info' },
];

export function EditFindingModal({
  finding,
  isOpen,
  onClose,
  onSave,
}: EditFindingModalProps) {
  const formId = useId();
  const severityId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const solutionId = useId();
  const [severity, setSeverity] = useState<FindingSeverity>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');

  useEffect(() => {
    if (!isOpen || !finding) {
      return;
    }

    setSeverity(finding.severity);
    setTitle(finding.label);
    setDescription(finding.description);
    setSolution(finding.solutionProposal);
  }, [finding, isOpen]);

  const isValid = title.trim().length > 0
    && description.trim().length > 0
    && solution.trim().length > 0;

  function submitFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!finding || !isValid) {
      return;
    }

    onSave({
      ...finding,
      description: description.trim(),
      label: title.trim(),
      severity,
      solutionProposal: solution.trim(),
    });
  }

  return (
    <Modal
      className={styles.modal}
      description="Update the finding details used by this fixture-backed report."
      footer={(
        <>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Close
          </button>
          <button
            className={styles.saveButton}
            disabled={!finding || !isValid}
            form={formId}
            type="submit"
          >
            Save changes
          </button>
        </>
      )}
      icon={<ReportIcon />}
      isOpen={isOpen}
      onClose={onClose}
      title="Edit finding"
    >
      <form className={styles.form} id={formId} onSubmit={submitFinding}>
        <div className={styles.field}>
          <label htmlFor={severityId}>Severity</label>
          <select
            id={severityId}
            onChange={(event) => setSeverity(event.currentTarget.value as FindingSeverity)}
            value={severity}
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor={titleId}>Title</label>
          <input
            data-autofocus="true"
            id={titleId}
            onChange={(event) => setTitle(event.currentTarget.value)}
            required
            type="text"
            value={title}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={descriptionId}>Description</label>
          <textarea
            id={descriptionId}
            onChange={(event) => setDescription(event.currentTarget.value)}
            required
            rows={5}
            spellCheck="true"
            value={description}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={solutionId}>Proposed solution</label>
          <textarea
            id={solutionId}
            onChange={(event) => setSolution(event.currentTarget.value)}
            required
            rows={5}
            spellCheck="true"
            value={solution}
          />
        </div>

        <p className={styles.hint}>All text fields are required. Changes remain in this browser session only.</p>
      </form>
    </Modal>
  );
}
