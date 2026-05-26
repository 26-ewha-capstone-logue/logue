import {
  deleteDataSource as deleteDataSourceRequest,
  deleteDataSources as deleteDataSourcesRequest,
  getDataSource as getDataSourceRequest,
  getDataSources as getDataSourcesRequest,
  type GetDataSourceListParams,
} from './datasource';
import {
  getMockDataSource,
  getMockDataSourceListResponse,
  isMockDataSourceId,
  withMockDataSource,
} from './mockDataSource';

export async function getDataSources(params: GetDataSourceListParams) {
  try {
    const response = await getDataSourcesRequest(params);
    return withMockDataSource(response, params);
  } catch {
    return getMockDataSourceListResponse(params);
  }
}

export async function getDataSource(dataSourceId: number) {
  if (isMockDataSourceId(dataSourceId)) {
    return getMockDataSource();
  }

  return getDataSourceRequest(dataSourceId);
}

export async function deleteDataSources(dataSourceIds: number[]) {
  const serverDataSourceIds = dataSourceIds.filter(
    (dataSourceId) => !isMockDataSourceId(dataSourceId),
  );

  if (serverDataSourceIds.length === 0) return;

  return deleteDataSourcesRequest(serverDataSourceIds);
}

export async function deleteDataSource(dataSourceId: number) {
  if (isMockDataSourceId(dataSourceId)) return;

  return deleteDataSourceRequest(dataSourceId);
}
