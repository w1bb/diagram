import type {
  FindingStatus,
  ReportEvidenceLocation,
  ReportFinding,
  ReportRequirementTypeCount,
  VerificationReport,
} from '../model/report';
import type { RequirementType } from '../../requirements/model/requirement';

type FindingSeed = Omit<ReportFinding, 'id' | 'status'>;

const commerceRepositoryUrl = 'https://github.com/meridian/commerce.git';
const paymentsRepositoryUrl = 'https://github.com/meridian/payments.git';
const identityRepositoryUrl = 'https://github.com/meridian/identity-platform.git';
const analyticsRepositoryUrl = 'https://github.com/meridian/analytics-workbench.git';

function evidence(
  repositoryUrl: string,
  revision: string,
  path: string,
  line: number,
  column: number,
): ReportEvidenceLocation {
  return { column, line, path, repositoryUrl, revision };
}

const requirementTypes: readonly RequirementType[] = [
  'business',
  'functional',
  'non_functional',
  'code_quality',
  'compliance',
  'security',
  'testing',
  'architecture',
  'performance',
  'other',
];

function createRequirementTypeCounts(
  counts: Readonly<Record<RequirementType, number>>,
): readonly ReportRequirementTypeCount[] {
  return requirementTypes.map((type) => ({ identified: counts[type], type }));
}

const meridianFindingSeeds: readonly FindingSeed[] = [
  {
    label: 'Checkout totals can diverge during concurrent cart updates',
    description: 'The final order calculation can use a stale cart revision when inventory and promotion updates complete together.',
    evidenceLocations: [
      evidence(commerceRepositoryUrl, '9f4b7c2a', 'src/checkout/OrderCalculator.ts', 118, 17),
      evidence(commerceRepositoryUrl, '9f4b7c2a', 'tests/checkout/OrderCalculator.test.ts', 84, 9),
    ],
    requirementReference: 'REQ-CHECKOUT-012',
    requirementTypes: ['functional', 'code_quality'],
    severity: 'critical',
    solutionProposal: 'Pin calculation to a cart revision and reject or retry checkout when the revision changes before commit.',
    type: 'requirements_implementation',
  },
  {
    label: 'Payment retry can duplicate provider authorization',
    description: 'Retry handling generates a new provider request key after an ambiguous timeout instead of reusing the original attempt.',
    evidenceLocations: [
      evidence(paymentsRepositoryUrl, 'a81c5e42', 'src/payments/PaymentGateway.ts', 204, 23),
      evidence(paymentsRepositoryUrl, 'a81c5e42', 'src/payments/RetryPolicy.ts', 67, 11),
    ],
    requirementReference: 'REQ-PAY-008',
    requirementTypes: ['non_functional', 'security'],
    severity: 'high',
    solutionProposal: 'Persist and reuse an idempotency key for every logical authorization attempt.',
    type: 'implementation_tests',
  },
  {
    label: 'Refund workflow lacks provider contract tests',
    description: 'No test demonstrates how partial refunds behave when the payment provider returns a delayed settlement response.',
    evidenceLocations: [
      evidence(paymentsRepositoryUrl, 'a81c5e42', 'tests/payments/refund.contract.test.ts', 31, 5),
    ],
    requirementReference: 'REQ-PAY-021',
    requirementTypes: ['testing', 'functional'],
    severity: 'high',
    solutionProposal: 'Add contract fixtures for partial, delayed, declined, and replayed refund responses.',
    type: 'requirements_tests',
  },
  {
    label: 'Tax rounding differs between preview and capture',
    description: 'The preview path rounds per line while the capture path rounds only the final total.',
    evidenceLocations: [
      evidence(commerceRepositoryUrl, '9f4b7c2a', 'src/tax/TaxSummary.ts', 76, 14),
    ],
    requirementReference: 'REQ-CHECKOUT-019',
    requirementTypes: ['code_quality'],
    severity: 'medium',
    solutionProposal: 'Centralize monetary rounding and reuse it in preview, order creation, and capture.',
    type: 'requirements_implementation',
  },
  {
    label: 'Order cancellation audit omits the actor reason',
    description: 'Cancellation events retain the actor identifier but discard the reason selected in the operator workflow.',
    evidenceLocations: [
      evidence(commerceRepositoryUrl, '9f4b7c2a', 'src/orders/CancelOrderHandler.ts', 91, 19),
      evidence(commerceRepositoryUrl, '9f4b7c2a', 'src/audit/OrderAuditEvent.ts', 44, 7),
    ],
    requirementReference: 'REQ-AUDIT-006',
    requirementTypes: ['compliance', 'business'],
    severity: 'medium',
    solutionProposal: 'Include the sanitized reason code in the cancellation audit payload and its tests.',
    type: 'requirements_implementation',
  },
  {
    label: 'Inventory timeout fallback is untested',
    description: 'The fallback branch for an unavailable inventory service has no automated verification.',
    evidenceLocations: [
      evidence(commerceRepositoryUrl, '9f4b7c2a', 'tests/inventory/reservation.test.ts', 142, 9),
    ],
    requirementReference: 'REQ-STOCK-014',
    requirementTypes: ['testing'],
    severity: 'low',
    solutionProposal: 'Add timeout and recovery tests around reservation fallback behavior.',
    type: 'requirements_tests',
  },
  {
    label: 'Payment metrics omit provider labels',
    description: 'Latency and failure counters cannot be segmented by payment provider.',
    evidenceLocations: [
      evidence(paymentsRepositoryUrl, 'a81c5e42', 'src/observability/paymentMetrics.ts', 33, 12),
    ],
    requirementReference: 'REQ-OPS-004',
    requirementTypes: ['performance'],
    severity: 'info',
    solutionProposal: 'Attach a bounded provider label to payment latency and outcome metrics.',
    type: 'implementation_tests',
  },
];

const identityFindingSeeds: readonly FindingSeed[] = [
  {
    label: 'Refresh tokens remain in browser storage',
    description: 'The client persists refresh credentials in local storage, exposing them to injected script execution.',
    evidenceLocations: [
      evidence(identityRepositoryUrl, 'a81c5e42', 'src/auth/tokenStorage.ts', 42, 15),
      evidence(identityRepositoryUrl, 'a81c5e42', 'src/auth/sessionBootstrap.ts', 88, 21),
    ],
    requirementReference: 'REQ-SEC-002',
    requirementTypes: ['security', 'non_functional'],
    severity: 'critical',
    solutionProposal: 'Move refresh credentials to secure, HttpOnly, SameSite cookies and rotate them after use.',
    type: 'requirements_implementation',
  },
  {
    label: 'Privilege changes do not revoke active sessions',
    description: 'Removing an administrative role leaves previously issued privileged sessions active until natural expiry.',
    evidenceLocations: [
      evidence(identityRepositoryUrl, 'a81c5e42', 'src/access/RoleAssignmentService.ts', 167, 13),
    ],
    requirementReference: 'REQ-IAM-017',
    requirementTypes: ['security', 'functional'],
    severity: 'high',
    solutionProposal: 'Increment the user session version on privilege changes and enforce it during authorization.',
    type: 'requirements_implementation',
  },
  {
    label: 'MFA recovery is missing negative-path tests',
    description: 'Recovery-code tests cover successful use but not replay, exhaustion, or concurrent redemption.',
    evidenceLocations: [
      evidence(identityRepositoryUrl, 'a81c5e42', 'tests/mfa/recoveryCodes.test.ts', 96, 7),
      evidence(identityRepositoryUrl, 'a81c5e42', 'src/mfa/RecoveryCodeService.ts', 121, 18),
    ],
    requirementReference: 'REQ-MFA-011',
    requirementTypes: ['testing', 'security'],
    severity: 'high',
    solutionProposal: 'Add replay, last-code, race, and invalid-code coverage with atomic consumption assertions.',
    type: 'requirements_tests',
  },
  {
    label: 'Account deletion leaves the login alias reserved',
    description: 'Deleted account aliases remain indefinitely unavailable even after the retention window expires.',
    evidenceLocations: [
      evidence(identityRepositoryUrl, 'a81c5e42', 'src/accounts/DeleteAccountJob.ts', 103, 11),
    ],
    requirementReference: 'REQ-ACCOUNT-026',
    requirementTypes: ['business'],
    severity: 'medium',
    solutionProposal: 'Release normalized aliases after retention cleanup while preserving irreversible audit identifiers.',
    type: 'implementation_tests',
  },
  {
    label: 'Authorization audit events miss correlation IDs',
    description: 'Denied authorization events cannot be connected reliably to the originating request trace.',
    evidenceLocations: [
      evidence(identityRepositoryUrl, 'a81c5e42', 'src/access/AuthorizationAudit.ts', 58, 20),
    ],
    requirementReference: 'REQ-AUDIT-013',
    requirementTypes: ['compliance', 'security'],
    severity: 'medium',
    solutionProposal: 'Pass the request correlation ID through the decision context and audit adapter.',
    type: 'requirements_implementation',
  },
  {
    label: 'Password policy guidance is stale',
    description: 'Help text still describes the retired complexity rules rather than the current length policy.',
    evidenceLocations: [
      evidence(identityRepositoryUrl, 'a81c5e42', 'src/account/PasswordHelp.tsx', 29, 8),
    ],
    requirementReference: 'REQ-UX-009',
    requirementTypes: ['other'],
    severity: 'low',
    solutionProposal: 'Source password guidance from the same policy metadata used by validation.',
    type: 'implementation_tests',
  },
  {
    label: 'OIDC provider latency has no alert threshold',
    description: 'Provider latency is recorded but does not participate in service-level alerting.',
    evidenceLocations: [
      evidence(identityRepositoryUrl, 'a81c5e42', 'ops/alerts/identity.yml', 74, 5),
      evidence(identityRepositoryUrl, 'a81c5e42', 'src/observability/oidcMetrics.ts', 39, 10),
    ],
    requirementReference: 'REQ-OPS-018',
    requirementTypes: ['performance', 'non_functional'],
    severity: 'info',
    solutionProposal: 'Add percentile-based latency alerts with a sustained evaluation window.',
    type: 'implementation_tests',
  },
];

const analyticsFindingSeeds: readonly FindingSeed[] = [
  {
    label: 'CSV export query bypasses the tenant filter',
    description: 'The asynchronous export path reconstructs a query without carrying the dashboard tenant predicate.',
    evidenceLocations: [
      evidence(analyticsRepositoryUrl, '5c317be9', 'src/exports/ExportQueryBuilder.ts', 144, 16),
      evidence(analyticsRepositoryUrl, '5c317be9', 'src/exports/ExportWorker.ts', 73, 12),
    ],
    requirementReference: 'REQ-DATA-004',
    requirementTypes: ['security', 'compliance'],
    severity: 'critical',
    solutionProposal: 'Require tenant scope in the export query object and enforce it in the repository boundary.',
    type: 'requirements_implementation',
  },
  {
    label: 'Dashboard aggregation can scan an unbounded range',
    description: 'A custom date range can bypass the configured maximum lookback and trigger a full event-table scan.',
    evidenceLocations: [
      evidence(analyticsRepositoryUrl, '5c317be9', 'src/analytics/AggregationService.ts', 88, 14),
      evidence(analyticsRepositoryUrl, '5c317be9', 'src/analytics/RangePolicy.ts', 41, 9),
    ],
    requirementReference: 'REQ-PERF-007',
    requirementTypes: ['performance', 'architecture'],
    severity: 'high',
    solutionProposal: 'Validate range bounds before query construction and return an actionable limit error.',
    type: 'requirements_implementation',
  },
  {
    label: 'Timezone boundary behavior lacks coverage',
    description: 'Aggregation tests do not cover daylight-saving transitions or mixed user and dataset timezones.',
    evidenceLocations: [
      evidence(analyticsRepositoryUrl, '5c317be9', 'tests/analytics/timeBuckets.test.ts', 57, 7),
    ],
    requirementReference: 'REQ-ANALYTICS-016',
    requirementTypes: ['testing'],
    severity: 'medium',
    solutionProposal: 'Add fixed-clock cases for DST gaps, overlaps, and dataset timezone conversion.',
    type: 'requirements_tests',
  },
  {
    label: 'Failed refresh state is not surfaced',
    description: 'A dashboard keeps displaying stale values without identifying that its scheduled refresh failed.',
    evidenceLocations: [
      evidence(analyticsRepositoryUrl, '5c317be9', 'src/dashboard/useDashboardRefresh.ts', 126, 18),
    ],
    requirementReference: 'REQ-UX-023',
    requirementTypes: ['non_functional', 'functional'],
    severity: 'medium',
    solutionProposal: 'Retain the last successful values with a visible stale marker and sanitized failure details.',
    type: 'implementation_tests',
  },
  {
    label: 'Chart series can receive duplicate accessible labels',
    description: 'Generated labels use display names that are not guaranteed to be unique within one visualization.',
    evidenceLocations: [
      evidence(analyticsRepositoryUrl, '5c317be9', 'src/charts/seriesLabels.ts', 51, 20),
      evidence(analyticsRepositoryUrl, '5c317be9', 'tests/charts/seriesLabels.test.ts', 68, 6),
    ],
    requirementReference: 'REQ-A11Y-010',
    requirementTypes: ['other', 'code_quality'],
    severity: 'low',
    solutionProposal: 'Include the stable series dimension when duplicate display names are detected.',
    type: 'requirements_implementation',
  },
  {
    label: 'Worker saturation metric is undocumented',
    description: 'The metric is emitted but has no operational description, owner, or response guidance.',
    evidenceLocations: [
      evidence(analyticsRepositoryUrl, '5c317be9', 'ops/runbooks/analytics-workers.md', 22, 1),
    ],
    requirementReference: 'REQ-OPS-021',
    requirementTypes: ['performance'],
    severity: 'info',
    solutionProposal: 'Document the metric, thresholds, common causes, and safe scaling response.',
    type: 'implementation_tests',
  },
];

function createFindings(
  reportId: string,
  seeds: readonly FindingSeed[],
  statuses: readonly FindingStatus[],
): readonly ReportFinding[] {
  return seeds.map((seed, index) => ({
    ...seed,
    id: `${reportId}-finding-${index + 1}`,
    status: statuses[index] ?? 'open',
  }));
}

const reportFixtures: readonly VerificationReport[] = [
  {
    id: 'meridian-report-2026-08',
    projectId: 'meridian-commerce',
    validationRunId: 'meridian-validation-2026-08',
    title: 'Release readiness · August 2026',
    description: 'Checkout, payment, refund, and operational evidence for the August release candidate.',
    status: 'final',
    summary: {
      filesAnalyzed: 312,
      implementationCoverage: 88,
      requirementsTotal: 48,
      requirementTypes: createRequirementTypeCounts({
        business: 5,
        functional: 9,
        non_functional: 5,
        code_quality: 4,
        compliance: 4,
        security: 5,
        testing: 5,
        architecture: 4,
        performance: 5,
        other: 2,
      }),
      requirementsVerified: 41,
      testCoverage: 82,
    },
    findings: createFindings(
      'meridian-report-2026-08',
      meridianFindingSeeds,
      ['open', 'accepted', 'open', 'resolved', 'open', 'dismissed', 'resolved'],
    ),
    createdAt: '2026-08-08T09:20:00Z',
    updatedAt: '2026-08-10T14:42:00Z',
  },
  {
    id: 'meridian-report-2026-07',
    projectId: 'meridian-commerce',
    validationRunId: 'meridian-validation-2026-07',
    title: 'Checkout regression baseline · July 2026',
    description: 'Archived baseline captured before the payment retry and refund remediation work.',
    status: 'archived',
    summary: {
      filesAnalyzed: 284,
      implementationCoverage: 79,
      requirementsTotal: 46,
      requirementTypes: createRequirementTypeCounts({
        business: 5,
        functional: 9,
        non_functional: 5,
        code_quality: 4,
        compliance: 4,
        security: 5,
        testing: 5,
        architecture: 4,
        performance: 4,
        other: 1,
      }),
      requirementsVerified: 36,
      testCoverage: 71,
    },
    findings: createFindings(
      'meridian-report-2026-07',
      meridianFindingSeeds,
      ['open', 'open', 'open', 'open', 'accepted', 'dismissed', 'resolved'],
    ),
    createdAt: '2026-07-12T10:05:00Z',
    updatedAt: '2026-07-14T16:18:00Z',
  },
  {
    id: 'identity-report-2026-08',
    projectId: 'identity-platform',
    validationRunId: 'identity-validation-2026-08',
    title: 'Identity controls review · August 2026',
    description: 'Session, privilege, MFA, account lifecycle, and authorization audit verification.',
    status: 'draft',
    summary: {
      filesAnalyzed: 198,
      implementationCoverage: 81,
      requirementsTotal: 31,
      requirementTypes: createRequirementTypeCounts({
        business: 3,
        functional: 5,
        non_functional: 3,
        code_quality: 2,
        compliance: 4,
        security: 6,
        testing: 3,
        architecture: 2,
        performance: 2,
        other: 1,
      }),
      requirementsVerified: 25,
      testCoverage: 74,
    },
    findings: createFindings(
      'identity-report-2026-08',
      identityFindingSeeds,
      ['resolved', 'open', 'open', 'accepted', 'open', 'dismissed', 'resolved'],
    ),
    createdAt: '2026-08-07T13:10:00Z',
    updatedAt: '2026-08-09T11:34:00Z',
  },
  {
    id: 'identity-report-2026-06',
    projectId: 'identity-platform',
    validationRunId: 'identity-validation-2026-06',
    title: 'Authentication hardening baseline · June 2026',
    description: 'Final baseline used to prioritize the current session and MFA hardening work.',
    status: 'final',
    summary: {
      filesAnalyzed: 176,
      implementationCoverage: 72,
      requirementsTotal: 29,
      requirementTypes: createRequirementTypeCounts({
        business: 3,
        functional: 5,
        non_functional: 3,
        code_quality: 2,
        compliance: 4,
        security: 6,
        testing: 2,
        architecture: 2,
        performance: 1,
        other: 1,
      }),
      requirementsVerified: 20,
      testCoverage: 68,
    },
    findings: createFindings(
      'identity-report-2026-06',
      identityFindingSeeds,
      ['open', 'open', 'open', 'open', 'accepted', 'dismissed', 'resolved'],
    ),
    createdAt: '2026-06-18T08:45:00Z',
    updatedAt: '2026-06-20T15:22:00Z',
  },
  {
    id: 'analytics-report-2026-08',
    projectId: 'analytics-workbench',
    validationRunId: 'analytics-validation-2026-08',
    title: 'Analytics quality gate · August 2026',
    description: 'Tenant isolation, query performance, refresh resilience, and visualization accessibility review.',
    status: 'final',
    summary: {
      filesAnalyzed: 167,
      implementationCoverage: 91,
      requirementsTotal: 26,
      requirementTypes: createRequirementTypeCounts({
        business: 2,
        functional: 4,
        non_functional: 3,
        code_quality: 3,
        compliance: 2,
        security: 2,
        testing: 2,
        architecture: 2,
        performance: 5,
        other: 1,
      }),
      requirementsVerified: 24,
      testCoverage: 86,
    },
    findings: createFindings(
      'analytics-report-2026-08',
      analyticsFindingSeeds,
      ['resolved', 'accepted', 'open', 'resolved', 'dismissed', 'resolved'],
    ),
    createdAt: '2026-08-05T12:15:00Z',
    updatedAt: '2026-08-06T17:05:00Z',
  },
  {
    id: 'analytics-report-2026-05',
    projectId: 'analytics-workbench',
    validationRunId: 'analytics-validation-2026-05',
    title: 'Dashboard reliability baseline · May 2026',
    description: 'Archived dashboard and worker baseline before tenant export remediation.',
    status: 'archived',
    summary: {
      filesAnalyzed: 149,
      implementationCoverage: 76,
      requirementsTotal: 24,
      requirementTypes: createRequirementTypeCounts({
        business: 2,
        functional: 4,
        non_functional: 3,
        code_quality: 2,
        compliance: 2,
        security: 2,
        testing: 2,
        architecture: 2,
        performance: 4,
        other: 1,
      }),
      requirementsVerified: 18,
      testCoverage: 69,
    },
    findings: createFindings(
      'analytics-report-2026-05',
      analyticsFindingSeeds,
      ['open', 'open', 'open', 'accepted', 'dismissed', 'resolved'],
    ),
    createdAt: '2026-05-21T09:30:00Z',
    updatedAt: '2026-05-23T13:44:00Z',
  },
];

export function getReportsForProject(projectId: string): readonly VerificationReport[] {
  return reportFixtures.filter((report) => report.projectId === projectId);
}
