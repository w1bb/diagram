import { useEffect, useState } from 'react';

import { useRouter } from '../../../../app/routing/RouterProvider';
import type { ProjectSummary } from '../../model/project';
import { ProjectNavigationItem } from '../ProjectNavigationItem/ProjectNavigationItem';
import styles from './ProjectNavigation.module.css';

interface ProjectNavigationProps {
  readonly emptyMessage?: string;
  readonly onEditProject: (project: ProjectSummary) => void;
  readonly projects: readonly ProjectSummary[];
}

export function ProjectNavigation({
  emptyMessage = 'No projects available.',
  onEditProject,
  projects,
}: ProjectNavigationProps) {
  const { route } = useRouter();
  const activeProjectId = route.name === 'project' ? route.projectId : undefined;
  const [expandedProjectIds, setExpandedProjectIds] = useState<ReadonlySet<string>>(
    () => {
      const initialProjectId = activeProjectId ?? projects[0]?.id;
      return new Set(initialProjectId ? [initialProjectId] : []);
    },
  );

  useEffect(() => {
    if (!activeProjectId) {
      return;
    }

    setExpandedProjectIds((currentIds) => {
      if (currentIds.has(activeProjectId)) {
        return currentIds;
      }

      return new Set([...currentIds, activeProjectId]);
    });
  }, [activeProjectId]);

  function toggleProject(projectId: string) {
    setExpandedProjectIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(projectId)) {
        nextIds.delete(projectId);
      } else {
        nextIds.add(projectId);
      }
      return nextIds;
    });
  }

  return (
    <nav aria-label="Project workspaces" className={styles.navigation}>
      {projects.length === 0 ? <p className={styles.emptyMessage}>{emptyMessage}</p> : null}
      {projects.map((project) => (
        <ProjectNavigationItem
          activeSection={
            activeProjectId === project.id && route.name === 'project' ? route.section : undefined
          }
          isExpanded={expandedProjectIds.has(project.id)}
          key={project.id}
          onEdit={() => onEditProject(project)}
          onToggle={() => toggleProject(project.id)}
          project={project}
        />
      ))}
    </nav>
  );
}
