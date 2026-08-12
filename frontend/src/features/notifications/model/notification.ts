import type { ProjectWorkflowSection } from '../../projects/model/project';

export type NotificationTone = 'info' | 'success' | 'warning';

export interface NotificationTarget {
  readonly projectId: string;
  readonly section: ProjectWorkflowSection;
}

export interface UserNotification {
  readonly description: string;
  readonly id: string;
  readonly isUnread: boolean;
  readonly projectName?: string;
  readonly target?: NotificationTarget;
  readonly timeLabel: string;
  readonly title: string;
  readonly tone: NotificationTone;
}

export interface NotificationPage {
  readonly items: UserNotification[];
  readonly nextPageIndex: number | null;
  readonly totalCount: number;
}
