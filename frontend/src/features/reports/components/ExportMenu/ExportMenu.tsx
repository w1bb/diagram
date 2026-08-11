import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import { CaretIcon, DownloadIcon } from '../../../../components/icons/Icons';
import type { ReportExportFormat } from '../../model/report';
import styles from './ExportMenu.module.css';

interface ExportMenuProps {
  readonly disabled?: boolean;
  readonly onSelect: (format: ReportExportFormat) => void;
}

interface ExportOption {
  readonly description: string;
  readonly extension: string;
  readonly format: ReportExportFormat;
  readonly label: string;
}

const exportOptions: readonly ExportOption[] = [
  {
    format: 'pdf',
    label: 'PDF document',
    extension: '.pdf',
    description: 'Print-ready layout',
  },
  {
    format: 'html',
    label: 'HTML page',
    extension: '.html',
    description: 'Standalone web document',
  },
  {
    format: 'markdown',
    label: 'Markdown',
    extension: '.md',
    description: 'Portable plain text',
  },
];

export function ExportMenu({ disabled = false, onSelect }: ExportMenuProps) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  function focusItem(index: number) {
    window.requestAnimationFrame(() => itemRefs.current[index]?.focus());
  }

  function openFromKeyboard(index: number) {
    setIsOpen(true);
    focusItem(index);
  }

  function handleButtonKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openFromKeyboard(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openFromKeyboard(exportOptions.length - 1);
    }
  }

  function handleItemKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem((index + 1) % exportOptions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem((index - 1 + exportOptions.length) % exportOptions.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(exportOptions.length - 1);
    } else if (event.key === 'Tab') {
      setIsOpen(false);
    }
  }

  function selectFormat(format: ReportExportFormat) {
    setIsOpen(false);
    onSelect(format);
    buttonRef.current?.focus();
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={styles.trigger}
        disabled={disabled}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        onKeyDown={handleButtonKeyDown}
        ref={buttonRef}
        type="button"
      >
        <DownloadIcon />
        <span>Export</span>
        <CaretIcon className={`${styles.caret} ${isOpen ? styles.caretOpen : ''}`} />
      </button>

      {isOpen ? (
        <div aria-label="Export formats" className={styles.menu} id={menuId} role="menu">
          {exportOptions.map((option, index) => (
            <button
              className={styles.option}
              key={option.format}
              onClick={() => selectFormat(option.format)}
              onKeyDown={(event) => handleItemKeyDown(event, index)}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              role="menuitem"
              type="button"
            >
              <span className={styles.optionCopy}>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
              <span className={styles.extension}>{option.extension}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
