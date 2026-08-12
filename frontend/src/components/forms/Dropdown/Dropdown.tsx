import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

import { CaretIcon, CheckIcon } from '../../icons/Icons';
import styles from './Dropdown.module.css';

export interface DropdownOption<Value extends string> {
  readonly description?: ReactNode;
  readonly disabled?: boolean;
  readonly endContent?: ReactNode;
  readonly label: ReactNode;
  readonly selectedLabel?: ReactNode;
  readonly textValue?: string;
  readonly value: Value;
}

interface DropdownBaseProps<Value extends string> {
  readonly align?: 'start' | 'end';
  readonly className?: string | undefined;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly options: readonly DropdownOption<Value>[];
  readonly popoverLabel?: string;
  readonly variant?: 'primary' | 'secondary' | 'accent';
}

interface SelectionDropdownProps<Value extends string> extends DropdownBaseProps<Value> {
  readonly 'aria-describedby'?: string;
  readonly 'aria-label'?: string;
  readonly mode?: 'selection';
  readonly onChange: (value: Value) => void;
  readonly onAction?: never;
  readonly placeholder?: string;
  readonly trigger?: never;
  readonly value: Value | undefined;
}

interface MenuDropdownProps<Value extends string> extends DropdownBaseProps<Value> {
  readonly 'aria-describedby'?: never;
  readonly 'aria-label': string;
  readonly mode: 'menu';
  readonly onAction: (value: Value) => void;
  readonly onChange?: never;
  readonly placeholder?: never;
  readonly trigger: ReactNode;
  readonly value?: never;
}

export type DropdownProps<Value extends string> =
  | SelectionDropdownProps<Value>
  | MenuDropdownProps<Value>;

const TYPEAHEAD_RESET_DELAY = 650;
const POPOVER_EXIT_DURATION = 100;

function joinClassNames(...classNames: Array<string | undefined | false>): string {
  return classNames.filter(Boolean).join(' ');
}

export function Dropdown<Value extends string>({
  align = 'start',
  className,
  disabled = false,
  id,
  options,
  popoverLabel,
  variant = 'primary',
  ...props
}: DropdownProps<Value>) {
  const generatedId = useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const popoverId = `${generatedId}-popover`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const exitTimerRef = useRef<number | undefined>(undefined);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<number | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const isMenu = props.mode === 'menu';
  const isDisabled = disabled || options.length === 0;
  const selectedIndex = isMenu
    ? -1
    : options.findIndex((option) => option.value === props.value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => () => {
    if (exitTimerRef.current !== undefined) {
      window.clearTimeout(exitTimerRef.current);
    }

    if (typeaheadTimerRef.current !== undefined) {
      window.clearTimeout(typeaheadTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    }

    function handleResize() {
      closeDropdown();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.focus();
      optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (isDisabled && isOpen) {
      closeDropdown();
    }
  }, [isDisabled, isOpen]);

  function enabledIndices(): number[] {
    return options.reduce<number[]>((indices, option, index) => {
      if (!option.disabled) {
        indices.push(index);
      }

      return indices;
    }, []);
  }

  function firstEnabledIndex(): number {
    return enabledIndices()[0] ?? -1;
  }

  function lastEnabledIndex(): number {
    return enabledIndices().at(-1) ?? -1;
  }

  function initialIndex(preferLast = false): number {
    if (!isMenu && selectedIndex >= 0 && !options[selectedIndex]?.disabled) {
      return selectedIndex;
    }

    return preferLast ? lastEnabledIndex() : firstEnabledIndex();
  }

  function updatePlacement() {
    const triggerBounds = triggerRef.current?.getBoundingClientRect();

    if (!triggerBounds) {
      return;
    }

    const estimatedPopoverHeight = Math.min(280, options.length * 50 + 12);
    const spaceBelow = window.innerHeight - triggerBounds.bottom;
    const spaceAbove = triggerBounds.top;
    setPlacement(
      spaceBelow < Math.min(estimatedPopoverHeight, 180) && spaceAbove > spaceBelow
        ? 'top'
        : 'bottom',
    );
  }

  function openDropdown(index = initialIndex()) {
    if (isDisabled) {
      return;
    }

    if (exitTimerRef.current !== undefined) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = undefined;
    }

    updatePlacement();
    setActiveIndex(index);
    setIsMounted(true);
    setIsExiting(false);
    setIsOpen(true);
  }

  function closeDropdown(restoreTriggerFocus = false) {
    if (!isOpen || isExiting) {
      if (restoreTriggerFocus) {
        triggerRef.current?.focus();
      }

      return;
    }

    setIsOpen(false);
    setIsExiting(true);
    typeaheadRef.current = '';

    if (restoreTriggerFocus) {
      triggerRef.current?.focus();
    }

    if (exitTimerRef.current !== undefined) {
      window.clearTimeout(exitTimerRef.current);
    }

    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    exitTimerRef.current = window.setTimeout(
      () => {
        setIsMounted(false);
        setIsExiting(false);
        exitTimerRef.current = undefined;
      },
      shouldReduceMotion ? 0 : POPOVER_EXIT_DURATION,
    );
  }

  function moveActive(direction: 1 | -1) {
    const indices = enabledIndices();

    if (indices.length === 0) {
      return;
    }

    const currentPosition = indices.indexOf(activeIndex);
    const nextPosition = currentPosition < 0
      ? direction > 0 ? 0 : indices.length - 1
      : (currentPosition + direction + indices.length) % indices.length;
    focusOption(indices[nextPosition] ?? -1);
  }

  function focusOption(index: number) {
    if (index < 0) {
      return;
    }

    setActiveIndex(index);
    optionRefs.current[index]?.focus();
    optionRefs.current[index]?.scrollIntoView({ block: 'nearest' });
  }

  function optionText(option: DropdownOption<Value>): string {
    if (option.textValue) {
      return option.textValue;
    }

    return typeof option.label === 'string' ? option.label : '';
  }

  function handleTypeahead(event: ReactKeyboardEvent<HTMLElement>) {
    if (
      event.key.length !== 1
      || event.ctrlKey
      || event.metaKey
      || event.altKey
      || event.key.trim().length === 0
    ) {
      return false;
    }

    event.preventDefault();
    typeaheadRef.current += event.key.toLocaleLowerCase();

    if (typeaheadTimerRef.current !== undefined) {
      window.clearTimeout(typeaheadTimerRef.current);
    }

    typeaheadTimerRef.current = window.setTimeout(() => {
      typeaheadRef.current = '';
      typeaheadTimerRef.current = undefined;
    }, TYPEAHEAD_RESET_DELAY);

    const query = typeaheadRef.current;
    const startIndex = activeIndex >= 0 ? activeIndex + 1 : 0;

    for (let offset = 0; offset < options.length; offset += 1) {
      const index = (startIndex + offset) % options.length;
      const option = options[index];

      if (
        option
        && !option.disabled
        && optionText(option).toLocaleLowerCase().startsWith(query)
      ) {
        if (!isOpen) {
          openDropdown(index);
        } else {
          focusOption(index);
        }

        return true;
      }
    }

    return true;
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (handleTypeahead(event)) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (isOpen) {
        moveActive(1);
      } else {
        openDropdown(initialIndex());
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (isOpen) {
        moveActive(-1);
      } else {
        openDropdown(initialIndex(true));
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      if (isOpen) {
        focusOption(firstEnabledIndex());
      } else {
        openDropdown(firstEnabledIndex());
      }
    } else if (event.key === 'End') {
      event.preventDefault();
      if (isOpen) {
        focusOption(lastEnabledIndex());
      } else {
        openDropdown(lastEnabledIndex());
      }
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeDropdown();
    } else if (event.key === 'Tab' && isOpen) {
      closeDropdown();
    } else if ((event.key === 'Enter' || event.key === ' ') && isOpen) {
      event.preventDefault();
      activateOption(activeIndex);
    }
  }

  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (handleTypeahead(event)) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(firstEnabledIndex());
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(lastEnabledIndex());
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown(true);
    } else if (event.key === 'Tab') {
      closeDropdown();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateOption(index);
    }
  }

  function activateOption(index: number) {
    const option = options[index];

    if (!option || option.disabled) {
      return;
    }

    closeDropdown(true);

    if (isMenu) {
      props.onAction(option.value);
    } else {
      props.onChange(option.value);
    }
  }

  const triggerContent = isMenu
    ? props.trigger
    : selectedOption?.selectedLabel
      ?? selectedOption?.label
      ?? props.placeholder
      ?? 'Select an option';
  const accessiblePopoverLabel = popoverLabel
    ?? (isMenu ? props['aria-label'] : props['aria-label'] ?? 'Options');

  return (
    <div
      className={joinClassNames(
        styles.root,
        isMenu ? styles.menuRoot : styles.selectionRoot,
        className,
      )}
      ref={rootRef}
    >
      <button
        aria-controls={isOpen ? popoverId : undefined}
        aria-describedby={!isMenu ? props['aria-describedby'] : undefined}
        aria-expanded={isOpen}
        aria-haspopup={isMenu ? 'menu' : 'listbox'}
        aria-label={props['aria-label']}
        className={joinClassNames(
          styles.trigger,
          styles[variant],
          isMenu ? styles.menuTrigger : styles.selectionTrigger,
        )}
        disabled={isDisabled}
        id={triggerId}
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            openDropdown();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        role={isMenu ? undefined : 'combobox'}
        type="button"
      >
        <span
          className={joinClassNames(
            styles.triggerValue,
            !isMenu && !selectedOption && styles.placeholder,
          )}
        >
          {triggerContent}
        </span>
        <CaretIcon className={joinClassNames(styles.indicator, isOpen && styles.indicatorOpen)} />
      </button>

      {isMounted ? (
        <div
          aria-label={accessiblePopoverLabel}
          className={joinClassNames(
            styles.popover,
            isMenu ? styles.menuPopover : styles.selectionPopover,
            align === 'end' && styles.alignEnd,
            placement === 'top' && styles.placeAbove,
            isExiting ? styles.popoverExiting : styles.popoverEntering,
          )}
          id={popoverId}
          role={isMenu ? 'menu' : 'listbox'}
        >
          {options.map((option, index) => {
            const isSelected = !isMenu && option.value === props.value;

            return (
              <button
                aria-disabled={option.disabled || undefined}
                aria-selected={isMenu ? undefined : isSelected}
                className={joinClassNames(
                  styles.option,
                  isSelected && styles.selectedOption,
                )}
                disabled={option.disabled}
                key={option.value}
                onClick={() => activateOption(index)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role={isMenu ? 'menuitem' : 'option'}
                tabIndex={isOpen && index === activeIndex ? 0 : -1}
                type="button"
              >
                <span className={styles.optionCopy}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.description ? (
                    <span className={styles.optionDescription}>{option.description}</span>
                  ) : null}
                </span>
                {option.endContent ? (
                  <span className={styles.endContent}>{option.endContent}</span>
                ) : null}
                {!isMenu ? (
                  <span aria-hidden="true" className={styles.selectionIndicator}>
                    {isSelected ? <CheckIcon /> : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
