import type { NotificationPage, UserNotification } from '../model/notification';

const notificationPages: readonly (readonly UserNotification[])[] = [
  [
    {
      id: 'meridian-report-review',
      title: 'Validation report is ready to review',
      description: 'Meridian Commerce has 7 open findings with evidence and proposed solutions.',
      timeLabel: '12 minutes ago',
      tone: 'success',
      isUnread: true,
      projectName: 'Meridian Commerce',
      target: {
        projectId: 'meridian-commerce',
        section: 'report',
      },
    },
    {
      id: 'analytics-requirements-review',
      title: 'Requirement set is ready',
      description: '26 normalized requirements are ready for review before codebase validation.',
      timeLabel: '48 minutes ago',
      tone: 'success',
      isUnread: true,
      projectName: 'Analytics Workbench',
      target: {
        projectId: 'analytics-workbench',
        section: 'requirements',
      },
    },
    {
      id: 'analytics-snapshot-outdated',
      title: 'Codebase snapshot needs attention',
      description: 'The selected revision changed after the latest Analytics Workbench snapshot.',
      timeLabel: '2 hours ago',
      tone: 'warning',
      isUnread: true,
      projectName: 'Analytics Workbench',
      target: {
        projectId: 'analytics-workbench',
        section: 'codebase',
      },
    },
    {
      id: 'identity-ingestion-started',
      title: 'Repository validation started',
      description: 'Identity Platform is validating repository access and the selected revision.',
      timeLabel: 'Yesterday',
      tone: 'info',
      isUnread: false,
      projectName: 'Identity Platform',
      target: {
        projectId: 'identity-platform',
        section: 'codebase',
      },
    },
    {
      id: 'workspace-ready',
      title: 'Local workspace is ready',
      description: 'Project and workflow changes in this prototype stay in this browser session.',
      timeLabel: '2 days ago',
      tone: 'info',
      isUnread: false,
    },
  ],
  [
    {
      id: 'identity-requirements-outdated',
      title: 'Requirements changed after validation',
      description: 'Identity Platform should be processed again before its next validation run.',
      timeLabel: '3 days ago',
      tone: 'warning',
      isUnread: true,
      projectName: 'Identity Platform',
      target: {
        projectId: 'identity-platform',
        section: 'requirements',
      },
    },
    {
      id: 'meridian-codebase-review',
      title: 'Codebase snapshot is ready',
      description: 'The latest Meridian Commerce revision was indexed and is ready for review.',
      timeLabel: '4 days ago',
      tone: 'success',
      isUnread: false,
      projectName: 'Meridian Commerce',
      target: {
        projectId: 'meridian-commerce',
        section: 'codebase',
      },
    },
    {
      id: 'analytics-source-processing',
      title: 'Source processing completed',
      description: 'The latest Analytics Workbench documents were normalized without errors.',
      timeLabel: '5 days ago',
      tone: 'success',
      isUnread: false,
      projectName: 'Analytics Workbench',
      target: {
        projectId: 'analytics-workbench',
        section: 'requirements',
      },
    },
    {
      id: 'meridian-report-started',
      title: 'Validation run started',
      description: 'Meridian Commerce is comparing requirements, implementation, and test evidence.',
      timeLabel: '6 days ago',
      tone: 'info',
      isUnread: false,
      projectName: 'Meridian Commerce',
      target: {
        projectId: 'meridian-commerce',
        section: 'report',
      },
    },
    {
      id: 'identity-repository-connected',
      title: 'Repository access validated',
      description: 'Identity Platform can now select a branch and commit for its snapshot.',
      timeLabel: '1 week ago',
      tone: 'success',
      isUnread: false,
      projectName: 'Identity Platform',
      target: {
        projectId: 'identity-platform',
        section: 'codebase',
      },
    },
  ],
  [
    {
      id: 'analytics-review-reminder',
      title: 'Requirement review is waiting',
      description: 'Analytics Workbench still has a requirement set ready for confirmation.',
      timeLabel: '8 days ago',
      tone: 'warning',
      isUnread: true,
      projectName: 'Analytics Workbench',
      target: {
        projectId: 'analytics-workbench',
        section: 'requirements',
      },
    },
    {
      id: 'meridian-sources-processed',
      title: '48 requirements were generated',
      description: 'Meridian Commerce source documents were processed into its current set.',
      timeLabel: '9 days ago',
      tone: 'success',
      isUnread: false,
      projectName: 'Meridian Commerce',
      target: {
        projectId: 'meridian-commerce',
        section: 'requirements',
      },
    },
    {
      id: 'notification-center-introduction',
      title: 'Workflow updates live here',
      description: 'Review completion notices and attention items from every project in one place.',
      timeLabel: '10 days ago',
      tone: 'info',
      isUnread: false,
    },
    {
      id: 'workspace-session-reminder',
      title: 'Prototype state is session-only',
      description: 'Refreshing restores fixture projects, notifications, and their original read state.',
      timeLabel: '11 days ago',
      tone: 'info',
      isUnread: false,
    },
  ],
];

const totalCount = notificationPages.reduce((count, page) => count + page.length, 0);

function cloneNotification(notification: UserNotification): UserNotification {
  return {
    ...notification,
    ...(notification.target ? { target: { ...notification.target } } : {}),
  };
}

export function getNotificationPage(pageIndex: number): NotificationPage {
  const page = notificationPages[pageIndex] ?? [];
  const nextPageIndex = pageIndex + 1 < notificationPages.length ? pageIndex + 1 : null;

  return {
    items: page.map(cloneNotification),
    nextPageIndex,
    totalCount,
  };
}
