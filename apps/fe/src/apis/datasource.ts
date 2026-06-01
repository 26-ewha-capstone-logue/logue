import instance from '@/lib/axios';
import { unwrapApiResponse, type ApiResponse } from './types';
import type {
  GetDataSourceListParams,
  GetDataSourceListResponse,
  GetFileResponse,
  UploadFileResponse,
} from '@/features/dataSource/types';

function serializeDataSourceIds(dataSourceIds: number[]) {
  return `id=${dataSourceIds.join(',')}`;
}

function getDeleteDataSourcesPath(dataSourceIds: number[]) {
  return `/api/datasources?${serializeDataSourceIds(dataSourceIds)}`;
}

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
