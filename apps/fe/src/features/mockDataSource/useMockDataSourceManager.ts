'use client';

import { useCallback, useMemo, useState } from 'react';
import type { DataSourceSummary } from '@/apis/datasource';
import {
  filterVisibleMockDataSources,
  getMockDataSourceIds,
  getMockDataSourceListResponse,
  getServerDataSourceIds,
  isMockDataSourceId,
  markMockDataSourcesDeleted,
  readDeletedMockDataSourceIds,
} from './mockDataSource';

const EMPTY_DELETED_IDS = new Set<number>();

export type MockDataSourceDeletionPlan = {
  mockDataSourceIds: number[];
  requiresUser: boolean;
  serverDataSourceIds: number[];
};

export function useMockDataSourceManager(userId: number | null | undefined) {
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
  const deletedDataSourceIds = useMemo(() => {
    const deletedIds = new Set(storageDeletedIds);
    sessionDeletedIds.forEach((dataSourceId) => {
      deletedIds.add(dataSourceId);
    });

    return deletedIds;
  }, [sessionDeletedIds, storageDeletedIds]);

  const getDeletionPlan = useCallback(
    (dataSourceIds: number[]): MockDataSourceDeletionPlan => {
      const mockDataSourceIds = getMockDataSourceIds(dataSourceIds);

      return {
        mockDataSourceIds,
        requiresUser: mockDataSourceIds.length > 0 && userId == null,
        serverDataSourceIds: getServerDataSourceIds(dataSourceIds),
      };
    },
    [userId],
  );

  const getVisibleDataSources = useCallback(
    <TDataSource extends Pick<DataSourceSummary, 'dataSourceId'>>(
      dataSources: TDataSource[],
    ) => filterVisibleMockDataSources(dataSources, deletedDataSourceIds),
    [deletedDataSourceIds],
  );

  const isDeletedDataSource = useCallback(
    (dataSourceId: number) =>
      isMockDataSourceId(dataSourceId) &&
      deletedDataSourceIds.has(dataSourceId),
    [deletedDataSourceIds],
  );

  const markDeletedDataSources = useCallback(
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

  return useMemo(
    () => ({
      deletedDataSourceIds,
      getDeletionPlan,
      getFallbackListResponse: getMockDataSourceListResponse,
      getVisibleDataSources,
      isDeletedDataSource,
      markDeletedDataSources,
    }),
    [
      deletedDataSourceIds,
      getDeletionPlan,
      getVisibleDataSources,
      isDeletedDataSource,
      markDeletedDataSources,
    ],
  );
}

export type MockDataSourceManager = ReturnType<typeof useMockDataSourceManager>;
