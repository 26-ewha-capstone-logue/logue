import instance from '@/lib/axios';
import { unwrapApiResponse, type ApiResponse } from './types';

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

export type FilePreview = {
  headers: string[];
  rows: string[][];
};

export type GetFileResponse = {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  preview: FilePreview | null;
};

export type UploadFileResponse = {
  dataSourceId: number;
};

function serializeDataSourceIds(dataSourceIds: number[]) {
  return `id=${dataSourceIds.join(',')}`;
}

function getDeleteDataSourcesPath(dataSourceIds: number[]) {
  return `/api/datasources?${serializeDataSourceIds(dataSourceIds)}`;
}

export const dataSourceKeys = {
  all: ['dataSources'] as const,
  lists: () => [...dataSourceKeys.all, 'list'] as const,
  list: (params: GetDataSourceListParams) =>
    [...dataSourceKeys.lists(), params] as const,
  details: () => [...dataSourceKeys.all, 'detail'] as const,
  detail: (dataSourceId: number) =>
    [...dataSourceKeys.details(), dataSourceId] as const,
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

  const { data } = await instance.post<ApiResponse<UploadFileResponse>>(
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
  const { data } = await instance.get<ApiResponse<GetFileResponse>>(
    `/api/datasources/${dataSourceId}`,
  );

  return unwrapApiResponse(data);
}

export async function deleteDataSource(dataSourceId: number) {
  const { data } = await instance.delete<ApiResponse<unknown>>(
    `/api/datasources/${dataSourceId}`,
  );

  unwrapApiResponse(data);
}
