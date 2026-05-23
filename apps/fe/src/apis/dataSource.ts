import instance from '@/lib/axios';
import { unwrapApiResponse, type ApiResponse } from './types';

export type FilePreview = {
  headers: string[];
  rows: string[][];
};

export type UploadDataSourceResponse = {
  dataSourceId: number;
};

export type DataSourceSort = 'LATEST' | 'MOST_USED';

export type DataSourceSummary = {
  dataSourceId: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
};

export type GetDataSourceListParams = {
  sort: DataSourceSort;
  page: number;
  size: number;
};

export type GetDataSourceListResponse = {
  sort: DataSourceSort;
  page: number;
  size: number;
  totalPages: number;
  dataSources: DataSourceSummary[];
};

export type GetDataSourceResponse = {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  preview?: FilePreview | null;
};

function serializeDataSourceIds(dataSourceIds: number[]) {
  return `id=${dataSourceIds.join(',')}`;
}

function getDeleteDataSourcesPath(dataSourceIds: number[]) {
  return `/api/datasources?${serializeDataSourceIds(dataSourceIds)}`;
}

export const dataSourceQueryKeys = {
  all: ['dataSources'] as const,
  lists: () => [...dataSourceQueryKeys.all, 'list'] as const,
  list: (params: GetDataSourceListParams) =>
    [...dataSourceQueryKeys.lists(), params] as const,
  detail: (dataSourceId: number) =>
    [...dataSourceQueryKeys.all, 'detail', dataSourceId] as const,
};

export async function getDataSources(params: GetDataSourceListParams) {
  const { data } = await instance.get<ApiResponse<GetDataSourceListResponse>>(
    '/api/datasources',
    { params },
  );

  return unwrapApiResponse(data);
}

export async function uploadDataSource(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await instance.post<ApiResponse<UploadDataSourceResponse>>(
    '/api/datasources',
    formData,
  );

  return unwrapApiResponse(data);
}

export async function deleteDataSources(dataSourceIds: number[]) {
  if (dataSourceIds.length === 0) return;

  const { data } = await instance.delete<ApiResponse<unknown>>(
    getDeleteDataSourcesPath(dataSourceIds),
  );

  unwrapApiResponse(data);
}

export async function getDataSource(dataSourceId: number) {
  const { data } = await instance.get<ApiResponse<GetDataSourceResponse>>(
    `/api/datasources/${dataSourceId}`,
  );

  return unwrapApiResponse(data);
}
