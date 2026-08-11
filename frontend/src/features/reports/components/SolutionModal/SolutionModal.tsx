import { useId } from 'react';

import { DownloadIcon, ReportIcon } from '../../../../components/icons/Icons';
import { Modal } from '../../../../components/overlay/Modal/Modal';
import styles from './SolutionModal.module.css';

interface SolutionModalProps {
  readonly content: string;
  readonly isOpen: boolean;
  readonly onChange: (content: string) => void;
  readonly onClose: () => void;
  readonly onDownload: () => void;
}

export function SolutionModal({
  content,
  isOpen,
  onChange,
  onClose,
  onDownload,
}: SolutionModalProps) {
  const textareaId = useId();

  return (
    <Modal
      className={styles.modal}
      description="Review and edit the mocked proposal, then download it as a Markdown file."
      footer={(
        <>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Close
          </button>
          <button
            className={styles.downloadButton}
            disabled={content.trim().length === 0}
            onClick={onDownload}
            type="button"
          >
            <DownloadIcon />
            Download Markdown
          </button>
        </>
      )}
      icon={<ReportIcon />}
      isOpen={isOpen}
      onClose={onClose}
      title="Proposed solution"
    >
      <label className={styles.label} htmlFor={textareaId}>
        Solution content
      </label>
      <textarea
        className={styles.textarea}
        data-autofocus="true"
        id={textareaId}
        onChange={(event) => onChange(event.currentTarget.value)}
        spellCheck="true"
        value={content}
      />
      <p className={styles.hint}>The text is session-local and is not saved to this report.</p>
    </Modal>
  );
}
