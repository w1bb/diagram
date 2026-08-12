import {
  codebaseSnapshotInputSignature,
  type CodebaseWorkspaceItem,
  type MockCodebaseSnapshot,
  type MockCodebaseWorkspaceSeed,
  type MockRepositoryMetadata,
} from '../model/codebase';

const repositoryFixtures: readonly Omit<MockRepositoryMetadata, 'displayName'>[] = [
  {
    defaultBranch: 'main',
    branches: [
      {
        name: 'main',
        commits: [
          {
            sha: '9f4b7c2a',
            message: 'Harden checkout retry handling',
            authoredAt: '2026-08-11T06:42:00Z',
          },
          {
            sha: '63a1de80',
            message: 'Add order audit metadata',
            authoredAt: '2026-08-10T14:18:00Z',
          },
          {
            sha: '24be917d',
            message: 'Refine payment failure states',
            authoredAt: '2026-08-09T09:05:00Z',
          },
        ],
      },
      {
        name: 'release/2.4',
        commits: [
          {
            sha: 'd78ca143',
            message: 'Prepare 2.4 release candidate',
            authoredAt: '2026-08-08T16:31:00Z',
          },
          {
            sha: '4410bc8e',
            message: 'Backport checkout telemetry',
            authoredAt: '2026-08-07T11:20:00Z',
          },
        ],
      },
      {
        name: 'feature/risk-signals',
        commits: [
          {
            sha: 'b038a9ef',
            message: 'Add payment risk signal adapter',
            authoredAt: '2026-08-10T08:17:00Z',
          },
        ],
      },
    ],
  },
  {
    defaultBranch: 'main',
    branches: [
      {
        name: 'main',
        commits: [
          {
            sha: 'a81c5e42',
            message: 'Rotate service credential contract',
            authoredAt: '2026-08-11T05:26:00Z',
          },
          {
            sha: '77d420bc',
            message: 'Clarify account lockout policy',
            authoredAt: '2026-08-10T12:09:00Z',
          },
          {
            sha: '19fa2d76',
            message: 'Record session revocation reason',
            authoredAt: '2026-08-08T17:44:00Z',
          },
        ],
      },
      {
        name: 'develop',
        commits: [
          {
            sha: 'e52b1a90',
            message: 'Prototype passkey enrollment',
            authoredAt: '2026-08-11T07:03:00Z',
          },
          {
            sha: 'c032ed4f',
            message: 'Add device trust fixtures',
            authoredAt: '2026-08-09T15:52:00Z',
          },
        ],
      },
    ],
  },
  {
    defaultBranch: 'trunk',
    branches: [
      {
        name: 'trunk',
        commits: [
          {
            sha: '5c317be9',
            message: 'Optimize dashboard query planning',
            authoredAt: '2026-08-11T04:12:00Z',
          },
          {
            sha: '1e869c44',
            message: 'Expose pipeline lag metrics',
            authoredAt: '2026-08-10T10:38:00Z',
          },
          {
            sha: 'f927a0d3',
            message: 'Normalize report time zones',
            authoredAt: '2026-08-09T13:21:00Z',
          },
        ],
      },
      {
        name: 'experiment/streaming',
        commits: [
          {
            sha: '0bd743ca',
            message: 'Stream incremental chart updates',
            authoredAt: '2026-08-10T18:46:00Z',
          },
        ],
      },
    ],
  },
];

function repositoryName(repositoryUrl: string): string {
  try {
    const pathname = new URL(repositoryUrl).pathname.replace(/\/$/, '');
    const finalSegment = pathname.split('/').at(-1)?.replace(/\.git$/i, '');
    return finalSegment || 'Git repository';
  } catch {
    return 'Git repository';
  }
}

export function createMockRepositoryMetadata(
  repositoryUrl: string,
  index: number,
): MockRepositoryMetadata {
  const fixture = repositoryFixtures[index % repositoryFixtures.length];

  if (!fixture) {
    throw new Error('Repository fixture is unavailable.');
  }

  return {
    ...fixture,
    displayName: repositoryName(repositoryUrl),
  };
}

function createValidatedCodebase(
  id: string,
  url: string,
  fixtureIndex: number,
): CodebaseWorkspaceItem {
  const repository = createMockRepositoryMetadata(url, fixtureIndex);
  const defaultBranch = repository.branches.find(
    (branch) => branch.name === repository.defaultBranch,
  );

  return {
    credentialConfigured: true,
    id,
    repository,
    selectedBranch: defaultBranch?.name ?? '',
    selectedCommit: defaultBranch?.commits[0]?.sha ?? '',
    status: 'validated',
    token: '',
    url,
  };
}

function createSnapshot(
  id: string,
  createdAt: string,
  codebases: readonly CodebaseWorkspaceItem[],
  configurationRevision: number,
): MockCodebaseSnapshot {
  return {
    createdAt,
    id,
    inputSignature: codebaseSnapshotInputSignature(codebases, configurationRevision),
    selections: codebases.map((codebase) => ({
      branch: codebase.selectedBranch,
      codebaseId: codebase.id,
      commit: codebase.selectedCommit,
      repositoryName: codebase.repository?.displayName ?? 'Git repository',
      repositoryUrl: codebase.url,
    })),
  };
}

export function createMockCodebaseWorkspaceSeed(
  projectId: string,
): MockCodebaseWorkspaceSeed {
  if (projectId === 'meridian-commerce') {
    const codebases = [
      createValidatedCodebase(
        'codebase-meridian-commerce',
        'https://github.com/meridian/commerce.git',
        0,
      ),
      createValidatedCodebase(
        'codebase-meridian-payments',
        'https://github.com/meridian/payments.git',
        1,
      ),
    ] as const;
    const configurationRevision = 2;

    return {
      codebases,
      configurationRevision,
      isValidating: false,
      snapshot: createSnapshot(
        'snapshot-meridian-current',
        '2026-08-11T06:55:00Z',
        codebases,
        configurationRevision,
      ),
      validatedConfigurationRevision: configurationRevision,
    };
  }

  if (projectId === 'identity-platform') {
    return {
      codebases: [
        {
          credentialConfigured: true,
          id: 'codebase-identity-platform',
          repository: undefined,
          selectedBranch: '',
          selectedCommit: '',
          status: 'draft',
          token: '',
          url: 'https://github.com/meridian/identity-platform.git',
        },
      ],
      configurationRevision: 1,
      isValidating: true,
      snapshot: undefined,
      validatedConfigurationRevision: undefined,
    };
  }

  if (projectId === 'analytics-workbench') {
    const codebases = [
      createValidatedCodebase(
        'codebase-analytics-workbench',
        'https://github.com/meridian/analytics-workbench.git',
        2,
      ),
    ] as const;

    return {
      codebases,
      configurationRevision: 2,
      isValidating: false,
      snapshot: createSnapshot(
        'snapshot-analytics-stale',
        '2026-08-09T13:42:00Z',
        codebases,
        1,
      ),
      validatedConfigurationRevision: 1,
    };
  }

  return {
    codebases: [
      {
        credentialConfigured: false,
        id: crypto.randomUUID(),
        repository: undefined,
        selectedBranch: '',
        selectedCommit: '',
        status: 'draft',
        token: '',
        url: '',
      },
    ],
    configurationRevision: 0,
    isValidating: false,
    snapshot: undefined,
    validatedConfigurationRevision: undefined,
  };
}
