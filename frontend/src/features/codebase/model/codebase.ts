export type CodebaseConfigurationStatus = 'draft' | 'validated';

export interface MockCommit {
  readonly authoredAt: string;
  readonly message: string;
  readonly sha: string;
}

export interface MockBranch {
  readonly commits: readonly MockCommit[];
  readonly name: string;
}

export interface MockRepositoryMetadata {
  readonly branches: readonly MockBranch[];
  readonly defaultBranch: string;
  readonly displayName: string;
}

export interface CodebaseWorkspaceItem {
  readonly credentialConfigured: boolean;
  readonly id: string;
  readonly repository: MockRepositoryMetadata | undefined;
  readonly selectedBranch: string;
  readonly selectedCommit: string;
  readonly status: CodebaseConfigurationStatus;
  readonly token: string;
  readonly url: string;
}

export interface MockSnapshotSelection {
  readonly branch: string;
  readonly codebaseId: string;
  readonly commit: string;
  readonly repositoryName: string;
  readonly repositoryUrl: string;
}

export interface MockCodebaseSnapshot {
  readonly createdAt: string;
  readonly id: string;
  readonly inputSignature: string;
  readonly selections: readonly MockSnapshotSelection[];
}

export interface MockCodebaseWorkspaceSeed {
  readonly codebases: readonly CodebaseWorkspaceItem[];
  readonly configurationRevision: number;
  readonly isValidating: boolean;
  readonly snapshot: MockCodebaseSnapshot | undefined;
  readonly validatedConfigurationRevision: number | undefined;
}

function normalizeRepositoryUrl(value: string): string {
  return value.trim().replace(/\/$/, '').toLocaleLowerCase();
}

export function codebaseSnapshotInputSignature(
  codebases: readonly CodebaseWorkspaceItem[],
  configurationRevision: number,
): string {
  const selections = codebases.map((codebase) => ({
    branch: codebase.selectedBranch,
    commit: codebase.selectedCommit,
    id: codebase.id,
    url: normalizeRepositoryUrl(codebase.url),
  }));

  return JSON.stringify({ configurationRevision, selections });
}
