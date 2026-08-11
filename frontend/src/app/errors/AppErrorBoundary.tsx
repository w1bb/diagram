import { Component, type ErrorInfo, type ReactNode } from 'react';

import styles from './AppErrorBoundary.module.css';

interface AppErrorBoundaryProps {
  readonly children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('The application could not render.', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className={styles.page}>
          <p className={styles.eyebrow}>Application error</p>
          <h1>This workspace could not be displayed.</h1>
          <p>Reload the application to retry. No changes were submitted by this failed view.</p>
          <button onClick={() => window.location.reload()} type="button">
            Reload application
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

