import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import styles from './RadarChart.module.css';

export type RadarChartSeriesTone = 'accent' | 'danger' | 'success' | 'warning';

export interface RadarChartDatum<SeriesId extends string = string> {
  readonly label: string;
  readonly values: Readonly<Record<SeriesId, number>>;
}

export interface RadarChartSeries<SeriesId extends string = string> {
  readonly id: SeriesId;
  readonly label: string;
  readonly tone?: RadarChartSeriesTone;
}

export interface RadarChartProps<SeriesId extends string = string> {
  readonly animated?: boolean;
  readonly ariaLabel: string;
  readonly className?: string | undefined;
  readonly data: readonly RadarChartDatum<SeriesId>[];
  readonly height?: CSSProperties['height'];
  readonly levels?: number;
  readonly maxValue?: number;
  readonly renderTooltip?: ((datum: RadarChartDatum<SeriesId>) => ReactNode) | undefined;
  readonly series: readonly RadarChartSeries<SeriesId>[];
}

interface Point {
  readonly x: number;
  readonly y: number;
}

interface ActiveTooltip {
  readonly anchorX: number;
  readonly datumIndex: number;
  readonly left: number;
  readonly phase: 'exiting' | 'visible';
  readonly placement: 'above' | 'below';
  readonly verticalOffset: number;
}

const VIEWBOX_WIDTH = 440;
const VIEWBOX_HEIGHT = 370;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = 174;
const CHART_RADIUS = 118;
const LABEL_RADIUS = 154;
const TOOLTIP_ESTIMATED_HEIGHT = 70;
const TOOLTIP_EXIT_DURATION = 100;
const TOOLTIP_MAX_WIDTH = 190;
const TOOLTIP_OFFSET = 10;
const POINT_HIT_RADIUS = 12;

const toneClassNames: Readonly<Record<RadarChartSeriesTone, string | undefined>> = {
  accent: styles.accent,
  danger: styles.danger,
  success: styles.success,
  warning: styles.warning,
};

function polarPoint(index: number, count: number, radius: number): Point {
  const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / count);

  return {
    x: CENTER_X + (Math.cos(angle) * radius),
    y: CENTER_Y + (Math.sin(angle) * radius),
  };
}

function pointList(points: readonly Point[]): string {
  return points.map(({ x, y }) => `${x},${y}`).join(' ');
}

function textAnchor(point: Point): 'end' | 'middle' | 'start' {
  if (point.x < CENTER_X - 12) {
    return 'end';
  }

  if (point.x > CENTER_X + 12) {
    return 'start';
  }

  return 'middle';
}

function clampValue(value: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(maximum, Math.max(0, value));
}

export function RadarChart<SeriesId extends string = string>({
  animated = true,
  ariaLabel,
  className,
  data,
  height = 320,
  levels = 5,
  maxValue,
  renderTooltip,
  series,
}: RadarChartProps<SeriesId>) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipExitTimerRef = useRef<number | undefined>(undefined);
  const activeTooltipRef = useRef<ActiveTooltip | undefined>(undefined);
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip>();
  const titleId = useId();
  const descriptionId = useId();
  const tooltipId = useId();
  const safeLevels = Math.max(1, Math.floor(levels));
  const inferredMaximum = Math.max(
    1,
    ...data.flatMap(({ values }) => series.map(({ id }) => values[id])),
  );
  const maximum = Math.max(1, maxValue ?? inferredMaximum);
  const hasRadarShape = data.length >= 3;
  const description = data
    .map(({ label, values }) => (
      `${label}: ${series.map((item) => `${item.label} ${values[item.id]}`).join(', ')}`
    ))
    .join('; ');
  const tooltipDatum = activeTooltip ? data[activeTooltip.datumIndex] : undefined;
  const tooltipPosition = activeTooltip?.placement === 'above'
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
  }, [data]);

  useEffect(() => () => {
    if (tooltipExitTimerRef.current !== undefined) {
      window.clearTimeout(tooltipExitTimerRef.current);
    }
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    const currentTooltip = activeTooltipRef.current;

    if (!canvas || !tooltip || !currentTooltip || currentTooltip.phase !== 'visible') {
      return;
    }

    const canvasWidth = canvas.getBoundingClientRect().width;
    const tooltipWidth = tooltip.getBoundingClientRect().width;
    const maximumLeft = Math.max(
      TOOLTIP_OFFSET,
      canvasWidth - tooltipWidth - TOOLTIP_OFFSET,
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
  }, [activeTooltip, tooltipDatum]);

  function showTooltip(datumIndex: number, pointElement: SVGCircleElement) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    if (tooltipExitTimerRef.current !== undefined) {
      window.clearTimeout(tooltipExitTimerRef.current);
      tooltipExitTimerRef.current = undefined;
    }

    const canvasBounds = canvas.getBoundingClientRect();
    const pointBounds = pointElement.getBoundingClientRect();
    const tooltipWidth = Math.min(
      TOOLTIP_MAX_WIDTH,
      Math.max(0, canvasBounds.width - (TOOLTIP_OFFSET * 2)),
    );
    const pointCenterX = pointBounds.left - canvasBounds.left + (pointBounds.width / 2);
    const pointCenterY = pointBounds.top - canvasBounds.top + (pointBounds.height / 2);
    const maximumLeft = Math.max(TOOLTIP_OFFSET, canvasBounds.width - tooltipWidth - TOOLTIP_OFFSET);
    const left = Math.min(
      maximumLeft,
      Math.max(TOOLTIP_OFFSET, pointCenterX - (tooltipWidth / 2)),
    );
    const placement = pointCenterY > TOOLTIP_ESTIMATED_HEIGHT + (TOOLTIP_OFFSET * 2)
      ? 'above'
      : 'below';
    const verticalOffset = placement === 'above'
      ? canvasBounds.height - pointCenterY + TOOLTIP_OFFSET
      : pointCenterY + TOOLTIP_OFFSET;

    const nextTooltip: ActiveTooltip = {
      anchorX: pointCenterX,
      datumIndex,
      left,
      phase: 'visible',
      placement,
      verticalOffset,
    };
    activeTooltipRef.current = nextTooltip;
    setActiveTooltip(nextTooltip);
  }

  function hideTooltip(datumIndex: number) {
    const currentTooltip = activeTooltipRef.current;

    if (!currentTooltip || currentTooltip.datumIndex !== datumIndex) {
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

    const exitingTooltip: ActiveTooltip = { ...currentTooltip, phase: 'exiting' };
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

  return (
    <figure className={`${styles.root} ${className ?? ''}`}>
      <div className={styles.canvas} ref={canvasRef} style={{ height }}>
        {hasRadarShape ? (
          <svg
            aria-labelledby={`${titleId} ${descriptionId}`}
            preserveAspectRatio="xMidYMid meet"
            role="group"
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          >
            <title id={titleId}>{ariaLabel}</title>
            <desc id={descriptionId}>{description}</desc>

            <g aria-hidden="true">
              {Array.from({ length: safeLevels }, (_, levelIndex) => {
                const radius = CHART_RADIUS * ((levelIndex + 1) / safeLevels);
                const points = data.map((_, index) => polarPoint(index, data.length, radius));

                return (
                  <polygon
                    className={styles.gridPolygon}
                    key={levelIndex}
                    points={pointList(points)}
                  />
                );
              })}
              {data.map((datum, index) => {
                const outerPoint = polarPoint(index, data.length, CHART_RADIUS);

                return (
                  <line
                    className={styles.gridAxis}
                    key={`${datum.label}:${index}`}
                    x1={CENTER_X}
                    x2={outerPoint.x}
                    y1={CENTER_Y}
                    y2={outerPoint.y}
                  />
                );
              })}
            </g>

            {series.map((item, seriesIndex) => {
              const seriesPoints = data.map((datum, index) => {
                const value = clampValue(datum.values[item.id], maximum);

                return {
                  datum,
                  point: polarPoint(
                    index,
                    data.length,
                    CHART_RADIUS * (value / maximum),
                  ),
                  value,
                };
              });
              const points = seriesPoints.map(({ point }) => point);

              return (
                <g
                  className={`${styles.series} ${
                    animated ? styles.animatedSeries : ''
                  } ${toneClassNames[item.tone ?? 'accent'] ?? ''}`}
                  data-series={item.id}
                  key={item.id}
                  style={animated ? { animationDelay: `${seriesIndex * 70}ms` } : undefined}
                >
                  <polygon aria-hidden="true" className={styles.seriesArea} points={pointList(points)} />
                  <polygon aria-hidden="true" className={styles.seriesLine} points={pointList(points)} />
                  {seriesPoints.map(({ datum, point, value }, index) => {
                    if (value === 0) {
                      return null;
                    }

                    return (
                      <g key={`${datum.label}:${index}`}>
                        <circle
                          aria-describedby={
                            activeTooltip?.datumIndex === index
                              && activeTooltip.phase === 'visible'
                              ? tooltipId
                              : undefined
                          }
                          aria-label={`${datum.label}: ${series
                            .map((seriesItem) => `${seriesItem.label} ${datum.values[seriesItem.id]}`)
                            .join(', ')}`}
                          className={styles.pointHitArea}
                          cx={point.x}
                          cy={point.y}
                          data-axis={datum.label}
                          onBlur={() => hideTooltip(index)}
                          onFocus={(event) => showTooltip(index, event.currentTarget)}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              hideTooltip(index);
                            }
                          }}
                          onPointerEnter={(event) => showTooltip(index, event.currentTarget)}
                          onPointerLeave={() => hideTooltip(index)}
                          r={POINT_HIT_RADIUS}
                          role="img"
                          tabIndex={0}
                        >
                          <title>
                            {`${datum.label}, ${item.label}: ${datum.values[item.id]}`}
                          </title>
                        </circle>
                        <circle
                          aria-hidden="true"
                          className={styles.seriesPoint}
                          cx={point.x}
                          cy={point.y}
                          r="3.5"
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}

            <g aria-hidden="true">
              {data.map((datum, index) => {
                const point = polarPoint(index, data.length, LABEL_RADIUS);

                return (
                  <text
                    className={styles.axisLabel}
                    dominantBaseline="middle"
                    key={`${datum.label}:${index}`}
                    textAnchor={textAnchor(point)}
                    x={point.x}
                    y={point.y}
                  >
                    {datum.label}
                  </text>
                );
              })}
            </g>
          </svg>
        ) : (
          <p className={styles.emptyState}>At least three axes are required.</p>
        )}
        {activeTooltip && tooltipDatum ? (
          <div
            aria-hidden={activeTooltip.phase === 'exiting' ? true : undefined}
            className={`${styles.tooltip} ${
              activeTooltip.phase === 'exiting'
                ? styles.tooltipExiting
                : styles.tooltipEntering
            }`}
            id={tooltipId}
            ref={tooltipRef}
            role="tooltip"
            style={tooltipPosition}
          >
            {renderTooltip ? renderTooltip(tooltipDatum) : (
              <>
                <strong>{tooltipDatum.label}</strong>
                <span>
                  {series
                    .map((item) => `${item.label}: ${tooltipDatum.values[item.id]}`)
                    .join(' · ')}
                </span>
              </>
            )}
          </div>
        ) : null}
      </div>

      <figcaption className={styles.legend}>
        {series.map((item) => (
          <span key={item.id}>
            <i
              aria-hidden="true"
              className={`${styles.legendMarker} ${toneClassNames[item.tone ?? 'accent'] ?? ''}`}
            />
            {item.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
