import { forwardRef, type InputHTMLAttributes } from 'react';

import { CloseIcon, SearchIcon } from '../../icons/Icons';
import styles from './SearchInput.module.css';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...inputProps }, ref) => {
    const hasValue = value !== undefined && String(value).length > 0;

    return (
      <div className={`${styles.field} ${className ?? ''}`}>
        <SearchIcon className={styles.searchIcon} />
        <input {...inputProps} className={styles.input} ref={ref} type="search" value={value} />
        {hasValue && onClear ? (
          <button aria-label="Clear search" className={styles.clearButton} onClick={onClear} type="button">
            <CloseIcon />
          </button>
        ) : null}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
