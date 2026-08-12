import { useEffect, useRef } from 'react';

import {
  Timeline,
  type TimelineItemStatus,
} from '../../../components/data/Timeline/Timeline';
import { Shimmer } from '../../../components/feedback/Shimmer/Shimmer';
import {
  CheckIcon,
  CircleXIcon,
  WarningIcon,
} from '../../../components/icons/Icons';
import { PageHeader } from '../../../components/page/PageHeader/PageHeader';
import type { ProjectSummary } from '../../projects/model/project';
import workspaceStyles from '../../shared/ProjectWorkspacePage.module.css';
import { useProjectLogs } from '../hooks/useProjectLogs';
import type {
  ProjectLogEntry,
  ProjectLogScope,
  ProjectLogStatus,
} from '../model/projectLog';
import styles from './ProjectLogsPage.module.css';

interface ProjectLogsPageProps {
  readonly project: ProjectSummary;
}

const scopeLabels: Readonly<Record<ProjectLogScope, string>> = {
  codebase: 'Codebase',
  project: 'Project',
  report: 'Report',
  requirements: 'Requirements',
  system: 'System',
};

const statusLabels: Readonly<Record<ProjectLogStatus, string>> = {
  danger: 'Failed',
  info: 'Info',
  success: 'Succeeded',
  warning: 'Attention',
};

const timelineStatuses: Readonly<Record<ProjectLogStatus, TimelineItemStatus>> = {
  danger: 'danger',
  info: 'default',
  success: 'success',
  warning: 'warning',
};

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
});

function LogMarker({ status }: { readonly status: ProjectLogStatus }) {
  if (status === 'success') {
    return <CheckIcon />;
  }

  if (status === 'warning') {
    return <WarningIcon />;
  }

  if (status === 'danger') {
    return <CircleXIcon />;
  }

  return <span className={styles.infoMarker} />;
}

function LogEntryContent({ entry }: { readonly entry: ProjectLogEntry }) {
  return (
    <div className={styles.entry}>
      <div className={styles.entryTopline}>
        <h3>{entry.title}</h3>
        <time dateTime={entry.occurredAt}>
          {timestampFormatter.format(new Date(entry.occurredAt))}
        </time>
      </div>
      <p>{entry.description}</p>
      <span className={styles.visuallyHidden}>
        {scopeLabels[entry.scope]} event. Status: {statusLabels[entry.status]}.
        Actor: {entry.actor}. Reference: {entry.reference}.
      </span>
    </div>
  );
}

function renderLoadingEntries() {
  return Array.from({ length: 3 }, (_, index) => (
    <Timeline.Item aria-hidden="true" key={`loading-log-${index}`} status="muted">
      <Timeline.Marker />
      <Timeline.Content>
        <div className={styles.loadingEntry}>
          <div className={styles.loadingTopline}>
            <Shimmer className={styles.loadingTitle} />
            <Shimmer className={styles.loadingTime} />
          </div>
          <Shimmer className={styles.loadingCopy} />
          <Shimmer className={styles.loadingCopyShort} />
        </div>
      </Timeline.Content>
    </Timeline.Item>
  ));
}

export function ProjectLogsPage({ project }: ProjectLogsPageProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const {
    entries,
    hasMore,
    isLoading,
    loadMore,
    totalCount,
  } = useProjectLogs(project.id, project.name);
  const supportsInfiniteLoading = typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !supportsInfiniteLoading || !hasMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '280px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore, supportsInfiniteLoading]);

  return (
    <div className={workspaceStyles.page}>
      <PageHeader
        aside={(
          <span className={workspaceStyles.statusBadge}>
            {totalCount} mock events
          </span>
        )}
        description="Review project activity across requirements, connected codebases, validation runs, and reports."
        eyebrow={`${project.name} / Logs`}
        title="Project logs"
      />

      <section
        aria-label="Project activity"
        className={`${workspaceStyles.card} ${styles.logsCard}`}
      >
        <Timeline
          aria-label={`${project.name} activity log`}
          className={styles.timeline}
          density="comfortable"
          size="md"
        >
          {entries.map((entry) => (
            <Timeline.Item key={entry.id} status={timelineStatuses[entry.status]}>
              <Timeline.Marker>
                <LogMarker status={entry.status} />
              </Timeline.Marker>
              <Timeline.Content>
                <LogEntryContent entry={entry} />
              </Timeline.Content>
            </Timeline.Item>
          ))}
          {isLoading ? renderLoadingEntries() : null}
        </Timeline>

        {hasMore && !isLoading ? (
          <div aria-hidden="true" className={styles.sentinel} ref={sentinelRef} />
        ) : null}

        <div aria-live="polite" className={styles.loadStatus}>
          {isLoading ? 'Loading earlier events…' : null}
          {!isLoading && !hasMore ? `All ${totalCount} events loaded.` : null}
          {!supportsInfiniteLoading && hasMore && !isLoading ? (
            <button className={styles.loadButton} onClick={loadMore} type="button">
              Load earlier events
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
