import type {
  FindingSeverity,
  FindingStatus,
  FindingType,
  ReportFinding,
  VerificationReport,
} from '../../model/report';
import styles from './FindingsTable.module.css';

interface FindingsTableProps {
  readonly disabled: boolean;
  readonly onDiscard: (finding: ReportFinding) => void;
  readonly onEdit: (finding: ReportFinding) => void;
  readonly onSelectionChange: (findingId: string, selected: boolean) => void;
  readonly report: VerificationReport;
  readonly selectedFindingIds: ReadonlySet<string>;
}

const severityLabels: Readonly<Record<FindingSeverity, string>> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const statusLabels: Readonly<Record<FindingStatus, string>> = {
  open: 'Open',
  accepted: 'Accepted',
  dismissed: 'Dismissed',
  resolved: 'Resolved',
};

const typeLabels: Readonly<Record<FindingType, string>> = {
  requirements_implementation: 'Requirement ↔ implementation',
  requirements_tests: 'Requirement ↔ tests',
  implementation_tests: 'Implementation ↔ tests',
};

const severityClassNames: Readonly<Record<FindingSeverity, string | undefined>> = {
  critical: styles.severityCritical,
  high: styles.severityHigh,
  medium: styles.severityMedium,
  low: styles.severityLow,
  info: styles.severityInfo,
};

const statusClassNames: Readonly<Record<FindingStatus, string | undefined>> = {
  open: styles.statusOpen,
  accepted: styles.statusAccepted,
  dismissed: styles.statusDismissed,
  resolved: styles.statusResolved,
};

export function FindingsTable({
  disabled,
  onDiscard,
  onEdit,
  onSelectionChange,
  report,
  selectedFindingIds,
}: FindingsTableProps) {
  const openFindings = report.findings.filter((finding) => finding.status === 'open').length;

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <p>Detailed results</p>
          <h2>Findings</h2>
          <span>Evidence, traceability, and current disposition for this report.</span>
        </div>
        <div className={styles.headingCounts}>
          <span>{report.findings.length} total</span>
          <span>{openFindings} open</span>
        </div>
      </div>

      <div className={styles.tableScroller}>
        <table>
          <caption>Findings in {report.title}</caption>
          <thead>
            <tr>
              <th className={styles.selectionHeader} scope="col">Select</th>
              <th scope="col">Severity</th>
              <th scope="col">Finding</th>
              <th scope="col">Verification check</th>
              <th scope="col">Status</th>
              <th scope="col">Requirement</th>
              <th scope="col">Evidence</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {report.findings.map((finding) => {
              const isSelected = selectedFindingIds.has(finding.id);

              return (
                <tr className={isSelected ? styles.selectedRow : undefined} key={finding.id}>
                  <td className={styles.selectionCell}>
                    <input
                      aria-label={`Select ${finding.requirementReference}: ${finding.label}`}
                      checked={isSelected}
                      className={styles.checkbox}
                      disabled={disabled}
                      onChange={(event) =>
                        onSelectionChange(finding.id, event.currentTarget.checked)}
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <span className={`${styles.badge} ${severityClassNames[finding.severity] ?? ''}`}>
                      <span aria-hidden="true" />
                      {severityLabels[finding.severity]}
                    </span>
                  </td>
                  <td className={styles.findingCell}>
                    <strong>{finding.label}</strong>
                    <span>{finding.description}</span>
                    <small><b>Proposed:</b> {finding.solutionProposal}</small>
                  </td>
                  <td className={styles.typeCell}>{typeLabels[finding.type]}</td>
                  <td>
                    <span className={`${styles.badge} ${statusClassNames[finding.status] ?? ''}`}>
                      <span aria-hidden="true" />
                      {statusLabels[finding.status]}
                    </span>
                  </td>
                  <td><code>{finding.requirementReference}</code></td>
                  <td><code>{finding.evidenceLocation}</code></td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editAction}
                        disabled={disabled}
                        onClick={() => onEdit(finding)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className={styles.discardAction}
                        disabled={disabled || finding.status === 'dismissed'}
                        onClick={() => onDiscard(finding)}
                        title={finding.status === 'dismissed' ? 'Finding is already discarded' : undefined}
                        type="button"
                      >
                        Discard
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
