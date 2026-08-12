import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

import styles from './Timeline.module.css';

export type TimelineAxis = 'center' | 'start';
export type TimelineDensity = 'comfortable' | 'compact';
export type TimelineItemAlign = 'center' | 'start';
export type TimelineItemStatus =
  | 'current'
  | 'danger'
  | 'default'
  | 'muted'
  | 'success'
  | 'warning';
export type TimelinePlacement = 'alternate' | TimelineSide;
export type TimelineSide = 'end' | 'start';
export type TimelineSize = 'lg' | 'md' | 'sm';

interface TimelineRootProps extends OlHTMLAttributes<HTMLOListElement> {
  readonly axis?: TimelineAxis;
  readonly density?: TimelineDensity;
  readonly itemAlign?: TimelineItemAlign;
  readonly placement?: TimelinePlacement;
  readonly size?: TimelineSize;
}

interface TimelineItemProps extends LiHTMLAttributes<HTMLLIElement> {
  readonly align?: TimelineItemAlign;
  readonly side?: TimelineSide;
  readonly status?: TimelineItemStatus;
  readonly _index?: number;
  readonly _isLast?: boolean;
  readonly _side?: TimelineSide;
}

interface TimelineMarkerProps extends HTMLAttributes<HTMLSpanElement> {
  readonly status?: TimelineItemStatus;
}

interface TimelineConnectorProps extends HTMLAttributes<HTMLSpanElement> {
  readonly force?: boolean;
}

interface TimelineContentProps extends HTMLAttributes<HTMLDivElement> {
  readonly side?: TimelineSide;
}

interface TimelineRootContextValue {
  readonly itemAlign: TimelineItemAlign;
  readonly placement: TimelinePlacement;
}

interface TimelineItemContextValue {
  readonly align: TimelineItemAlign;
  readonly index: number;
  readonly isLast: boolean;
  readonly side: TimelineSide;
  readonly status: TimelineItemStatus;
}

const TimelineRootContext = createContext<TimelineRootContextValue>({
  itemAlign: 'start',
  placement: 'end',
});

const TimelineItemContext = createContext<TimelineItemContextValue>({
  align: 'start',
  index: 0,
  isLast: false,
  side: 'end',
  status: 'default',
});

function joinClassNames(...classNames: readonly (string | undefined)[]) {
  return classNames.filter(Boolean).join(' ');
}

function resolveSide(
  index: number,
  placement: TimelinePlacement,
  explicitSide?: TimelineSide,
): TimelineSide {
  if (explicitSide) {
    return explicitSide;
  }

  if (placement === 'alternate') {
    return index % 2 === 0 ? 'end' : 'start';
  }

  return placement;
}

function isTimelineItem(node: ReactNode): node is ReactElement<TimelineItemProps> {
  return isValidElement(node) && node.type === TimelineItem;
}

function TimelineRoot({
  axis = 'start',
  children,
  className,
  density = 'comfortable',
  itemAlign = 'start',
  placement = 'end',
  size = 'md',
  ...props
}: TimelineRootProps) {
  const contextValue = useMemo(
    () => ({ itemAlign, placement }),
    [itemAlign, placement],
  );
  const childArray = Children.toArray(children);
  const itemCount = childArray.filter(isTimelineItem).length;
  let itemIndex = 0;

  const normalizedChildren = childArray.map((child) => {
    if (!isTimelineItem(child)) {
      return child;
    }

    const index = itemIndex;
    itemIndex += 1;

    return cloneElement(child, {
      _index: index,
      _isLast: index === itemCount - 1,
      _side: resolveSide(index, placement, child.props.side),
    });
  });

  return (
    <TimelineRootContext.Provider value={contextValue}>
      <ol
        {...props}
        className={joinClassNames(styles.timeline, className)}
        data-axis={axis}
        data-density={density}
        data-placement={placement}
        data-size={size}
        data-slot="timeline"
      >
        {normalizedChildren}
      </ol>
    </TimelineRootContext.Provider>
  );
}

function TimelineItem({
  _index = 0,
  _isLast = false,
  _side,
  align,
  children,
  className,
  side,
  status = 'default',
  ...props
}: TimelineItemProps) {
  const { itemAlign, placement } = useContext(TimelineRootContext);
  const resolvedAlign = align ?? itemAlign;
  const resolvedSide = _side ?? resolveSide(_index, placement, side);
  const contextValue = useMemo(
    () => ({
      align: resolvedAlign,
      index: _index,
      isLast: _isLast,
      side: resolvedSide,
      status,
    }),
    [_index, _isLast, resolvedAlign, resolvedSide, status],
  );
  const looseChildren: ReactNode[] = [];
  const railParts: ReactNode[] = [];
  let customRail: ReactElement<HTMLAttributes<HTMLSpanElement>> | undefined;

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === TimelineRail) {
      customRail = child as ReactElement<HTMLAttributes<HTMLSpanElement>>;
    } else if (
      isValidElement(child)
      && (child.type === TimelineMarker || child.type === TimelineConnector)
    ) {
      railParts.push(child);
    } else {
      looseChildren.push(child);
    }
  });

  const rail = customRail
    ? cloneElement(customRail, {
        children: (
          <>
            {customRail.props.children}
            {railParts}
          </>
        ),
      })
    : <TimelineRail>{railParts}</TimelineRail>;

  return (
    <TimelineItemContext.Provider value={contextValue}>
      <li
        {...props}
        aria-current={status === 'current' ? 'true' : props['aria-current']}
        className={joinClassNames(styles.item, className)}
        data-align={resolvedAlign}
        data-index={_index}
        data-last={_isLast || undefined}
        data-side={resolvedSide}
        data-slot="timeline-item"
        data-status={status}
      >
        {looseChildren}
        {rail}
      </li>
    </TimelineItemContext.Provider>
  );
}

function TimelineRail({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  const childArray = Children.toArray(children);
  const hasMarker = childArray.some(
    (child) => isValidElement(child) && child.type === TimelineMarker,
  );
  const hasConnector = childArray.some(
    (child) => isValidElement(child) && child.type === TimelineConnector,
  );

  return (
    <span
      {...props}
      className={joinClassNames(styles.rail, className)}
      data-slot="timeline-rail"
    >
      {!hasMarker ? <TimelineMarker /> : null}
      {children}
      {!hasConnector ? <TimelineConnector /> : null}
    </span>
  );
}

function TimelineMarker({
  children,
  className,
  status,
  ...props
}: TimelineMarkerProps) {
  const item = useContext(TimelineItemContext);

  return (
    <span
      {...props}
      aria-hidden={props['aria-hidden'] ?? true}
      className={joinClassNames(styles.marker, className)}
      data-slot="timeline-marker"
      data-status={status ?? item.status}
    >
      {children}
    </span>
  );
}

function TimelineConnector({
  className,
  force = false,
  ...props
}: TimelineConnectorProps) {
  const { isLast } = useContext(TimelineItemContext);

  if (isLast && !force) {
    return null;
  }

  return (
    <span
      {...props}
      aria-hidden="true"
      className={joinClassNames(styles.connector, className)}
      data-force={force || undefined}
      data-slot="timeline-connector"
    />
  );
}

function TimelineContent({
  className,
  side,
  ...props
}: TimelineContentProps) {
  const item = useContext(TimelineItemContext);

  return (
    <div
      {...props}
      className={joinClassNames(styles.content, className)}
      data-side={side ?? item.side}
      data-slot="timeline-content"
    />
  );
}

export function useTimelineItem() {
  return useContext(TimelineItemContext);
}

export const Timeline = Object.assign(TimelineRoot, {
  Connector: TimelineConnector,
  Content: TimelineContent,
  Item: TimelineItem,
  Marker: TimelineMarker,
  Rail: TimelineRail,
  Root: TimelineRoot,
  useItem: useTimelineItem,
});
