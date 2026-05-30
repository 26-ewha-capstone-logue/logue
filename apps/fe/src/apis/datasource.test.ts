import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import instance from '../lib/axios';
import { deleteDataSource, deleteDataSources } from './datasource';

const originalAdapter = instance.defaults.adapter;

function createSuccessResponse(
  config: InternalAxiosRequestConfig,
): AxiosResponse {
  return {
    config,
    data: {
      success: true,
      data: {},
    },
    headers: {},
    status: 200,
    statusText: 'OK',
  };
}

function installRequestRecorder() {
  const requests: InternalAxiosRequestConfig[] = [];

  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);

    return createSuccessResponse(config);
  };

  instance.defaults.adapter = adapter;

  return requests;
}

afterEach(() => {
  instance.defaults.adapter = originalAdapter;
});

describe('data source delete APIs', () => {
  it('calls the Swagger multi-delete endpoint with comma-separated ids', async () => {
    const requests = installRequestRecorder();

    await expect(deleteDataSources([1, 2, 3])).resolves.toBeUndefined();

    expect(requests[0]).toMatchObject({
      method: 'delete',
      url: '/api/datasources?id=1,2,3',
    });
  });

  it('calls the Swagger single-delete endpoint', async () => {
    const requests = installRequestRecorder();

    await expect(deleteDataSource(1)).resolves.toBeUndefined();

    expect(requests[0]).toMatchObject({
      method: 'delete',
      url: '/api/datasources/1',
    });
  });
});
