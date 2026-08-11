import styles from './NumberChip.module.css';

interface NumberChipProps {
  readonly label?: string;
  readonly tone?: 'neutral' | 'strong';
  readonly value: number;
}

export function NumberChip({ label, tone = 'neutral', value }: NumberChipProps) {
  return (
    <span
      className={`${styles.chip} ${tone === 'strong' ? styles.strong : styles.neutral}`}
      data-number-chip={tone}
    >
      {label ? <span className={styles.visuallyHidden}>{label}: </span> : null}
      {value}
    </span>
  );
}
