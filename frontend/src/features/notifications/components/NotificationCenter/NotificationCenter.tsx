import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { AppLink } from '../../../../app/routing/RouterProvider';
import { projectPath } from '../../../../app/routing/routes';
import { Shimmer } from '../../../../components/feedback/Shimmer/Shimmer';
import {
  BellIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CloseIcon,
  WarningIcon,
} from '../../../../components/icons/Icons';
import { getNotificationPage } from '../../data/notifications.fixture';
import type { NotificationTone } from '../../model/notification';
import styles from './NotificationCenter.module.css';

type NotificationView = 'all' | 'unread';

interface PopoverPosition {
  readonly bottom: number;
  readonly left: number;
  readonly maxHeight: number;
  readonly width: number;
}

const LOAD_DELAY = 800;
const POPOVER_EXIT_DURATION = 120;
const POPOVER_GUTTER = 12;
const POPOVER_GAP = 8;
const POPOVER_MIN_OUTSIDE_WIDTH = 300;
const POPOVER_WIDTH = 372;

const toneClassNames: Readonly<Record<NotificationTone, string>> = {
  info: styles.toneInfo ?? '',
  success: styles.toneSuccess ?? '',
  warning: styles.toneWarning ?? '',
};

function NotificationIcon({ tone }: { readonly tone: NotificationTone }) {
  if (tone === 'success') {
    return <CircleCheckIcon />;
  }

  if (tone === 'warning') {
    return <WarningIcon />;
  }

  return <CircleAlertIcon />;
}

function LoadingNotifications() {
  return (
    <ul aria-hidden="true" className={`${styles.list} ${styles.loadingList}`}>
      {Array.from({ length: 3 }, (_, index) => (
        <li className={styles.loadingItem} key={`loading-notification-${index}`}>
          <Shimmer className={styles.loadingIcon} />
          <div className={styles.loadingContent}>
            <Shimmer className={styles.loadingTitle} />
            <Shimmer className={styles.loadingCopy} />
            <Shimmer className={styles.loadingCopyShort} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function NotificationCenter() {
  const generatedId = useId();
  const headingId = `${generatedId}-heading`;
  const popoverId = `${generatedId}-popover`;
  const exitTimerRef = useRef<number | undefined>(undefined);
  const listScrollerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const loadTimerRef = useRef<number | undefined>(undefined);
  const markFuturePagesReadRef = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [feed, setFeed] = useState(() => getNotificationPage(0));
  const [isExiting, setIsExiting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>();
  const [view, setView] = useState<NotificationView>('all');
  const hasMore = feed.nextPageIndex !== null;
  const supportsInfiniteLoading = typeof IntersectionObserver !== 'undefined';
  const unreadCount = feed.items.filter((notification) => notification.isUnread).length;
  const visibleNotifications = useMemo(
    () => view === 'all'
      ? feed.items
      : feed.items.filter((notification) => notification.isUnread),
    [feed.items, view],
  );

  const updatePosition = useCallback(() => {
    const triggerBounds = triggerRef.current?.getBoundingClientRect();

    if (!triggerBounds) {
      return;
    }

    const navigationBounds = triggerRef.current
      ?.closest<HTMLElement>('aside')
      ?.getBoundingClientRect();
    const preferredWidth = Math.min(
      POPOVER_WIDTH,
      window.innerWidth - POPOVER_GUTTER * 2,
    );
    const outsideLeft = (navigationBounds?.right ?? triggerBounds.right) + POPOVER_GAP;
    const outsideWidth = window.innerWidth - outsideLeft - POPOVER_GUTTER;
    const canFitOutside = outsideWidth >= Math.min(
      POPOVER_MIN_OUTSIDE_WIDTH,
      preferredWidth,
    );
    const width = canFitOutside ? Math.min(preferredWidth, outsideWidth) : preferredWidth;
    const fallbackLeft = Math.min(
      Math.max(POPOVER_GUTTER, triggerBounds.right - width),
      window.innerWidth - width - POPOVER_GUTTER,
    );
    const bottom = Math.max(POPOVER_GUTTER, window.innerHeight - triggerBounds.bottom);

    setPosition({
      bottom,
      left: canFitOutside ? outsideLeft : fallbackLeft,
      maxHeight: Math.min(680, window.innerHeight - bottom - POPOVER_GUTTER),
      width,
    });
  }, []);

  const loadMore = useCallback(() => {
    const pageIndex = feed.nextPageIndex;

    if (pageIndex === null || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    loadTimerRef.current = window.setTimeout(() => {
      const nextPage = getNotificationPage(pageIndex);
      const nextItems = markFuturePagesReadRef.current
        ? nextPage.items.map((notification) => ({ ...notification, isUnread: false }))
        : nextPage.items;

      setFeed((currentFeed) => ({
        items: [...currentFeed.items, ...nextItems],
        nextPageIndex: nextPage.nextPageIndex,
        totalCount: nextPage.totalCount,
      }));
      loadingRef.current = false;
      loadTimerRef.current = undefined;
      setIsLoading(false);
    }, LOAD_DELAY);
  }, [feed.nextPageIndex]);

  function openPopover() {
    if (exitTimerRef.current !== undefined) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = undefined;
    }

    updatePosition();
    setIsMounted(true);
    setIsExiting(false);
    setIsOpen(true);
  }

  function closePopover(restoreTriggerFocus = false) {
    if (!isOpen) {
      if (restoreTriggerFocus) {
        triggerRef.current?.focus();
      }

      return;
    }

    setIsOpen(false);
    setIsExiting(true);

    if (restoreTriggerFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }

    if (exitTimerRef.current !== undefined) {
      window.clearTimeout(exitTimerRef.current);
    }

    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    exitTimerRef.current = window.setTimeout(
      () => {
        setIsMounted(false);
        setIsExiting(false);
        exitTimerRef.current = undefined;
      },
      shouldReduceMotion ? 0 : POPOVER_EXIT_DURATION,
    );
  }

  function openNotification(notificationId: string) {
    markNotification(notificationId);
    closePopover();
  }

  function markNotification(notificationId: string) {
    setFeed((currentFeed) => ({
      ...currentFeed,
      items: currentFeed.items.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isUnread: false }
          : notification,
      ),
    }));
  }

  function markAllRead() {
    panelRef.current?.focus();
    markFuturePagesReadRef.current = true;
    setFeed((currentFeed) => ({
      ...currentFeed,
      items: currentFeed.items.map((notification) =>
        notification.isUnread ? { ...notification, isUnread: false } : notification,
      ),
    }));
  }

  useEffect(() => () => {
    if (exitTimerRef.current !== undefined) {
      window.clearTimeout(exitTimerRef.current);
    }

    if (loadTimerRef.current !== undefined) {
      window.clearTimeout(loadTimerRef.current);
    }
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !isMounted) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => panelRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isMounted, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !panelRef.current?.contains(target)
        && !triggerRef.current?.contains(target)
      ) {
        closePopover();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePopover(true);
      }
    }

    const navigation = triggerRef.current?.closest<HTMLElement>('aside');
    const resizeObserver = navigation && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updatePosition)
      : undefined;

    if (navigation && resizeObserver) {
      resizeObserver.observe(navigation);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      resizeObserver?.disconnect();
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollRoot = listScrollerRef.current;

    if (
      !isOpen
      || !sentinel
      || !scrollRoot
      || !supportsInfiniteLoading
      || !hasMore
      || isLoading
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { root: scrollRoot, rootMargin: '180px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isOpen, loadMore, supportsInfiniteLoading]);

  function handlePanelBlur(event: FocusEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget;

    if (
      nextTarget instanceof Node
      && (event.currentTarget.contains(nextTarget) || triggerRef.current?.contains(nextTarget))
    ) {
      return;
    }

    closePopover();
  }

  const popoverStyle: CSSProperties | undefined = position
    ? {
        bottom: position.bottom,
        left: position.left,
        maxHeight: position.maxHeight,
        width: position.width,
      }
    : undefined;

  return (
    <div className={styles.root}>
      <button
        aria-controls={popoverId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications, no unread items'}
        className={styles.trigger}
        onClick={() => isOpen ? closePopover() : openPopover()}
        ref={triggerRef}
        title="Notifications"
        type="button"
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span aria-hidden="true" className={styles.unreadBadge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isMounted && position ? createPortal(
        <section
          aria-hidden={isExiting ? true : undefined}
          aria-labelledby={headingId}
          aria-modal="false"
          className={`${styles.popover} ${isExiting ? styles.popoverExiting : styles.popoverEntering}`}
          id={popoverId}
          inert={isExiting}
          onBlurCapture={handlePanelBlur}
          ref={panelRef}
          role="dialog"
          style={popoverStyle}
          tabIndex={-1}
        >
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Your inbox</p>
              <h2 className={styles.heading} id={headingId}>Notifications</h2>
            </div>
            <button
              aria-label="Close notifications"
              className={styles.closeButton}
              onClick={() => closePopover(true)}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          <div className={styles.toolbar}>
            <div aria-label="Notification view" className={styles.viewSelector} role="group">
              <button
                aria-pressed={view === 'all'}
                className={`${styles.viewButton} ${view === 'all' ? styles.viewButtonActive : ''}`}
                onClick={() => setView('all')}
                type="button"
              >
                All <span>{feed.items.length}</span>
              </button>
              <button
                aria-pressed={view === 'unread'}
                className={`${styles.viewButton} ${view === 'unread' ? styles.viewButtonActive : ''}`}
                disabled={unreadCount === 0}
                onClick={() => setView('unread')}
                type="button"
              >
                Unread <span>{unreadCount}</span>
              </button>
            </div>
            <button
              className={styles.markAllButton}
              disabled={unreadCount === 0}
              onClick={markAllRead}
              type="button"
            >
              Mark all read
            </button>
          </div>

          <p aria-live="polite" className={styles.visuallyHidden}>
            {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </p>

          <div className={styles.listScroller} ref={listScrollerRef}>
            {visibleNotifications.length > 0 ? (
              <ul className={styles.list}>
                {visibleNotifications.map((notification) => (
                  <li className={styles.item} key={notification.id}>
                    <AppLink
                      className={styles.itemLink}
                      onNavigate={() => openNotification(notification.id)}
                      to={notification.target
                        ? projectPath(
                            notification.target.projectId,
                            notification.target.section,
                          )
                        : '/'}
                    >
                      <span
                        aria-hidden="true"
                        className={`${styles.itemIcon} ${toneClassNames[notification.tone]}`}
                      >
                        <NotificationIcon tone={notification.tone} />
                      </span>
                      <article className={styles.itemContent}>
                        <div className={styles.itemTopline}>
                          <h3 className={styles.itemTitle}>{notification.title}</h3>
                          {notification.isUnread ? (
                            <span className={styles.unreadDot}>
                              <span className={styles.visuallyHidden}>Unread</span>
                            </span>
                          ) : null}
                        </div>
                        <p className={styles.description}>{notification.description}</p>
                        <div className={styles.metadata}>
                          <span>{notification.timeLabel}</span>
                          {notification.projectName ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{notification.projectName}</span>
                            </>
                          ) : null}
                        </div>
                      </article>
                    </AppLink>
                  </li>
                ))}
              </ul>
            ) : !isLoading ? (
              <div className={styles.emptyState}>
                <span aria-hidden="true" className={styles.emptyIcon}><CircleCheckIcon /></span>
                <h3>{hasMore ? 'No unread updates in this batch' : 'You’re all caught up'}</h3>
                <p>
                  {hasMore
                    ? 'Older notifications will continue loading automatically.'
                    : 'New workflow updates will appear here.'}
                </p>
              </div>
            ) : null}

            {isLoading ? <LoadingNotifications /> : null}

            {hasMore && !isLoading ? (
              <div aria-hidden="true" className={styles.sentinel} ref={sentinelRef} />
            ) : null}

            <div aria-live="polite" className={styles.loadStatus}>
              {isLoading ? 'Loading more notifications…' : null}
              {!isLoading && !hasMore ? `All ${feed.totalCount} notifications loaded.` : null}
              {!supportsInfiniteLoading && hasMore && !isLoading ? (
                <button className={styles.loadButton} onClick={loadMore} type="button">
                  Load more notifications
                </button>
              ) : null}
            </div>
          </div>

          <p className={styles.sessionNote}>
            {feed.items.length} of {feed.totalCount} loaded · Read state is kept for this session.
          </p>
        </section>,
        document.body,
      ) : null}
    </div>
  );
}
