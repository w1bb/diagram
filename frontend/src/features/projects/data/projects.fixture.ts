import type { ProjectSummary } from '../model/project';

export const projectFixtures: readonly ProjectSummary[] = [
  {
    id: 'meridian-commerce',
    icon: 'layers',
    name: 'Meridian Commerce',
    description: 'Customer checkout, orders, and payment processing.',
    requirementsCount: 48,
    openFindingsCount: 7,
    workflowStatuses: {
      requirements: 'complete',
      codebase: 'ready-for-review',
      report: 'in-progress',
    },
  },
  {
    id: 'identity-platform',
    icon: 'shield',
    name: 'Identity Platform',
    description: 'Authentication, authorization, and account lifecycle.',
    requirementsCount: 31,
    openFindingsCount: 3,
    workflowStatuses: {
      requirements: 'outdated',
      codebase: 'in-progress',
      report: 'not-started',
    },
  },
  {
    id: 'analytics-workbench',
    icon: 'chart',
    name: 'Analytics Workbench',
    description: 'Reporting pipelines and operational dashboards.',
    requirementsCount: 26,
    openFindingsCount: 0,
    workflowStatuses: {
      requirements: 'ready-for-review',
      codebase: 'outdated',
      report: 'not-started',
    },
  },
];

export function findProject(projectId: string): ProjectSummary | undefined {
  return projectFixtures.find((project) => project.id === projectId);
}
