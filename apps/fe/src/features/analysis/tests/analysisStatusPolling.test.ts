import { describe, expect, it } from 'vitest';
import { hasAnalysisPollingTimedOut } from '../hooks/useAnalysisStatusPolling';

describe('hasAnalysisPollingTimedOut', () => {
  it('keeps polling before the timeout threshold', () => {
    expect(
      hasAnalysisPollingTimedOut({
        now: 1_999,
        startedAt: 1_000,
        timeoutMs: 1_000,
      }),
    ).toBe(false);
  });

  it('stops polling when the timeout threshold is reached', () => {
    expect(
      hasAnalysisPollingTimedOut({
        now: 2_000,
        startedAt: 1_000,
        timeoutMs: 1_000,
      }),
    ).toBe(true);
  });

  it('does not time out when no timeout policy is provided', () => {
    expect(
      hasAnalysisPollingTimedOut({
        now: 10_000,
        startedAt: 1_000,
      }),
    ).toBe(false);
  });
});
