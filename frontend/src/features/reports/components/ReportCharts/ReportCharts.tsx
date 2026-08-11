import type {
  FindingSeverity,
  FindingStatus,
  VerificationReport,
} from '../../model/report';
import styles from './ReportCharts.module.css';

interface ReportChartsProps {
  readonly report: VerificationReport;
}

interface SeverityDefinition {
  readonly label: string;
  readonly severity: FindingSeverity;
}

interface StatusDefinition {
  readonly label: string;
  readonly status: FindingStatus;
}

const severityDefinitions: readonly SeverityDefinition[] = [
  { severity: 'critical', label: 'Critical' },
  { severity: 'high', label: 'High' },
  { severity: 'medium', label: 'Medium' },
  { severity: 'low', label: 'Low' },
  { severity: 'info', label: 'Info' },
];

const statusDefinitions: readonly StatusDefinition[] = [
  { status: 'open', label: 'Open' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'resolved', label: 'Resolved' },
  { status: 'dismissed', label: 'Dismissed' },
];

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
  resolved: styles.statusResolved,
  dismissed: styles.statusDismissed,
};

function percentage(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export function ReportCharts({ report }: ReportChartsProps) {
  const requirementCoverage = percentage(
    report.summary.requirementsVerified,
    report.summary.requirementsTotal,
  );
  const overallScore = Math.round(
    (requirementCoverage + report.summary.implementationCoverage + report.summary.testCoverage) / 3,
  );
  const overallLabel = overallScore >= 85
    ? 'Healthy'
    : overallScore >= 70
      ? 'Needs attention'
      : 'At risk';
  const overallClassName = overallScore >= 85
    ? styles.overallHealthy
    : overallScore >= 70
      ? styles.overallAttention
      : styles.overallRisk;

  const severityCounts = severityDefinitions.map((definition) => ({
    ...definition,
    count: report.findings.filter((finding) => finding.severity === definition.severity).length,
  }));
  const maximumSeverityCount = Math.max(1, ...severityCounts.map(({ count }) => count));

  const statusCounts = statusDefinitions.map((definition) => ({
    ...definition,
    count: report.findings.filter((finding) => finding.status === definition.status).length,
  }));
  let statusOffset = 0;
  const statusSegments = statusCounts.map((statusCount) => {
    const segmentPercentage = report.findings.length === 0
      ? 0
      : (statusCount.count / report.findings.length) * 100;
    const segment = { ...statusCount, offset: statusOffset, percentage: segmentPercentage };
    statusOffset += segmentPercentage;
    return segment;
  });
  const openFindings = statusCounts.find(({ status }) => status === 'open')?.count ?? 0;
  const statusSummary = statusCounts
    .map(({ count, label }) => `${count} ${label.toLowerCase()}`)
    .join(', ');

  return (
    <section aria-label="Report analysis" className={styles.charts}>
      <article className={styles.card}>
        <div className={styles.cardHeading}>
          <div>
            <p>Overall posture</p>
            <h2>Verification confidence</h2>
          </div>
          <span className={`${styles.overallBadge} ${overallClassName}`}>{overallLabel}</span>
        </div>
        <div className={styles.overallScore}>
          <strong>{overallScore}%</strong>
          <span>combined confidence</span>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={overallClassName} style={{ width: `${overallScore}%` }} />
        </div>
        <p className={styles.overallDetail}>
          {report.summary.requirementsVerified} of {report.summary.requirementsTotal} requirements verified across implementation and test evidence.
        </p>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHeading}>
          <div>
            <p>Risk distribution</p>
            <h2>Findings by severity</h2>
          </div>
          <span className={styles.total}>{report.findings.length} total</span>
        </div>
        <ul className={styles.severityChart}>
          {severityCounts.map(({ count, label, severity }) => (
            <li key={severity}>
              <span className={styles.severityLabel}>{label}</span>
              <span className={styles.barTrack} aria-hidden="true">
                <span
                  className={`${styles.barFill} ${severityClassNames[severity] ?? ''}`}
                  style={{ width: `${(count / maximumSeverityCount) * 100}%` }}
                />
              </span>
              <strong>{count}</strong>
            </li>
          ))}
        </ul>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHeading}>
          <div>
            <p>Finding lifecycle</p>
            <h2>Overall finding status</h2>
          </div>
        </div>
        <div className={styles.statusChart}>
          <div className={styles.donutGraphic}>
            <svg aria-label={`Finding status: ${statusSummary}`} role="img" viewBox="0 0 42 42">
              <circle className={styles.donutTrack} cx="21" cy="21" r="15.9" />
              {statusSegments.map((segment) => (
                <circle
                  className={`${styles.donutSegment} ${statusClassNames[segment.status] ?? ''}`}
                  cx="21"
                  cy="21"
                  key={segment.status}
                  pathLength="100"
                  r="15.9"
                  strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`}
                  strokeDashoffset={-segment.offset}
                  transform="rotate(-90 21 21)"
                />
              ))}
            </svg>
            <span className={styles.donutCenter}>
              <strong>{openFindings}</strong>
              <small>open</small>
            </span>
          </div>
          <ul className={styles.statusLegend}>
            {statusCounts.map(({ count, label, status }) => (
              <li key={status}>
                <span aria-hidden="true" className={`${styles.legendDot} ${statusClassNames[status] ?? ''}`} />
                <span>{label}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  );
}
