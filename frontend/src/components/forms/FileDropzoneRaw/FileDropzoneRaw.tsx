import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface FileDropzoneRawRenderProps {
  readonly isDragging: boolean;
  readonly openFilePicker: () => void;
}

export interface FileDropzoneRawProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop'
  > {
  readonly accept?: string | undefined;
  readonly children: (props: FileDropzoneRawRenderProps) => ReactNode;
  readonly disabled?: boolean;
  readonly draggingClassName?: string | undefined;
  readonly multiple?: boolean;
  readonly onFilesRejected?: ((files: readonly File[]) => void) | undefined;
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

export function FileDropzoneRaw({
  accept,
  children,
  className,
  disabled = false,
  draggingClassName,
  multiple = true,
  onFilesRejected,
  onFilesSelected,
  ...rootProps
}: FileDropzoneRawProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    dragDepthRef.current = 0;
    setIsDragging(false);
  }, [disabled]);

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

  function openFilePicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  return (
    <div
      {...rootProps}
      aria-disabled={disabled || rootProps['aria-disabled']}
      className={`${className ?? ''} ${isDragging ? draggingClassName ?? '' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
      {children({ isDragging, openFilePicker })}
    </div>
  );
}
