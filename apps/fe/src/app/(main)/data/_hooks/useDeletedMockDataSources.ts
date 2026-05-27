'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  markMockDataSourcesDeleted,
  readDeletedMockDataSourceIds,
} from '@/apis/mockDataSource';

const EMPTY_DELETED_IDS = new Set<number>();

export function useDeletedMockDataSources(userId: number | null | undefined) {
  const [sessionDeletedIdsByUser, setSessionDeletedIdsByUser] = useState(
    () => new Map<number, Set<number>>(),
  );

  const storageDeletedIds = useMemo(
    () => (userId ? readDeletedMockDataSourceIds(userId) : EMPTY_DELETED_IDS),
    [userId],
  );
  const sessionDeletedIds = useMemo(
    () =>
      userId
        ? (sessionDeletedIdsByUser.get(userId) ?? EMPTY_DELETED_IDS)
        : EMPTY_DELETED_IDS,
    [sessionDeletedIdsByUser, userId],
  );
  const deletedMockDataSourceIds = useMemo(() => {
    const deletedIds = new Set(storageDeletedIds);
    sessionDeletedIds.forEach((dataSourceId) => {
      deletedIds.add(dataSourceId);
    });

    return deletedIds;
  }, [sessionDeletedIds, storageDeletedIds]);

  const markDeletedMockDataSources = useCallback(
    (dataSourceIds: number[]) => {
      if (!userId) return [];

      const deletedIds = markMockDataSourcesDeleted(userId, dataSourceIds);
      if (deletedIds.length === 0) return deletedIds;

      setSessionDeletedIdsByUser((prev) => {
        const next = new Map(prev);
        const nextDeletedIds = new Set(next.get(userId));

        deletedIds.forEach((dataSourceId) => {
          nextDeletedIds.add(dataSourceId);
        });
        next.set(userId, nextDeletedIds);

        return next;
      });

      return deletedIds;
    },
    [userId],
  );

  return {
    deletedMockDataSourceIds,
    markDeletedMockDataSources,
  };
}
