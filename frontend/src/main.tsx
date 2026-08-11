import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { AppErrorBoundary } from './app/errors/AppErrorBoundary';
import { ThemeProvider } from './app/providers/ThemeProvider';
import { RouterProvider } from './app/routing/RouterProvider';
import { ProjectProvider } from './features/projects/providers/ProjectProvider';
import { ToastProvider } from './components/feedback/Toast/ToastProvider';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Application root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider />
      <RouterProvider>
        <ProjectProvider>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </ProjectProvider>
      </RouterProvider>
    </ThemeProvider>
  </StrictMode>,
);
