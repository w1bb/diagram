import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { projectFixtures } from '../data/projects.fixture';
import type { ProjectIconName, ProjectSummary } from '../model/project';

export interface CreateProjectInput {
  readonly description: string;
  readonly icon: ProjectIconName;
  readonly name: string;
}

interface ProjectContextValue {
  readonly createProject: (input: CreateProjectInput) => ProjectSummary;
  readonly findProject: (projectId: string) => ProjectSummary | undefined;
  readonly projects: readonly ProjectSummary[];
}

interface ProjectProviderProps {
  readonly children: ReactNode;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<readonly ProjectSummary[]>(() => [
    ...projectFixtures,
  ]);

  const createProject = useCallback((input: CreateProjectInput) => {
    const project: ProjectSummary = {
      id: crypto.randomUUID(),
      icon: input.icon,
      name: input.name.trim(),
      description: input.description.trim(),
      requirementsCount: 0,
      openFindingsCount: 0,
      workflowStatuses: {
        requirements: 'in-progress',
        codebase: 'not-started',
        report: 'not-started',
      },
    };

    setProjects((currentProjects) => [project, ...currentProjects]);
    return project;
  }, []);

  const findProject = useCallback(
    (projectId: string) => projects.find((project) => project.id === projectId),
    [projects],
  );

  const value = useMemo<ProjectContextValue>(
    () => ({ createProject, findProject, projects }),
    [createProject, findProject, projects],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error('useProjects must be used within ProjectProvider.');
  }

  return context;
}
