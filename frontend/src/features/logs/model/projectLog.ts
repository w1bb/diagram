export type ProjectLogScope = 'codebase' | 'project' | 'report' | 'requirements' | 'system';
export type ProjectLogStatus = 'danger' | 'info' | 'success' | 'warning';

export interface ProjectLogEntry {
  readonly actor: string;
  readonly description: string;
  readonly id: string;
  readonly occurredAt: string;
  readonly reference: string;
  readonly scope: ProjectLogScope;
  readonly status: ProjectLogStatus;
  readonly title: string;
}
