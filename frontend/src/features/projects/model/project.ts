export interface ProjectSummary {
  readonly id: string;
  readonly icon: ProjectIconName;
  readonly name: string;
  readonly description: string;
  readonly requirementsCount: number;
  readonly openFindingsCount: number;
  readonly workflowStatuses: Readonly<Record<ProjectSection, ProjectWorkflowStepStatus>>;
}

export type ProjectIconName = 'layers' | 'folder' | 'terminal' | 'shield' | 'chart' | 'sparkles' | 'globe';

export type ProjectSection = 'requirements' | 'codebase' | 'report';

export type ProjectWorkflowStepStatus =
  | 'complete'
  | 'in-progress'
  | 'not-started'
  | 'outdated'
  | 'ready-for-review';
