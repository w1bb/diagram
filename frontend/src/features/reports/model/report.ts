export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingStatus = 'open' | 'accepted' | 'dismissed' | 'resolved';

export type FindingType =
  | 'requirements_implementation'
  | 'requirements_tests'
  | 'implementation_tests';

export type ReportExportFormat = 'markdown' | 'pdf' | 'html';

export type ReportStatus = 'draft' | 'final' | 'archived';

export interface ReportFinding {
  readonly description: string;
  readonly evidenceLocation: string;
  readonly id: string;
  readonly label: string;
  readonly requirementReference: string;
  readonly severity: FindingSeverity;
  readonly solutionProposal: string;
  readonly status: FindingStatus;
  readonly type: FindingType;
}

export interface ReportSummary {
  readonly filesAnalyzed: number;
  readonly implementationCoverage: number;
  readonly requirementsTotal: number;
  readonly requirementsVerified: number;
  readonly testCoverage: number;
}

export interface VerificationReport {
  readonly createdAt: string;
  readonly description: string;
  readonly findings: readonly ReportFinding[];
  readonly id: string;
  readonly projectId: string;
  readonly status: ReportStatus;
  readonly summary: ReportSummary;
  readonly title: string;
  readonly updatedAt: string;
  readonly validationRunId: string;
}
