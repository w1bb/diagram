import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import styles from './SplitView.module.css';

interface SplitViewProps {
  readonly children: ReactNode;
  readonly defaultLeadingSize: number;
  readonly isLeadingPaneVisible?: boolean;
  readonly leading: ReactNode;
  readonly leadingPaneId?: string;
  readonly maxLeadingSize: number;
  readonly minLeadingSize: number;
  readonly resizeLabel: string;
}

const KEYBOARD_STEP = 8;
const KEYBOARD_LARGE_STEP = 48;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function SplitView({
  children,
  defaultLeadingSize,
  isLeadingPaneVisible = true,
  leading,
  leadingPaneId,
  maxLeadingSize,
  minLeadingSize,
  resizeLabel,
}: SplitViewProps) {
  const generatedPaneId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [leadingSize, setLeadingSize] = useState(() =>
    clamp(defaultLeadingSize, minLeadingSize, maxLeadingSize),
  );

  const resolvedLeadingPaneId = leadingPaneId ?? generatedPaneId;
  const leadingPaneStyle: CSSProperties = {
    width: isLeadingPaneVisible ? `${leadingSize}px` : '0px',
  };

  function resizeTo(nextSize: number) {
    setLeadingSize(clamp(Math.round(nextSize), minLeadingSize, maxLeadingSize));
  }

  function resizeFromPointer(clientX: number) {
    const bounds = rootRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    resizeTo(clientX - bounds.left);
  }

  function startPointerResize(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
  }

  function continuePointerResize(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    resizeFromPointer(event.clientX);
  }

  function finishPointerResize(event: PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    setIsResizing(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleLostPointerCapture() {
    activePointerIdRef.current = null;
    setIsResizing(false);
  }

  function resetSize() {
    resizeTo(defaultLeadingSize);
  }

  function handleSeparatorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
    let nextSize: number | undefined;

    if (event.key === 'ArrowLeft') {
      nextSize = leadingSize - step;
    } else if (event.key === 'ArrowRight') {
      nextSize = leadingSize + step;
    } else if (event.key === 'PageUp') {
      nextSize = leadingSize - KEYBOARD_LARGE_STEP;
    } else if (event.key === 'PageDown') {
      nextSize = leadingSize + KEYBOARD_LARGE_STEP;
    } else if (event.key === 'Home') {
      nextSize = minLeadingSize;
    } else if (event.key === 'End') {
      nextSize = maxLeadingSize;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      resetSize();
      return;
    }

    if (nextSize === undefined) {
      return;
    }

    event.preventDefault();
    resizeTo(nextSize);
  }

  return (
    <div
      className={`${styles.splitView} ${isResizing ? styles.resizing : ''}`}
      ref={rootRef}
    >
      <div
        aria-hidden={isLeadingPaneVisible ? undefined : true}
        className={`${styles.leadingPane} ${isLeadingPaneVisible ? '' : styles.leadingPaneCollapsed}`}
        id={leadingPaneId ? undefined : generatedPaneId}
        inert={!isLeadingPaneVisible}
        style={leadingPaneStyle}
      >
        {leading}
      </div>

      <div
        aria-controls={resolvedLeadingPaneId}
        aria-hidden={isLeadingPaneVisible ? undefined : true}
        aria-label={resizeLabel}
        aria-orientation="vertical"
        aria-valuemax={maxLeadingSize}
        aria-valuemin={minLeadingSize}
        aria-valuenow={leadingSize}
        aria-valuetext={`${leadingSize} pixels`}
        className={`${styles.separator} ${isResizing ? styles.separatorActive : ''} ${isLeadingPaneVisible ? '' : styles.separatorHidden}`}
        onDoubleClick={resetSize}
        onKeyDown={handleSeparatorKeyDown}
        onLostPointerCapture={handleLostPointerCapture}
        onPointerCancel={finishPointerResize}
        onPointerDown={startPointerResize}
        onPointerMove={continuePointerResize}
        onPointerUp={finishPointerResize}
        role="separator"
        tabIndex={isLeadingPaneVisible ? 0 : -1}
      />

      <div className={styles.contentPane}>{children}</div>
    </div>
  );
}
