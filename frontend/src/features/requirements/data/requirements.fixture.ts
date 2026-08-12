import {
  requirementAnchorId,
  type DetectedRequirement,
  type RequirementPriority,
  type RequirementType,
} from '../model/requirement';

interface DetectedRequirementFixture extends Omit<DetectedRequirement, 'source'> {
  readonly sourceLocator: string;
}

interface LinkedRequirementSeed {
  readonly id: string;
  readonly label: string;
  readonly priority: RequirementPriority;
  readonly type: RequirementType;
}

const linkedRequirementSeeds: Readonly<Record<string, readonly LinkedRequirementSeed[]>> = {
  'meridian-commerce': [
    { id: 'REQ-CHECKOUT-012', label: 'Keep checkout totals consistent across concurrent cart updates', priority: 'critical', type: 'functional' },
    { id: 'REQ-PAY-008', label: 'Make payment authorization retries idempotent', priority: 'critical', type: 'non_functional' },
    { id: 'REQ-PAY-021', label: 'Verify partial refund provider behavior', priority: 'high', type: 'testing' },
    { id: 'REQ-CHECKOUT-019', label: 'Apply one monetary rounding policy', priority: 'high', type: 'code_quality' },
    { id: 'REQ-AUDIT-006', label: 'Record the reason for order cancellation', priority: 'high', type: 'compliance' },
    { id: 'REQ-STOCK-014', label: 'Verify inventory timeout fallback behavior', priority: 'medium', type: 'testing' },
    { id: 'REQ-OPS-004', label: 'Segment payment metrics by provider', priority: 'medium', type: 'performance' },
  ],
  'identity-platform': [
    { id: 'REQ-SEC-002', label: 'Keep refresh credentials out of browser storage', priority: 'critical', type: 'security' },
    { id: 'REQ-IAM-017', label: 'Revoke sessions after privilege changes', priority: 'critical', type: 'security' },
    { id: 'REQ-MFA-011', label: 'Verify negative MFA recovery paths', priority: 'high', type: 'testing' },
    { id: 'REQ-ACCOUNT-026', label: 'Release login aliases after account-retention cleanup', priority: 'medium', type: 'business' },
    { id: 'REQ-AUDIT-013', label: 'Correlate authorization audit events to requests', priority: 'high', type: 'compliance' },
    { id: 'REQ-UX-009', label: 'Keep password guidance aligned with active policy', priority: 'medium', type: 'other' },
    { id: 'REQ-OPS-018', label: 'Alert on sustained identity-provider latency', priority: 'medium', type: 'performance' },
  ],
  'analytics-workbench': [
    { id: 'REQ-DATA-004', label: 'Preserve tenant scope in asynchronous exports', priority: 'critical', type: 'security' },
    { id: 'REQ-PERF-007', label: 'Bound dashboard aggregation date ranges', priority: 'high', type: 'performance' },
    { id: 'REQ-ANALYTICS-016', label: 'Verify timezone boundary aggregation behavior', priority: 'high', type: 'testing' },
    { id: 'REQ-UX-023', label: 'Surface failed dashboard refresh state', priority: 'medium', type: 'non_functional' },
    { id: 'REQ-A11Y-010', label: 'Keep chart-series accessible labels unique', priority: 'medium', type: 'other' },
    { id: 'REQ-OPS-021', label: 'Document worker saturation response guidance', priority: 'medium', type: 'performance' },
  ],
};

const detectedRequirementFixtures: readonly DetectedRequirementFixture[] = [
  {
    id: 'requirement-secure-session',
    label: 'Protect authenticated sessions',
    description: 'Authenticated sessions must expire after inactivity and must not expose credentials in client-visible storage.',
    nearDuplicates: [
      {
        label: 'Expire inactive user sessions',
        reasoning: 'Both candidates define an inactivity timeout; this wording omits the credential-storage constraint.',
        similarityScore: 0.91,
      },
    ],
    priority: 'critical',
    rawContent: 'The platform shall expire authenticated sessions after 30 minutes of inactivity and shall never persist access credentials in browser storage.',
    sourceLocator: 'Security controls · Session management · paragraph 2',
    type: 'security',
  },
  {
    id: 'requirement-source-formats',
    label: 'Accept supported requirement sources',
    description: 'Users must be able to provide PDF, Word, spreadsheet, Markdown, text, and JSON requirement documents.',
    nearDuplicates: [],
    priority: 'high',
    rawContent: 'Requirement source uploads must accept PDF, DOCX, XLSX, Markdown, plain-text and JSON files.',
    sourceLocator: 'Input formats · Supported documents',
    type: 'functional',
  },
  {
    id: 'requirement-provenance',
    label: 'Preserve source provenance',
    description: 'Every detected requirement must retain a traceable reference to the document content from which it was extracted.',
    nearDuplicates: [
      {
        label: 'Retain extraction origin metadata',
        reasoning: 'The candidate describes the same traceability outcome with narrower metadata terminology.',
        similarityScore: 0.88,
      },
    ],
    priority: 'high',
    rawContent: 'For audit purposes, every normalized requirement must preserve its originating document, location and unmodified source statement.',
    sourceLocator: 'Governance · Traceability · REQ-GOV-04',
    type: 'compliance',
  },
  {
    id: 'requirement-atomic-results',
    label: 'Produce atomic requirements',
    description: 'Compound statements must be separated into independently reviewable and verifiable requirements.',
    nearDuplicates: [],
    priority: 'high',
    rawContent: 'The extraction process shall split compound source statements so each resulting requirement expresses one independently testable obligation.',
    sourceLocator: 'Processing outcomes · Atomization',
    type: 'business',
  },
  {
    id: 'requirement-deduplication',
    label: 'Resolve duplicate requirements',
    description: 'Semantically overlapping candidates must be identified and consolidated without losing their source relationships.',
    nearDuplicates: [
      {
        label: 'Merge semantically equivalent candidates',
        reasoning: 'Both candidates require semantic consolidation and preservation of candidate lineage.',
        similarityScore: 0.94,
      },
      {
        label: 'Flag overlapping requirement statements',
        reasoning: 'This candidate covers detection but does not explicitly require consolidation.',
        similarityScore: 0.82,
      },
    ],
    priority: 'medium',
    rawContent: 'The system shall detect semantically duplicate requirements, merge accepted matches, and keep links to every contributing candidate.',
    sourceLocator: 'Quality rules · Deduplication · item 3',
    type: 'code_quality',
  },
  {
    id: 'requirement-processing-status',
    label: 'Expose processing state',
    description: 'Long-running source extraction and normalization work must communicate queued, running, completed, and failed states.',
    nearDuplicates: [],
    priority: 'medium',
    rawContent: 'Users must receive a visible status within one second whenever extraction is queued, starts, completes or fails.',
    sourceLocator: 'Performance objectives · User feedback · PERF-07',
    type: 'performance',
  },
  {
    id: 'requirement-versioned-set',
    label: 'Version published requirement sets',
    description: 'A completed processing run must create a versioned requirement set that can be pinned by later validation work.',
    nearDuplicates: [
      {
        label: 'Pin validation to immutable requirements',
        reasoning: 'The candidate describes the downstream reason for keeping published sets versioned.',
        similarityScore: 0.8,
      },
    ],
    priority: 'high',
    rawContent: 'Each successful normalization run shall publish a new immutable requirement-set version for use by validation runs.',
    sourceLocator: 'Architecture decisions · Versioning · ADR-12',
    type: 'architecture',
  },
  {
    id: 'requirement-file-integrity',
    label: 'Verify uploaded file integrity',
    description: 'Stored source artifacts must retain sufficient checksum metadata to detect accidental content changes.',
    nearDuplicates: [],
    priority: 'medium',
    rawContent: 'Every stored requirement source shall have a content checksum that can be used to verify the retrieved artifact.',
    sourceLocator: 'Reliability requirements · Artifact integrity',
    type: 'non_functional',
  },
  {
    id: 'requirement-test-traceability',
    label: 'Trace requirements to tests',
    description: 'Published requirements must be available to test-coverage analysis with explicit evidence and gap reporting.',
    nearDuplicates: [
      {
        label: 'Report requirements without test evidence',
        reasoning: 'This candidate captures the gap-reporting subset of the broader traceability requirement.',
        similarityScore: 0.84,
      },
    ],
    priority: 'medium',
    rawContent: 'Validation shall associate every published requirement with supporting tests or report that test evidence is absent.',
    sourceLocator: 'Testing strategy · Coverage traceability · TS-09',
    type: 'testing',
  },
  {
    id: 'requirement-actionable-errors',
    label: 'Present actionable processing errors',
    description: 'A failed source or processing run must provide a sanitized explanation and a clear recovery path.',
    nearDuplicates: [],
    priority: 'unspecified',
    rawContent: 'When processing cannot continue, show a safe error explanation and tell the user how the operation can be retried.',
    sourceLocator: 'General behavior · Error recovery',
    type: 'other',
  },
];

export function createMockRequirementSet(
  sourceFilenames: readonly string[],
): readonly DetectedRequirement[] {
  const count = 5 + Math.floor(Math.random() * 6);
  const startIndex = Math.floor(Math.random() * detectedRequirementFixtures.length);

  return Array.from({ length: count }, (_, index) => {
    const fixture = detectedRequirementFixtures[(startIndex + index) % detectedRequirementFixtures.length];

    if (!fixture) {
      throw new Error('Detected requirement fixture is unavailable.');
    }

    const { sourceLocator, ...requirement } = fixture;

    return {
      ...requirement,
      source: {
        filename: sourceFilenames[(startIndex + index) % sourceFilenames.length] ?? 'uploaded-source.txt',
        locator: sourceLocator,
      },
    };
  });
}

export function getLinkedRequirementByAnchor(
  projectId: string,
  anchorId: string,
): DetectedRequirement | undefined {
  const seed = linkedRequirementSeeds[projectId]?.find(
    (candidate) => requirementAnchorId(candidate.id) === anchorId,
  );

  if (!seed) {
    return undefined;
  }

  return {
    description: `${seed.label}. This published fixture requirement is the traceability target used by project report findings.`,
    id: seed.id,
    label: seed.label,
    nearDuplicates: [],
    priority: seed.priority,
    rawContent: `${seed.id}: ${seed.label}.`,
    source: {
      filename: `${projectId}-published-requirements.md`,
      locator: `Published requirements · ${seed.id}`,
    },
    type: seed.type,
  };
}
