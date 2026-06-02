'use client';

import { useQuery } from '@tanstack/react-query';
import { dataSourceKeys, getDataSource } from '@/features/dataSource';

type UseDataSourceDetailOptions = {
  enabled?: boolean;
};

export function useDataSourceDetail(
  dataSourceId: number | null,
  { enabled = true }: UseDataSourceDetailOptions = {},
) {
  return useQuery({
    queryKey: dataSourceKeys.detail(dataSourceId ?? 0),
    queryFn: () => {
      if (dataSourceId === null) {
        throw new Error('Data source id is required.');
      }

      return getDataSource(dataSourceId);
    },
    enabled: enabled && dataSourceId !== null,
  });
}
