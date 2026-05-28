'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  isMockDataSourceId,
  markMockDataSourcesDeleted,
  readDeletedMockDataSourceIds,
} from '@/apis/mockDataSource';

const EMPTY_DELETED_IDS = new Set<number>();

export function useDeletedMockDataSources(userId: number | null | undefined) {
  const [sessionDeletedIdsByUser, setSessionDeletedIdsByUser] = useState(
    () => new Map<number, Set<number>>(),
  );

  const storageDeletedIds = useMemo(
    () =>
      userId != null ? readDeletedMockDataSourceIds(userId) : EMPTY_DELETED_IDS,
    [userId],
  );
  const sessionDeletedIds = useMemo(
    () =>
      userId != null
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
      if (userId == null) return [];

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
  const isDeletedMockDataSource = useCallback(
    (dataSourceId: number) =>
      isMockDataSourceId(dataSourceId) &&
      deletedMockDataSourceIds.has(dataSourceId),
    [deletedMockDataSourceIds],
  );

  return {
    deletedMockDataSourceIds,
    isDeletedMockDataSource,
    markDeletedMockDataSources,
  };
}
