import {
  deleteDataSource as deleteDataSourceRequest,
  deleteDataSources as deleteDataSourcesRequest,
  getDataSource as getDataSourceRequest,
  getDataSources as getDataSourcesRequest,
  type GetDataSourceListParams,
  type GetFileResponse,
} from './datasource';
import {
  getServerDataSourceIds,
  getMockDataSource,
  getMockDataSourceListResponse,
  isMockDataSourceId,
  withMockDataSource,
} from './mockDataSource';

type DataSourceDetailReader = (
  dataSourceId: number,
) => Promise<GetFileResponse>;
type DataSourcesDeleteRequest = (dataSourceIds: number[]) => Promise<void>;
type DataSourceDeleteRequest = (dataSourceId: number) => Promise<void>;

async function getMockAwareDataSource(
  dataSourceId: number,
  readDataSource: DataSourceDetailReader,
) {
  return isMockDataSourceId(dataSourceId)
    ? getMockDataSource()
    : readDataSource(dataSourceId);
}

async function deleteMockAwareDataSources(
  dataSourceIds: number[],
  deleteDataSources: DataSourcesDeleteRequest,
) {
  const serverDataSourceIds = getServerDataSourceIds(dataSourceIds);

  if (serverDataSourceIds.length === 0) return;

  return deleteDataSources(serverDataSourceIds);
}

async function deleteMockAwareDataSource(
  dataSourceId: number,
  deleteDataSource: DataSourceDeleteRequest,
) {
  if (isMockDataSourceId(dataSourceId)) return;

  return deleteDataSource(dataSourceId);
}

export async function getDataSources(params: GetDataSourceListParams) {
  try {
    const response = await getDataSourcesRequest(params);
    return withMockDataSource(response, params);
  } catch {
    return getMockDataSourceListResponse(params);
  }
}

export async function getDataSource(dataSourceId: number) {
  return getMockAwareDataSource(dataSourceId, getDataSourceRequest);
}

export async function deleteDataSources(dataSourceIds: number[]) {
  return deleteMockAwareDataSources(dataSourceIds, deleteDataSourcesRequest);
}

export async function deleteDataSource(dataSourceId: number) {
  return deleteMockAwareDataSource(dataSourceId, deleteDataSourceRequest);
}
