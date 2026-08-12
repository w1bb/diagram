import type {
  ProjectLogEntry,
  ProjectLogScope,
  ProjectLogStatus,
} from '../model/projectLog';

interface ProjectLogTemplate {
  readonly actor: string;
  readonly description: (projectName: string) => string;
  readonly referencePrefix: string;
  readonly scope: ProjectLogScope;
  readonly status: ProjectLogStatus;
  readonly title: string;
}

const fixtureAnchorTime = Date.parse('2026-08-12T11:48:00.000Z');
const mockLogEntryCount = 128;

const logTemplates: readonly ProjectLogTemplate[] = [
  {
    actor: 'Requirements worker',
    description: (projectName) => `Finished extracting and normalizing the latest source batch for ${projectName}.`,
    referencePrefix: 'REQ',
    scope: 'requirements',
    status: 'success',
    title: 'Requirement extraction completed',
  },
  {
    actor: 'Repository worker',
    description: () => 'Started a protected repository access check using the configured credential reference.',
    referencePrefix: 'CON',
    scope: 'codebase',
    status: 'info',
    title: 'Repository validation started',
  },
  {
    actor: 'Repository worker',
    description: () => 'Repository access and default-branch discovery completed successfully.',
    referencePrefix: 'CON',
    scope: 'codebase',
    status: 'success',
    title: 'Repository connection verified',
  },
  {
    actor: 'Snapshot monitor',
    description: () => 'A newer selected revision made the previously created code snapshot out of date.',
    referencePrefix: 'SNP',
    scope: 'codebase',
    status: 'warning',
    title: 'Code snapshot marked outdated',
  },
  {
    actor: 'Ingestion worker',
    description: () => 'Pinned the selected commits and completed the immutable mock snapshot manifest.',
    referencePrefix: 'ING',
    scope: 'codebase',
    status: 'success',
    title: 'Code snapshot created',
  },
  {
    actor: 'Validation orchestrator',
    description: () => 'Queued consistency checks across the active requirement set and selected code snapshots.',
    referencePrefix: 'VAL',
    scope: 'system',
    status: 'info',
    title: 'Validation run queued',
  },
  {
    actor: 'Verification agent',
    description: () => 'Recorded a traceability gap that needs review before the report can be approved.',
    referencePrefix: 'FND',
    scope: 'report',
    status: 'warning',
    title: 'Finding requires review',
  },
  {
    actor: 'Report worker',
    description: (projectName) => `Generated refreshed summary metrics and findings for ${projectName}.`,
    referencePrefix: 'RPT',
    scope: 'report',
    status: 'success',
    title: 'Report generated',
  },
  {
    actor: 'Export worker',
    description: () => 'The requested export could not be rendered; the mock job recorded a retryable failure.',
    referencePrefix: 'EXP',
    scope: 'report',
    status: 'danger',
    title: 'Report export failed',
  },
  {
    actor: 'Project member',
    description: () => 'Removed a source document and marked the current requirement set for regeneration.',
    referencePrefix: 'SRC',
    scope: 'requirements',
    status: 'warning',
    title: 'Requirement source removed',
  },
  {
    actor: 'Job scheduler',
    description: () => 'Scheduled another attempt after a transient worker response exceeded the mock timeout.',
    referencePrefix: 'JOB',
    scope: 'system',
    status: 'warning',
    title: 'Worker retry scheduled',
  },
  {
    actor: 'Repository worker',
    description: () => 'The configured repository could not be reached with the available credential reference.',
    referencePrefix: 'CON',
    scope: 'codebase',
    status: 'danger',
    title: 'Repository validation failed',
  },
  {
    actor: 'Requirements worker',
    description: () => 'Published a deduplicated requirement set and preserved links to every contributing candidate.',
    referencePrefix: 'SET',
    scope: 'requirements',
    status: 'success',
    title: 'Requirement set published',
  },
  {
    actor: 'Project member',
    description: () => 'Dismissed a reviewed finding while retaining its requirement and code evidence links.',
    referencePrefix: 'FND',
    scope: 'report',
    status: 'info',
    title: 'Finding status updated',
  },
  {
    actor: 'Indexing worker',
    description: () => 'Indexed source files, symbols, and searchable chunks for the selected commit.',
    referencePrefix: 'IDX',
    scope: 'codebase',
    status: 'success',
    title: 'Commit indexing completed',
  },
  {
    actor: 'Project member',
    description: (projectName) => `Updated the browser-session display details for ${projectName}.`,
    referencePrefix: 'PRJ',
    scope: 'project',
    status: 'info',
    title: 'Project details updated',
  },
];

function hashProjectId(projectId: string): number {
  return [...projectId].reduce(
    (hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0,
    17,
  );
}

export function getProjectLogEntries(
  projectId: string,
  projectName: string,
): readonly ProjectLogEntry[] {
  const projectSeed = hashProjectId(projectId);
  let elapsedMinutes = projectSeed % 90;

  return Array.from({ length: mockLogEntryCount }, (_, index) => {
    const template = logTemplates[(index + projectSeed) % logTemplates.length] as ProjectLogTemplate;
    elapsedMinutes += 5 + ((projectSeed + (index * 17)) % 43);
    const sequence = String(mockLogEntryCount - index).padStart(3, '0');

    return {
      actor: template.actor,
      description: template.description(projectName),
      id: `${projectId}-log-${sequence}`,
      occurredAt: new Date(fixtureAnchorTime - (elapsedMinutes * 60_000)).toISOString(),
      reference: `${template.referencePrefix}-${sequence}`,
      scope: template.scope,
      status: template.status,
      title: template.title,
    };
  });
}
