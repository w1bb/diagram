import type { HTMLAttributes } from 'react';

import styles from './Shimmer.module.css';

export function Shimmer({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={`${styles.shimmer}${className ? ` ${className}` : ''}`}
    />
  );
}
