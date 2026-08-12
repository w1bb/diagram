import { DownloadIcon, ReportIcon } from '../../../../components/icons/Icons';
import { Modal } from '../../../../components/overlay/Modal/Modal';
import type { ConvertedMarkdownDocument } from '../../model/requirementProcessing';
import styles from './MarkdownPreviewModal.module.css';

interface MarkdownPreviewModalProps {
  readonly document: ConvertedMarkdownDocument | undefined;
  readonly onClose: () => void;
}

export function MarkdownPreviewModal({
  document,
  onClose,
}: MarkdownPreviewModalProps) {
  return (
    <Modal
      className={styles.modal}
      description={document
        ? `Review the converted Markdown preview for “${document.sourceFilename}” and download the generated artifact.`
        : undefined}
      footer={document ? (
        <>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Close
          </button>
          <a
            className={styles.downloadButton}
            download={document.filename}
            href={document.downloadUrl}
          >
            <DownloadIcon />
            Download Markdown
          </a>
        </>
      ) : undefined}
      icon={<ReportIcon />}
      isOpen={document !== undefined}
      onClose={onClose}
      title="Markdown preview"
    >
      {document ? (
        <>
          <span className={styles.label}>Converted content</span>
          <pre className={styles.preview} data-autofocus="true" tabIndex={0}>{document.content}</pre>
          <p className={styles.hint}>This mocked artifact is session-local and was not created by a backend converter.</p>
        </>
      ) : null}
    </Modal>
  );
}
