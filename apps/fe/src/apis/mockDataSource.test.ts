import { afterEach, describe, expect, it } from 'vitest';
import {
  MOCK_MARKETING_CVR_DATA_SOURCE_ID,
  filterVisibleMockDataSources,
  getDeletedMockDataSourceStorageKey,
  markMockDataSourcesDeleted,
  readDeletedMockDataSourceIds,
} from './mockDataSource';

function createStorage() {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } satisfies Storage;
}

function installWindowStorage() {
  const localStorage = createStorage();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage,
    },
  });

  return { localStorage };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
});

describe('mock data source deletion storage', () => {
  it('stores deleted mock data sources per user', () => {
    const { localStorage } = installWindowStorage();

    expect(
      markMockDataSourcesDeleted(1, [MOCK_MARKETING_CVR_DATA_SOURCE_ID]),
    ).toEqual([MOCK_MARKETING_CVR_DATA_SOURCE_ID]);

    expect(
      readDeletedMockDataSourceIds(1).has(MOCK_MARKETING_CVR_DATA_SOURCE_ID),
    ).toBe(true);
    expect(
      readDeletedMockDataSourceIds(2).has(MOCK_MARKETING_CVR_DATA_SOURCE_ID),
    ).toBe(false);
    expect(
      localStorage.getItem(getDeletedMockDataSourceStorageKey(1)),
    ).toContain(String(MOCK_MARKETING_CVR_DATA_SOURCE_ID));
    expect(
      localStorage.getItem(getDeletedMockDataSourceStorageKey(2)),
    ).toBeNull();
  });

  it('ignores non-mock ids and filters hidden mock rows', () => {
    installWindowStorage();

    expect(
      markMockDataSourcesDeleted(1, [42, MOCK_MARKETING_CVR_DATA_SOURCE_ID]),
    ).toEqual([MOCK_MARKETING_CVR_DATA_SOURCE_ID]);

    const visibleDataSources = filterVisibleMockDataSources(
      [
        { dataSourceId: MOCK_MARKETING_CVR_DATA_SOURCE_ID, fileName: 'mock' },
        { dataSourceId: 42, fileName: 'server' },
      ],
      readDeletedMockDataSourceIds(1),
    );

    expect(visibleDataSources).toEqual([
      { dataSourceId: 42, fileName: 'server' },
    ]);
  });

  it('handles malformed localStorage data safely', () => {
    const { localStorage } = installWindowStorage();

    localStorage.setItem(getDeletedMockDataSourceStorageKey(1), '{');

    expect(readDeletedMockDataSourceIds(1).size).toBe(0);
  });

  it('does not throw when localStorage is unavailable', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: Object.defineProperty({}, 'localStorage', {
        get() {
          throw new Error('blocked');
        },
      }),
    });

    expect(readDeletedMockDataSourceIds(1).size).toBe(0);
    expect(() =>
      markMockDataSourcesDeleted(1, [MOCK_MARKETING_CVR_DATA_SOURCE_ID]),
    ).not.toThrow();
  });
});
