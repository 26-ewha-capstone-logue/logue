import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import instance from '../lib/axios';
import { cancelCriteria, cancelResult, cancelSummary } from './analysis';

const originalAdapter = instance.defaults.adapter;

function createSuccessResponse(
  config: InternalAxiosRequestConfig,
): AxiosResponse {
  return {
    config,
    data: {
      success: true,
      data: { status: 'CANCELED' },
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

describe('analysis cancel APIs', () => {
  it('calls the Swagger summary cancel endpoint', async () => {
    const requests = installRequestRecorder();

    await expect(
      cancelSummary({ conversationId: 1, analysisFlowId: 2 }),
    ).resolves.toEqual({ status: 'CANCELED' });

    expect(requests[0]).toMatchObject({
      method: 'post',
      url: '/api/anal/conversations/1/analysisFlows/2/summary/cancel',
    });
  });

  it('calls the Swagger criteria cancel endpoint', async () => {
    const requests = installRequestRecorder();

    await expect(
      cancelCriteria({
        conversationId: 1,
        analysisFlowId: 2,
        messageId: 3,
      }),
    ).resolves.toEqual({ status: 'CANCELED' });

    expect(requests[0]).toMatchObject({
      method: 'post',
      url: '/api/anal/conversations/1/analysisFlows/2/messages/3/analysisCriterias/cancel',
    });
  });

  it('calls the Swagger result cancel endpoint', async () => {
    const requests = installRequestRecorder();

    await expect(
      cancelResult({
        conversationId: 1,
        analysisFlowId: 2,
        messageId: 3,
        analysisCriteriaId: 4,
      }),
    ).resolves.toEqual({ status: 'CANCELED' });

    expect(requests[0]).toMatchObject({
      method: 'post',
      url: '/api/anal/conversations/1/analysisFlows/2/messages/3/analysisCriterias/4/results/cancel',
    });
  });
});
