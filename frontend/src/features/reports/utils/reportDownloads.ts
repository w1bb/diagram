import type {
  ReportExportFormat,
  ReportFinding,
  VerificationReport,
} from '../model/report';

const exportFormatLabels: Readonly<Record<ReportExportFormat, string>> = {
  html: 'HTML',
  markdown: 'Markdown',
  pdf: 'PDF',
};

function fileStem(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'report';
}

export function downloadMarkdown(content: string, name: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');

  downloadLink.download = `${fileStem(name)}.md`;
  downloadLink.href = objectUrl;
  downloadLink.hidden = true;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function createProposedSolution(
  report: VerificationReport,
  findings: readonly ReportFinding[],
): string {
  const findingSections = findings.map((finding, index) => [
    `### ${index + 1}. ${finding.requirementReference} — ${finding.label}`,
    '',
    `**Finding:** ${finding.description}`,
    '',
    `**Evidence:** \`${finding.evidenceLocation}\``,
    '',
    `**Proposed change:** ${finding.solutionProposal}`,
    '',
    '**Suggested validation:** Add or update focused automated coverage, then rerun the relevant verification check against the same requirement and evidence location.',
  ].join('\n'));

  return [
    '# Proposed remediation plan',
    '',
    `> Mocked frontend proposal for ${report.title}. Review and edit this content before using it.`,
    '',
    '## Scope',
    '',
    `This plan addresses ${findings.length} selected ${findings.length === 1 ? 'finding' : 'findings'} from validation run \`${report.validationRunId}\`.`,
    '',
    '## Recommended changes',
    '',
    findingSections.join('\n\n'),
    '',
    '## Completion checklist',
    '',
    '- Implement the proposed changes in a reviewable branch.',
    '- Add regression coverage for each selected requirement.',
    '- Re-run validation and confirm that the evidence remains traceable.',
    '- Review any remaining accepted or open findings before release.',
    '',
  ].join('\n');
}

export function createMockExport(
  report: VerificationReport,
  format: ReportExportFormat,
): string {
  const findings = report.findings.map((finding) => [
    `### ${finding.requirementReference} — ${finding.label}`,
    '',
    `- Severity: ${finding.severity}`,
    `- Status: ${finding.status}`,
    `- Evidence: \`${finding.evidenceLocation}\``,
    `- Proposed solution: ${finding.solutionProposal}`,
    '',
    finding.description,
  ].join('\n'));

  return [
    `# ${report.title}`,
    '',
    `> Mock ${exportFormatLabels[format]} export. This browser-created Markdown file does not represent a persisted report export.`,
    '',
    report.description,
    '',
    '## Summary',
    '',
    `- Report status: ${report.status}`,
    `- Validation run: \`${report.validationRunId}\``,
    `- Requirements verified: ${report.summary.requirementsVerified}/${report.summary.requirementsTotal}`,
    `- Implementation coverage: ${report.summary.implementationCoverage}%`,
    `- Test coverage: ${report.summary.testCoverage}%`,
    `- Files analyzed: ${report.summary.filesAnalyzed}`,
    '',
    '## Findings',
    '',
    findings.join('\n\n'),
    '',
  ].join('\n');
}
