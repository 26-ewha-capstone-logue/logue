'use client';

import { useCallback, useMemo, useState } from 'react';
import type { DataSourceSummary } from '@/features/dataSource';

export function useDataSourceSelection(
  dataSources: readonly DataSourceSummary[],
) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const visibleDataSourceIds = useMemo(
    () => new Set(dataSources.map((dataSource) => dataSource.dataSourceId)),
    [dataSources],
  );
  const selectedVisibleIds = useMemo(
    () =>
      new Set(
        Array.from(selectedIds).filter((dataSourceId) =>
          visibleDataSourceIds.has(dataSourceId),
        ),
      ),
    [selectedIds, visibleDataSourceIds],
  );
  const allSelected =
    dataSources.length > 0 &&
    dataSources.every((dataSource) =>
      selectedVisibleIds.has(dataSource.dataSourceId),
    );
  const partiallySelected = !allSelected && selectedVisibleIds.size > 0;
  const hasSelection = selectedVisibleIds.size > 0;

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      setSelectedIds(
        new Set(dataSources.map((dataSource) => dataSource.dataSourceId)),
      );
    }
  }, [allSelected, clearSelection, dataSources]);

  const toggleOne = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return {
    allSelected,
    clearSelection,
    hasSelection,
    partiallySelected,
    selectedVisibleIds,
    toggleAll,
    toggleOne,
  };
}
