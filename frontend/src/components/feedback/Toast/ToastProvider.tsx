import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';

import { CloseIcon } from '../../icons/Icons';
import { Spinner } from '../Spinner/Spinner';
import { toast, toastStore, type ToastItem, type ToastVariant } from './toastStore';
import styles from './ToastProvider.module.css';

type ToastPlacement =
  | 'top start'
  | 'top'
  | 'top end'
  | 'bottom start'
  | 'bottom'
  | 'bottom end';

interface ToastProviderProps {
  readonly gap?: number;
  readonly maxVisibleToasts?: number;
  readonly placement?: ToastPlacement;
  readonly scaleFactor?: number;
  readonly width?: number | string;
}

interface ToastCardProps {
  readonly frontHeight: number;
  readonly index: number;
  readonly isPaused: boolean;
  readonly isTopPlacement: boolean;
  readonly item: ToastItem;
  readonly maxVisibleToasts: number;
  readonly onFrontHeightChange: (height: number) => void;
  readonly scaleFactor: number;
  readonly stackGap: number;
}

const DEFAULT_TIMEOUT = 4000;

const variantClassNames: Readonly<Record<ToastVariant, string | undefined>> = {
  default: undefined,
  accent: styles.variantAccent,
  success: styles.variantSuccess,
  warning: styles.variantWarning,
  danger: styles.variantDanger,
};

const placementClassNames: Readonly<Record<ToastPlacement, string | undefined>> = {
  'top start': styles.topStart,
  top: styles.top,
  'top end': styles.topEnd,
  'bottom start': styles.bottomStart,
  bottom: styles.bottom,
  'bottom end': styles.bottomEnd,
};

function StatusIcon({ variant }: { readonly variant: ToastVariant }) {
  if (variant === 'success') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="m6.8 10.2 2 2 4.5-4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (variant === 'warning') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 3 18 17H2L10 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
        <path d="M10 7.5v4M10 14.3v.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (variant === 'danger') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="m7.5 7.5 5 5M12.5 7.5l-5 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v4M10 6.4v.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function ToastTimer({ isPaused, item }: { readonly isPaused: boolean; readonly item: ToastItem }) {
  const remainingTimeRef = useRef(item.timeout ?? DEFAULT_TIMEOUT);

  useEffect(() => {
    if (isPaused || item.isLoading || item.state === 'exiting' || remainingTimeRef.current <= 0) {
      return;
    }

    const startedAt = performance.now();
    const timer = window.setTimeout(() => toast.close(item.id), remainingTimeRef.current);

    return () => {
      window.clearTimeout(timer);
      remainingTimeRef.current = Math.max(
        0,
        remainingTimeRef.current - (performance.now() - startedAt),
      );
    };
  }, [isPaused, item.id, item.isLoading, item.state]);

  return null;
}

function ToastCard({
  frontHeight,
  index,
  isPaused,
  isTopPlacement,
  item,
  maxVisibleToasts,
  onFrontHeightChange,
  scaleFactor,
  stackGap,
}: ToastCardProps) {
  const toastRef = useRef<HTMLDivElement>(null);
  const isFrontmost = index === 0;
  const isHidden = index >= maxVisibleToasts;

  useLayoutEffect(() => {
    if (!isFrontmost || !toastRef.current) {
      return;
    }

    const toastElement = toastRef.current;
    const measure = () => onFrontHeightChange(toastElement.getBoundingClientRect().height);
    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(toastElement);
    return () => observer.disconnect();
  }, [isFrontmost, onFrontHeightChange]);

  const toastStyle: CSSProperties = {
    height: !isFrontmost && frontHeight > 0 ? frontHeight : undefined,
    opacity: isHidden ? 0 : 1,
    pointerEvents: isHidden ? 'none' : undefined,
    scale: `${Math.max(0, 1 - index * scaleFactor)}`,
    translate: `0 ${(isTopPlacement ? 1 : -1) * index * stackGap}px`,
    zIndex: 20 - index,
  };

  return (
    <div
      aria-hidden={isHidden ? true : undefined}
      className={`${styles.toast} ${isTopPlacement ? styles.toastTop : styles.toastBottom} ${variantClassNames[item.variant] ?? ''} ${item.state === 'exiting' ? styles.toastExiting : styles.toastEntering}`}
      data-frontmost={isFrontmost ? 'true' : 'false'}
      data-index={index}
      data-toast-id={item.id}
      ref={toastRef}
      role={item.variant === 'danger' ? 'alert' : 'status'}
      style={toastStyle}
      tabIndex={isFrontmost ? 0 : -1}
    >
      <ToastTimer isPaused={isPaused} item={item} />
      {item.indicator === null ? null : (
        <span className={styles.indicator}>
          {item.isLoading ? (
            <Spinner decorative size={16} strokeWidth={2} />
          ) : (
            item.indicator ?? <StatusIcon variant={item.variant} />
          )}
        </span>
      )}
      <div className={styles.content}>
        <span className={styles.title}>{item.title}</span>
        {item.description ? <span className={styles.description}>{item.description}</span> : null}
        {item.action ? (
          <button
            className={styles.mobileAction}
            onClick={item.action.onPress}
            tabIndex={isFrontmost ? 0 : -1}
            type="button"
          >
            {item.action.label}
          </button>
        ) : null}
      </div>
      {item.action ? (
        <button
          className={styles.action}
          onClick={item.action.onPress}
          tabIndex={isFrontmost ? 0 : -1}
          type="button"
        >
          {item.action.label}
        </button>
      ) : null}
      <button
        aria-label="Close"
        className={styles.closeButton}
        onClick={() => toast.close(item.id)}
        tabIndex={isFrontmost ? 0 : -1}
        type="button"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export function ToastProvider({
  gap = 12,
  maxVisibleToasts = 3,
  placement = 'bottom',
  scaleFactor = 0.05,
  width = 460,
}: ToastProviderProps) {
  const { isPaused, items } = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getSnapshot,
  );
  const [frontHeight, setFrontHeight] = useState(0);
  const isTopPlacement = placement.startsWith('top');
  const regionStyle: CSSProperties = {
    maxWidth: 'calc(100% - 32px)',
    width: typeof width === 'number' ? `min(${width}px, calc(100% - 32px))` : width,
  };

  useEffect(() => {
    if (items.length === 0 && isPaused) {
      toast.resumeAll();
    }
  }, [isPaused, items.length]);

  if (items.length === 0) {
    return null;
  }

  return createPortal(
    <section
      aria-label="Notifications"
      className={`${styles.region} ${placementClassNames[placement] ?? ''}`}
      data-placement={placement}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          toast.resumeAll();
        }
      }}
      onFocusCapture={() => toast.pauseAll()}
      onMouseEnter={() => toast.pauseAll()}
      onMouseLeave={() => toast.resumeAll()}
      style={regionStyle}
    >
      {items.map((item, index) => (
        <ToastCard
          frontHeight={frontHeight}
          index={index}
          isPaused={isPaused}
          isTopPlacement={isTopPlacement}
          item={item}
          key={item.id}
          maxVisibleToasts={maxVisibleToasts}
          onFrontHeightChange={setFrontHeight}
          scaleFactor={scaleFactor}
          stackGap={gap}
        />
      ))}
    </section>,
    document.body,
  );
}
