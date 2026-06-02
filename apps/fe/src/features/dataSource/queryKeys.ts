import type { GetDataSourceListParams } from './types';

export const dataSourceKeys = {
  all: ['dataSources'] as const,
  lists: () => [...dataSourceKeys.all, 'list'] as const,
  list: (params: GetDataSourceListParams) =>
    [...dataSourceKeys.lists(), params] as const,
  details: () => [...dataSourceKeys.all, 'detail'] as const,
  detail: (dataSourceId: number) =>
    [...dataSourceKeys.details(), dataSourceId] as const,
};
