import type { CSSProperties } from 'react';

import styles from './Spinner.module.css';

interface SpinnerProps {
  readonly className?: string | undefined;
  readonly decorative?: boolean;
  readonly label?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
}

export function Spinner({
  className,
  decorative,
  label,
  size = 40,
  strokeWidth = 4,
}: SpinnerProps) {
  const center = size / 2;
  const radius = Math.max(0, center - strokeWidth / 2);
  const isDecorative = decorative ?? !label;
  const rootStyle: CSSProperties = { width: size, height: size };

  return (
    <span
      aria-hidden={isDecorative ? true : undefined}
      aria-label={isDecorative ? undefined : label}
      className={`${styles.spinner} ${className ?? ''}`}
      data-spinner="true"
      role={isDecorative ? undefined : 'status'}
      style={rootStyle}
    >
      <svg
        aria-hidden="true"
        className={styles.icon}
        focusable="false"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        <circle
          className={styles.track}
          cx={center}
          cy={center}
          fill="none"
          pathLength="100"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <circle
          className={styles.arc}
          cx={center}
          cy={center}
          fill="none"
          pathLength="100"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      </svg>
    </span>
  );
}
