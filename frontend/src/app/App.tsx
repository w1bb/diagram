import { useEffect, type ReactNode } from 'react';

import { CodebasePage } from '../features/codebase/pages/CodebasePage';
import { ProjectLogsPage } from '../features/logs/pages/ProjectLogsPage';
import { useProjects } from '../features/projects/providers/ProjectProvider';
import { ReportPage } from '../features/reports/pages/ReportPage';
import { RequirementsPage } from '../features/requirements/pages/RequirementsPage';
import { AppShell } from '../layouts/AppShell/AppShell';
import { HomePage } from '../pages/HomePage/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage/NotFoundPage';
import { useRouter } from './routing/RouterProvider';

export function App() {
  const { route } = useRouter();
  const { findProject } = useProjects();
  const project = route.name === 'project' ? findProject(route.projectId) : undefined;

  useEffect(() => {
    if (route.name === 'home') {
      document.title = 'Projects · Implementation Verifier';
      return;
    }

    if (route.name === 'not-found' || !project) {
      document.title = '404 · Implementation Verifier';
      return;
    }

    const sectionTitle = route.section.charAt(0).toUpperCase() + route.section.slice(1);
    document.title = `${sectionTitle} · ${project.name} · Implementation Verifier`;
  }, [project, route]);

  let page: ReactNode;

  if (route.name === 'home') {
    page = <HomePage />;
  } else if (route.name === 'not-found') {
    page = <NotFoundPage pathname={route.pathname} />;
  } else if (!project) {
    page = <NotFoundPage pathname={window.location.pathname} />;
  } else {
    switch (route.section) {
      case 'requirements':
        page = <RequirementsPage project={project} />;
        break;
      case 'codebase':
        page = <CodebasePage project={project} />;
        break;
      case 'report':
        page = <ReportPage project={project} />;
        break;
      case 'logs':
        page = <ProjectLogsPage project={project} />;
        break;
    }
  }

  return <AppShell>{page}</AppShell>;
}
