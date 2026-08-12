import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import {
  RadarChart,
  type RadarChartDatum,
  type RadarChartSeries,
} from '../../../../components/data/RadarChart/RadarChart';
import { requirementTypeLabels } from '../../../requirements/model/requirement';
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

interface Point {
  readonly x: number;
  readonly y: number;
}

interface ActiveChartTooltip {
  readonly anchorX: number;
  readonly detail: string;
  readonly key: string;
  readonly left: number;
  readonly phase: 'exiting' | 'visible';
  readonly placement: 'above' | 'below';
  readonly title: string;
  readonly verticalOffset: number;
}

type RequirementRadarSeriesId = 'errors' | 'identified';

const DONUT_CENTER = 100;
const DONUT_OUTER_RADIUS = 80;
const DONUT_INNER_RADIUS = 52;
const DONUT_GAP_DEGREES = 3;
const TOOLTIP_ESTIMATED_HEIGHT = 70;
const TOOLTIP_EXIT_DURATION = 100;
const TOOLTIP_MAX_WIDTH = 190;
const TOOLTIP_OFFSET = 10;

const requirementRadarSeries: readonly RadarChartSeries<RequirementRadarSeriesId>[] = [
  { id: 'identified', label: 'Identified', tone: 'accent' },
  { id: 'errors', label: 'With errors', tone: 'danger' },
];

function renderRequirementRadarTooltip(
  datum: RadarChartDatum<RequirementRadarSeriesId>,
) {
  const requirementCount = datum.values.identified;
  const mismatchCount = datum.values.errors;

  return (
    <>
      <strong>
        {requirementCount} {datum.label.toLocaleLowerCase()}{' '}
        requirement{requirementCount === 1 ? '' : 's'}
      </strong>
      {mismatchCount > 0 ? (
        <span>{mismatchCount} mismatch{mismatchCount === 1 ? '' : 'es'}</span>
      ) : null}
    </>
  );
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

function polarPoint(angleInDegrees: number, radius: number): Point {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: DONUT_CENTER + (Math.cos(angleInRadians) * radius),
    y: DONUT_CENTER + (Math.sin(angleInRadians) * radius),
  };
}

function donutSegmentPath(
  startPercentage: number,
  endPercentage: number,
  gapInDegrees: number,
): string {
  const segmentDegrees = (endPercentage - startPercentage) * 3.6;

  if (segmentDegrees <= 0) {
    return '';
  }

  const halfGap = Math.min(gapInDegrees / 2, segmentDegrees * 0.18);
  const startAngle = -90 + (startPercentage * 3.6) + halfGap;
  const endAngle = -90 + (endPercentage * 3.6) - halfGap - (
    segmentDegrees >= 360 ? 0.001 : 0
  );
  const outerStart = polarPoint(startAngle, DONUT_OUTER_RADIUS);
  const outerEnd = polarPoint(endAngle, DONUT_OUTER_RADIUS);
  const innerEnd = polarPoint(endAngle, DONUT_INNER_RADIUS);
  const innerStart = polarPoint(startAngle, DONUT_INNER_RADIUS);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)}`,
    `A ${DONUT_OUTER_RADIUS} ${DONUT_OUTER_RADIUS} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)}`,
    `L ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)}`,
    `A ${DONUT_INNER_RADIUS} ${DONUT_INNER_RADIUS} 0 ${largeArcFlag} 0 ${innerStart.x.toFixed(3)} ${innerStart.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}

function findingCountLabel(count: number): string {
  return `${count} finding${count === 1 ? '' : 's'}`;
}

function useChartTooltip(resetKey: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipExitTimerRef = useRef<number | undefined>(undefined);
  const activeTooltipRef = useRef<ActiveChartTooltip | undefined>(undefined);
  const [activeTooltip, setActiveTooltip] = useState<ActiveChartTooltip>();
  const tooltipId = useId();
  const tooltipPosition: CSSProperties | undefined = activeTooltip?.placement === 'above'
    ? { bottom: activeTooltip.verticalOffset, left: activeTooltip.left }
    : activeTooltip
      ? { left: activeTooltip.left, top: activeTooltip.verticalOffset }
      : undefined;

  useEffect(() => {
    if (tooltipExitTimerRef.current !== undefined) {
      window.clearTimeout(tooltipExitTimerRef.current);
      tooltipExitTimerRef.current = undefined;
    }

    activeTooltipRef.current = undefined;
    setActiveTooltip(undefined);
  }, [resetKey]);

  useEffect(() => () => {
    if (tooltipExitTimerRef.current !== undefined) {
      window.clearTimeout(tooltipExitTimerRef.current);
    }
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    const currentTooltip = activeTooltipRef.current;

    if (!container || !tooltip || !currentTooltip || currentTooltip.phase !== 'visible') {
      return;
    }

    const containerWidth = container.getBoundingClientRect().width;
    const tooltipWidth = tooltip.getBoundingClientRect().width;
    const maximumLeft = Math.max(
      TOOLTIP_OFFSET,
      containerWidth - tooltipWidth - TOOLTIP_OFFSET,
    );
    const left = Math.min(
      maximumLeft,
      Math.max(TOOLTIP_OFFSET, currentTooltip.anchorX - (tooltipWidth / 2)),
    );

    if (Math.abs(left - currentTooltip.left) < 0.5) {
      return;
    }

    const positionedTooltip = { ...currentTooltip, left };
    activeTooltipRef.current = positionedTooltip;
    setActiveTooltip(positionedTooltip);
  }, [activeTooltip]);

  function showTooltip(key: string, target: Element, title: string, detail: string) {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (tooltipExitTimerRef.current !== undefined) {
      window.clearTimeout(tooltipExitTimerRef.current);
      tooltipExitTimerRef.current = undefined;
    }

    const containerBounds = container.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    const tooltipWidth = Math.min(
      TOOLTIP_MAX_WIDTH,
      Math.max(0, containerBounds.width - (TOOLTIP_OFFSET * 2)),
    );
    const targetCenterX = targetBounds.left - containerBounds.left + (targetBounds.width / 2);
    const targetCenterY = targetBounds.top - containerBounds.top + (targetBounds.height / 2);
    const maximumLeft = Math.max(
      TOOLTIP_OFFSET,
      containerBounds.width - tooltipWidth - TOOLTIP_OFFSET,
    );
    const left = Math.min(
      maximumLeft,
      Math.max(TOOLTIP_OFFSET, targetCenterX - (tooltipWidth / 2)),
    );
    const placement = targetCenterY > TOOLTIP_ESTIMATED_HEIGHT + (TOOLTIP_OFFSET * 2)
      ? 'above'
      : 'below';
    const verticalOffset = placement === 'above'
      ? containerBounds.height - targetCenterY + TOOLTIP_OFFSET
      : targetCenterY + TOOLTIP_OFFSET;
    const nextTooltip: ActiveChartTooltip = {
      anchorX: targetCenterX,
      detail,
      key,
      left,
      phase: 'visible',
      placement,
      title,
      verticalOffset,
    };

    activeTooltipRef.current = nextTooltip;
    setActiveTooltip(nextTooltip);
  }

  function hideTooltip(key: string) {
    const currentTooltip = activeTooltipRef.current;

    if (!currentTooltip || currentTooltip.key !== key) {
      return;
    }

    if (tooltipExitTimerRef.current !== undefined) {
      window.clearTimeout(tooltipExitTimerRef.current);
      tooltipExitTimerRef.current = undefined;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      activeTooltipRef.current = undefined;
      setActiveTooltip(undefined);
      return;
    }

    const exitingTooltip: ActiveChartTooltip = { ...currentTooltip, phase: 'exiting' };
    activeTooltipRef.current = exitingTooltip;
    setActiveTooltip(exitingTooltip);
    tooltipExitTimerRef.current = window.setTimeout(() => {
      if (activeTooltipRef.current === exitingTooltip) {
        activeTooltipRef.current = undefined;
        setActiveTooltip(undefined);
      }

      tooltipExitTimerRef.current = undefined;
    }, TOOLTIP_EXIT_DURATION);
  }

  return {
    activeTooltip,
    containerRef,
    hideTooltip,
    showTooltip,
    tooltipId,
    tooltipPosition,
    tooltipRef,
  };
}

function ChartTooltipSurface({
  tooltip,
}: {
  readonly tooltip: ReturnType<typeof useChartTooltip>;
}) {
  if (!tooltip.activeTooltip) {
    return null;
  }

  return (
    <div
      aria-hidden={tooltip.activeTooltip.phase === 'exiting' ? 'true' : undefined}
      className={`${styles.chartTooltip} ${
        tooltip.activeTooltip.phase === 'exiting' ? styles.chartTooltipExiting : ''
      }`}
      id={tooltip.tooltipId}
      ref={tooltip.tooltipRef}
      role="tooltip"
      style={tooltip.tooltipPosition}
    >
      <strong>{tooltip.activeTooltip.title}</strong>
      <span>{tooltip.activeTooltip.detail}</span>
    </div>
  );
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
  const nonemptyStatusCount = statusCounts.filter(({ count }) => count > 0).length;
  let statusOffset = 0;
  const statusSegments = statusCounts.map((statusCount) => {
    const segmentPercentage = report.findings.length === 0
      ? 0
      : (statusCount.count / report.findings.length) * 100;
    const segmentStart = statusOffset;
    statusOffset += segmentPercentage;
    return {
      ...statusCount,
      path: donutSegmentPath(
        segmentStart,
        statusOffset,
        nonemptyStatusCount > 1 ? DONUT_GAP_DEGREES : 0,
      ),
      percentage: segmentPercentage,
    };
  });
  const statusSummary = statusCounts
    .map(({ count, label }) => `${count} ${label.toLowerCase()}`)
    .join(', ');
  const tooltipResetKey = report.findings
    .map(({ id, severity, status }) => `${id}:${severity}:${status}`)
    .join('|');
  const severityTooltip = useChartTooltip(`${report.id}:severity:${tooltipResetKey}`);
  const statusTooltip = useChartTooltip(`${report.id}:status:${tooltipResetKey}`);
  const statusChartTitleId = useId();
  const statusChartDescriptionId = useId();
  const errorRequirementKeys = new Set(
    report.findings
      .filter((finding) => finding.status === 'open' || finding.status === 'accepted')
      .flatMap((finding) => finding.requirementTypes.map(
        (requirementType) => `${requirementType}:${finding.requirementReference}`,
      )),
  );
  const requirementTypeData: readonly RadarChartDatum<RequirementRadarSeriesId>[] =
    report.summary.requirementTypes.map(({ identified, type }) => ({
      label: requirementTypeLabels[type],
      values: {
        errors: Array.from(errorRequirementKeys).filter((key) => key.startsWith(`${type}:`)).length,
        identified,
      },
    }));

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
        <div className={styles.severityChartArea} ref={severityTooltip.containerRef}>
          <ul className={styles.severityChart}>
            {severityCounts.map(({ count, label, severity }) => {
              const tooltipKey = `severity:${severity}`;
              const detail = `${findingCountLabel(count)} · ${percentage(
                count,
                report.findings.length,
              )}% of total`;
              const isTooltipVisible = severityTooltip.activeTooltip?.key === tooltipKey
                && severityTooltip.activeTooltip.phase === 'visible';

              return (
                <li key={severity}>
                  <div
                    aria-describedby={isTooltipVisible ? severityTooltip.tooltipId : undefined}
                    aria-label={`${label} severity: ${detail}`}
                    className={styles.severityMetric}
                    onBlur={() => severityTooltip.hideTooltip(tooltipKey)}
                    onFocus={(event) => severityTooltip.showTooltip(
                      tooltipKey,
                      event.currentTarget,
                      `${label} severity`,
                      detail,
                    )}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        severityTooltip.hideTooltip(tooltipKey);
                        event.currentTarget.blur();
                      }
                    }}
                    onPointerEnter={(event) => severityTooltip.showTooltip(
                      tooltipKey,
                      event.currentTarget,
                      `${label} severity`,
                      detail,
                    )}
                    onPointerLeave={() => severityTooltip.hideTooltip(tooltipKey)}
                    role="img"
                    tabIndex={0}
                  >
                    <span className={styles.severityLabel}>{label}</span>
                    <span className={styles.barTrack} aria-hidden="true">
                      <span
                        className={`${styles.barFill} ${severityClassNames[severity] ?? ''}`}
                        style={{ width: `${(count / maximumSeverityCount) * 100}%` }}
                      />
                    </span>
                    <strong>{count}</strong>
                  </div>
                </li>
              );
            })}
          </ul>
          <ChartTooltipSurface tooltip={severityTooltip} />
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHeading}>
          <div>
            <p>Finding lifecycle</p>
            <h2>Overall finding status</h2>
          </div>
        </div>
        <div className={styles.statusChart} ref={statusTooltip.containerRef}>
          <div className={styles.donutGraphic}>
            <svg
              aria-labelledby={`${statusChartTitleId} ${statusChartDescriptionId}`}
              role="group"
              viewBox="0 0 200 200"
            >
              <title id={statusChartTitleId}>Finding status distribution</title>
              <desc id={statusChartDescriptionId}>{statusSummary}</desc>
              <circle className={styles.donutTrack} cx="100" cy="100" r="66" />
              {statusSegments.map((segment, index) => {
                if (!segment.path) {
                  return null;
                }

                const tooltipKey = `status:${segment.status}`;
                const detail = `${findingCountLabel(segment.count)} · ${Math.round(
                  segment.percentage,
                )}% of total`;
                const isTooltipVisible = statusTooltip.activeTooltip?.key === tooltipKey
                  && statusTooltip.activeTooltip.phase === 'visible';

                return (
                  <path
                    aria-describedby={isTooltipVisible ? statusTooltip.tooltipId : undefined}
                    aria-label={`${segment.label}: ${detail}`}
                    className={`${styles.donutSegment} ${statusClassNames[segment.status] ?? ''}`}
                    d={segment.path}
                    key={segment.status}
                    onBlur={() => statusTooltip.hideTooltip(tooltipKey)}
                    onFocus={(event) => statusTooltip.showTooltip(
                      tooltipKey,
                      event.currentTarget,
                      segment.label,
                      detail,
                    )}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        statusTooltip.hideTooltip(tooltipKey);
                        event.currentTarget.blur();
                      }
                    }}
                    onPointerEnter={(event) => statusTooltip.showTooltip(
                      tooltipKey,
                      event.currentTarget,
                      segment.label,
                      detail,
                    )}
                    onPointerLeave={() => statusTooltip.hideTooltip(tooltipKey)}
                    role="img"
                    style={{ animationDelay: `${index * 45}ms` }}
                    tabIndex={0}
                  >
                    <title>{segment.label}: {detail}</title>
                  </path>
                );
              })}
            </svg>
            <span className={styles.donutCenter}>
              <strong>{report.findings.length}</strong>
              <small>Total</small>
            </span>
          </div>
          <ul className={styles.statusLegend}>
            {statusCounts.map(({ count, label, status }) => (
              <li key={status}>
                <span aria-hidden="true" className={`${styles.legendDot} ${statusClassNames[status] ?? ''}`} />
                <span>{label}</span>
                <span className={styles.statusLegendValue}>
                  <strong>{count}</strong>
                  <small>{percentage(count, report.findings.length)}%</small>
                </span>
              </li>
            ))}
          </ul>
          <ChartTooltipSurface tooltip={statusTooltip} />
        </div>
      </article>

      <article className={`${styles.card} ${styles.requirementTypeCard}`}>
        <div className={styles.cardHeading}>
          <div>
            <p>Requirement distribution</p>
            <h2>Types identified and with errors</h2>
          </div>
          <span className={styles.total}>{report.summary.requirementsTotal} identified</span>
        </div>
        <p className={styles.radarDetail}>
          Current errors count distinct requirements with open or accepted findings.
        </p>
        <RadarChart
          ariaLabel="Identified requirements and requirements with errors by requirement type"
          className={styles.radarChart}
          data={requirementTypeData}
          height="clamp(280px, 32vw, 360px)"
          key={report.id}
          renderTooltip={renderRequirementRadarTooltip}
          series={requirementRadarSeries}
        />
      </article>
    </section>
  );
}
