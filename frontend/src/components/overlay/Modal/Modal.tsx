import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { CloseIcon } from '../../icons/Icons';
import styles from './Modal.module.css';

interface ModalProps {
  readonly children?: ReactNode;
  readonly className?: string | undefined;
  readonly description?: ReactNode;
  readonly footer?: ReactNode;
  readonly icon?: ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
}

const EXIT_DURATION = 100;

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
}

export function Modal({
  children,
  className,
  description,
  footer,
  icon,
  isOpen,
  onClose,
  title,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      if (!isMounted) {
        restoreFocusRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      setIsMounted(true);
      setIsExiting(false);
      return;
    }

    if (!isMounted) {
      return;
    }

    setIsExiting(true);
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const exitTimer = window.setTimeout(
      () => {
        setIsMounted(false);
        setIsExiting(false);
      },
      shouldReduceMotion ? 0 : EXIT_DURATION,
    );

    return () => window.clearTimeout(exitTimer);
  }, [isMounted, isOpen]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      const preferredFocus = dialog?.querySelector<HTMLElement>(
        '[data-autofocus="true"], [autofocus]',
      );
      const firstFocusableElement = dialog ? getFocusableElements(dialog)[0] : undefined;
      (preferredFocus ?? firstFocusableElement ?? dialog)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousBodyOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [isMounted]);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCloseRef.current();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const focusableElements = getFocusableElements(dialog);
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements.at(-1);

    if (!firstFocusableElement || !lastFocusableElement) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === firstFocusableElement) {
      event.preventDefault();
      lastFocusableElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onCloseRef.current();
    }
  }

  if (!isMounted) {
    return null;
  }

  const backdropMotionClass = isExiting ? styles.backdropExiting : styles.backdropEntering;
  const panelMotionClass = isExiting ? styles.panelExiting : styles.panelEntering;

  return createPortal(
    <div className={styles.modalRoot}>
      <div aria-hidden="true" className={`${styles.backdrop} ${backdropMotionClass}`} />
      <div className={styles.positioner} onMouseDown={handleBackdropClick}>
        <div
          aria-describedby={description ? descriptionId : undefined}
          aria-labelledby={titleId}
          aria-modal="true"
          className={`${styles.panel} ${panelMotionClass} ${className ?? ''}`}
          onKeyDown={handleDialogKeyDown}
          ref={dialogRef}
          role="dialog"
          tabIndex={-1}
        >
          <div className={styles.header}>
            {icon ? <span className={styles.icon}>{icon}</span> : null}
            <div className={styles.heading}>
              <h2 id={titleId}>{title}</h2>
              {description ? <p id={descriptionId}>{description}</p> : null}
            </div>
            <button
              aria-label="Close dialog"
              className={styles.closeButton}
              onClick={() => onCloseRef.current()}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          {children ? <div className={styles.body}>{children}</div> : null}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
