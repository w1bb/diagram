import { useId, type ReactNode } from 'react';

import { UploadIcon } from '../../icons/Icons';
import { FileDropzoneRaw } from '../FileDropzoneRaw/FileDropzoneRaw';
import styles from './FileDropzone.module.css';

export interface FileDropzoneProps {
  readonly accept?: string;
  readonly buttonClassName?: string;
  readonly buttonLabel?: string;
  readonly className?: string;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly heading?: string;
  readonly icon?: ReactNode;
  readonly multiple?: boolean;
  readonly onFilesRejected?: (files: readonly File[]) => void;
  readonly onFilesSelected: (files: readonly File[]) => void;
}

export function FileDropzone({
  accept,
  buttonClassName,
  buttonLabel = 'Choose files',
  className,
  description = 'Drop files in this area or choose them from your device.',
  disabled = false,
  heading = 'Drag and drop files here',
  icon,
  multiple = true,
  onFilesRejected,
  onFilesSelected,
}: FileDropzoneProps) {
  const descriptionId = useId();
  const headingId = useId();

  return (
    <FileDropzoneRaw
      accept={accept}
      aria-describedby={descriptionId}
      aria-labelledby={headingId}
      className={`${styles.dropzone} ${disabled ? styles.disabled : ''} ${className ?? ''}`}
      disabled={disabled}
      draggingClassName={styles.dragging}
      multiple={multiple}
      onFilesRejected={onFilesRejected}
      onFilesSelected={onFilesSelected}
      role="group"
    >
      {({ openFilePicker }) => (
        <>
          {icon === null ? null : (
            <span className={styles.icon}>
              {icon ?? <UploadIcon />}
            </span>
          )}
          <strong className={styles.heading} id={headingId}>{heading}</strong>
          <span className={styles.description} id={descriptionId}>{description}</span>
          <button
            className={`${styles.button} ${buttonClassName ?? ''}`}
            disabled={disabled}
            onClick={openFilePicker}
            type="button"
          >
            {buttonLabel}
          </button>
        </>
      )}
    </FileDropzoneRaw>
  );
}
