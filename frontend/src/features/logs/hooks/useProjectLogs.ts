import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getProjectLogEntries } from '../data/projectLogs.fixture';

const initialPageSize = 20;
const pageSize = 20;
const mockPageDelay = 900;

export function useProjectLogs(projectId: string, projectName: string) {
  const allEntries = useMemo(
    () => getProjectLogEntries(projectId, projectName),
    [projectId, projectName],
  );
  const isLoadingRef = useRef(false);
  const loadTimerRef = useRef<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(initialPageSize);

  useEffect(() => {
    if (loadTimerRef.current !== undefined) {
      window.clearTimeout(loadTimerRef.current);
      loadTimerRef.current = undefined;
    }

    isLoadingRef.current = false;
    setIsLoading(false);
    setVisibleCount(initialPageSize);

    return () => {
      if (loadTimerRef.current !== undefined) {
        window.clearTimeout(loadTimerRef.current);
        loadTimerRef.current = undefined;
      }
    };
  }, [projectId, projectName]);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || visibleCount >= allEntries.length) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    loadTimerRef.current = window.setTimeout(() => {
      setVisibleCount((currentCount) => Math.min(currentCount + pageSize, allEntries.length));
      isLoadingRef.current = false;
      setIsLoading(false);
      loadTimerRef.current = undefined;
    }, mockPageDelay);
  }, [allEntries.length, visibleCount]);

  return {
    entries: allEntries.slice(0, visibleCount),
    hasMore: visibleCount < allEntries.length,
    isLoading,
    loadMore,
    totalCount: allEntries.length,
  } as const;
}
