import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as dataSourceApi from '@/apis/datasource';
import { MOCK_MARKETING_CVR_DATA_SOURCE_ID } from '@/features/mockDataSource';
import {
  deleteDataSources,
  getDataSource,
  uploadDataSource,
} from './dataSourceRepository';

vi.mock('@/apis/datasource', () => ({
  deleteDataSource: vi.fn(),
  deleteDataSources: vi.fn(),
  getDataSource: vi.fn(),
  getDataSources: vi.fn(),
  uploadDataSource: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('name,value\nemail,12', { status: 200 })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('dataSourceRepository', () => {
  it('serves mock data source details without calling the raw API', async () => {
    const detail = await getDataSource(MOCK_MARKETING_CVR_DATA_SOURCE_ID);

    expect(dataSourceApi.getDataSource).not.toHaveBeenCalled();
    expect(detail.fileName).toBe('marketing-cvr-mock-data.csv');
    expect(detail.preview).toEqual({
      headers: ['name', 'value'],
      rows: [['email', '12']],
    });
  });

  it('passes only server data source ids to the raw multi-delete API', async () => {
    vi.mocked(dataSourceApi.deleteDataSources).mockResolvedValue(undefined);

    await deleteDataSources([1, MOCK_MARKETING_CVR_DATA_SOURCE_ID, 2]);

    expect(dataSourceApi.deleteDataSources).toHaveBeenCalledWith([1, 2]);
  });

  it('delegates uploads through the raw upload API', async () => {
    const file = new File(['a,b'], 'sample.csv', { type: 'text/csv' });
    vi.mocked(dataSourceApi.uploadDataSource).mockResolvedValue({
      dataSourceId: 42,
    });

    await expect(uploadDataSource(file)).resolves.toEqual({
      dataSourceId: 42,
    });
    expect(dataSourceApi.uploadDataSource).toHaveBeenCalledWith(file);
  });
});
