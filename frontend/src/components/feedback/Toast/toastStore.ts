import type { ReactNode } from 'react';

export type ToastVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export interface ToastAction {
  readonly label: string;
  readonly onPress: () => void;
}

export interface ToastOptions {
  readonly action?: ToastAction;
  readonly description?: ReactNode;
  readonly indicator?: ReactNode | null;
  readonly isLoading?: boolean;
  readonly onClose?: () => void;
  readonly timeout?: number;
  readonly variant?: ToastVariant;
}

export interface ToastItem extends ToastOptions {
  readonly id: string;
  readonly state: 'visible' | 'exiting';
  readonly title: ReactNode;
  readonly variant: ToastVariant;
}

interface ToastSnapshot {
  readonly isPaused: boolean;
  readonly items: readonly ToastItem[];
}

type ToastListener = () => void;

const EXIT_DURATION = 350;
const listeners = new Set<ToastListener>();
const removalTimers = new Map<string, ReturnType<typeof setTimeout>>();
let snapshot: ToastSnapshot = { isPaused: false, items: [] };

function publish(nextSnapshot: ToastSnapshot) {
  snapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

function add(title: ReactNode, options: ToastOptions = {}) {
  const id = crypto.randomUUID();
  const item: ToastItem = {
    ...options,
    id,
    state: 'visible',
    title,
    variant: options.variant ?? 'default',
  };

  publish({ ...snapshot, items: [item, ...snapshot.items] });
  return id;
}

function close(id: string) {
  const item = snapshot.items.find((candidate) => candidate.id === id);
  if (!item || item.state === 'exiting') {
    return;
  }

  publish({
    ...snapshot,
    items: snapshot.items.map((candidate) =>
      candidate.id === id ? { ...candidate, state: 'exiting' } : candidate,
    ),
  });

  const removalTimer = setTimeout(() => {
    removalTimers.delete(id);
    publish({ ...snapshot, items: snapshot.items.filter((candidate) => candidate.id !== id) });
    item.onClose?.();
  }, EXIT_DURATION);

  removalTimers.set(id, removalTimer);
}

function clear() {
  snapshot.items.forEach((item) => close(item.id));
}

function pauseAll() {
  if (!snapshot.isPaused) {
    publish({ ...snapshot, isPaused: true });
  }
}

function resumeAll() {
  if (snapshot.isPaused) {
    publish({ ...snapshot, isPaused: false });
  }
}

interface ToastApi {
  (title: ReactNode, options?: ToastOptions): string;
  readonly accent: (title: ReactNode, options?: Omit<ToastOptions, 'variant'>) => string;
  readonly clear: () => void;
  readonly close: (id: string) => void;
  readonly danger: (title: ReactNode, options?: Omit<ToastOptions, 'variant'>) => string;
  readonly info: (title: ReactNode, options?: Omit<ToastOptions, 'variant'>) => string;
  readonly pauseAll: () => void;
  readonly resumeAll: () => void;
  readonly success: (title: ReactNode, options?: Omit<ToastOptions, 'variant'>) => string;
  readonly warning: (title: ReactNode, options?: Omit<ToastOptions, 'variant'>) => string;
}

type VariantToastOptions = Omit<ToastOptions, 'variant'>;

const showToast = (title: ReactNode, options?: ToastOptions) => add(title, options);

export const toast: ToastApi = Object.assign(showToast, {
  accent: (title: ReactNode, options?: VariantToastOptions) =>
    add(title, { ...options, variant: 'accent' }),
  clear,
  close,
  danger: (title: ReactNode, options?: VariantToastOptions) =>
    add(title, { ...options, variant: 'danger' }),
  info: (title: ReactNode, options?: VariantToastOptions) =>
    add(title, { ...options, variant: 'accent' }),
  pauseAll,
  resumeAll,
  success: (title: ReactNode, options?: VariantToastOptions) =>
    add(title, { ...options, variant: 'success' }),
  warning: (title: ReactNode, options?: VariantToastOptions) =>
    add(title, { ...options, variant: 'warning' }),
});

export const toastStore = {
  getSnapshot: () => snapshot,
  subscribe(listener: ToastListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
