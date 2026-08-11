import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';

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

function fileMatchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept?.trim()) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  return accept.split(',').some((rawRule) => {
    const rule = rawRule.trim().toLowerCase();

    if (!rule) {
      return false;
    }

    if (rule.startsWith('.')) {
      return fileName.endsWith(rule);
    }

    if (rule.endsWith('/*')) {
      return mimeType.startsWith(rule.slice(0, -1));
    }

    return mimeType === rule;
  });
}

function containsFiles(event: DragEvent<HTMLDivElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files');
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.25A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
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
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function selectFiles(files: readonly File[]) {
    if (disabled || files.length === 0) {
      return;
    }

    const matchingFiles = files.filter((file) => fileMatchesAccept(file, accept));
    const selectedFiles = multiple ? matchingFiles : matchingFiles.slice(0, 1);
    const rejectedFiles = [
      ...files.filter((file) => !fileMatchesAccept(file, accept)),
      ...(multiple ? [] : matchingFiles.slice(1)),
    ];

    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }

    if (rejectedFiles.length > 0) {
      onFilesRejected?.(rejectedFiles);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!containsFiles(event)) {
      return;
    }

    event.preventDefault();

    if (disabled) {
      return;
    }

    dragDepthRef.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!containsFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (disabled || dragDepthRef.current === 0) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!containsFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    selectFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <div
      aria-describedby={descriptionId}
      aria-disabled={disabled || undefined}
      aria-labelledby={headingId}
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''} ${className ?? ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="group"
    >
      <input
        accept={accept}
        disabled={disabled}
        hidden
        multiple={multiple}
        onChange={handleInputChange}
        ref={inputRef}
        type="file"
      />
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
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
