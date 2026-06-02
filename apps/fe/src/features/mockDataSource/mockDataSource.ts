import type {
  DataSourceSummary,
  FilePreview,
  GetDataSourceListParams,
  GetDataSourceListResponse,
  GetFileResponse,
} from '@/features/dataSource/types';

export const MOCK_MARKETING_CVR_DATA_SOURCE_ID = 900001;

const DELETED_MOCK_DATA_SOURCE_STORAGE_PREFIX =
  'logue:deleted-mock-datasources:';
const MOCK_MARKETING_CVR_FILE_NAME = 'marketing-cvr-mock-data.csv';
const MOCK_MARKETING_CVR_FILE_PATH = '/mock-data/marketing-cvr-mock-data.csv';
const MOCK_MARKETING_CVR_FILE_SIZE_BYTES = 70064;
const MOCK_MARKETING_CVR_UPLOADED_AT = '2026-05-25T00:00:00+09:00';

const MOCK_MARKETING_CVR_SUMMARY: DataSourceSummary = {
  dataSourceId: MOCK_MARKETING_CVR_DATA_SOURCE_ID,
  fileName: MOCK_MARKETING_CVR_FILE_NAME,
  fileSize: MOCK_MARKETING_CVR_FILE_SIZE_BYTES,
  uploadedAt: MOCK_MARKETING_CVR_UPLOADED_AT,
};

let mockMarketingCvrPreviewPromise: Promise<FilePreview> | null = null;

function getOptionalLocalStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseCsvLine(line: string) {
  return line.split(',').map((value) => value.trim());
}

function parseCsvPreview(csv: string): FilePreview {
  const trimmedCsv = csv.trim();

  if (!trimmedCsv) {
    return { headers: [], rows: [] };
  }

  const [headerLine, ...rowLines] = trimmedCsv.split(/\r?\n/);

  return {
    headers: parseCsvLine(headerLine),
    rows: rowLines.map(parseCsvLine),
  };
}

async function fetchMockMarketingCvrCsv() {
  const response = await fetch(MOCK_MARKETING_CVR_FILE_PATH);

  if (!response.ok) {
    throw new Error('Failed to load marketing CVR mock data.');
  }

  return response.text();
}

async function getMockMarketingCvrPreview() {
  if (!mockMarketingCvrPreviewPromise) {
    mockMarketingCvrPreviewPromise = fetchMockMarketingCvrCsv()
      .then(parseCsvPreview)
      .catch((error) => {
        mockMarketingCvrPreviewPromise = null;
        throw error;
      });
  }

  return mockMarketingCvrPreviewPromise;
}

export function isMockDataSourceId(dataSourceId: number) {
  return dataSourceId === MOCK_MARKETING_CVR_DATA_SOURCE_ID;
}

export function getMockDataSourceIds(dataSourceIds: number[]) {
  return dataSourceIds.filter(isMockDataSourceId);
}

export function getServerDataSourceIds(dataSourceIds: number[]) {
  return dataSourceIds.filter(
    (dataSourceId) => !isMockDataSourceId(dataSourceId),
  );
}

export function getDeletedMockDataSourceStorageKey(userId: number) {
  return `${DELETED_MOCK_DATA_SOURCE_STORAGE_PREFIX}${userId}`;
}

export function readDeletedMockDataSourceIds(userId: number) {
  const storage = getOptionalLocalStorage();
  if (!storage) return new Set<number>();

  try {
    const rawValue = storage.getItem(
      getDeletedMockDataSourceStorageKey(userId),
    );
    if (!rawValue) return new Set<number>();

    const parsedValue: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return new Set<number>();

    return new Set(
      parsedValue.filter(
        (value): value is number =>
          Number.isSafeInteger(value) && isMockDataSourceId(value),
      ),
    );
  } catch {
    return new Set<number>();
  }
}

export function markMockDataSourcesDeleted(
  userId: number,
  dataSourceIds: number[],
) {
  const mockDataSourceIds = Array.from(
    new Set(getMockDataSourceIds(dataSourceIds)),
  );

  if (mockDataSourceIds.length === 0) return [];

  const deletedIds = readDeletedMockDataSourceIds(userId);
  mockDataSourceIds.forEach((dataSourceId) => deletedIds.add(dataSourceId));

  const storage = getOptionalLocalStorage();
  if (storage) {
    try {
      storage.setItem(
        getDeletedMockDataSourceStorageKey(userId),
        JSON.stringify(Array.from(deletedIds)),
      );
    } catch {
      // Keep the in-memory UI state even when localStorage is unavailable.
    }
  }

  return mockDataSourceIds;
}

export function filterVisibleMockDataSources<
  TDataSource extends Pick<DataSourceSummary, 'dataSourceId'>,
>(dataSources: TDataSource[], deletedMockDataSourceIds: ReadonlySet<number>) {
  return dataSources.filter(
    (dataSource) =>
      !(
        isMockDataSourceId(dataSource.dataSourceId) &&
        deletedMockDataSourceIds.has(dataSource.dataSourceId)
      ),
  );
}

export function withMockDataSource(
  response: GetDataSourceListResponse,
  params: GetDataSourceListParams,
): GetDataSourceListResponse {
  if (
    params.page !== 0 ||
    response.dataSources.some((dataSource) =>
      isMockDataSourceId(dataSource.dataSourceId),
    )
  ) {
    return response;
  }

  return {
    ...response,
    totalPages: Math.max(response.totalPages, 1),
    dataSources: [MOCK_MARKETING_CVR_SUMMARY, ...response.dataSources],
  };
}

export function getMockDataSourceListResponse(
  params: GetDataSourceListParams,
): GetDataSourceListResponse {
  return {
    sort: params.sort,
    page: params.page,
    size: params.size,
    totalPages: 1,
    dataSources: params.page === 0 ? [MOCK_MARKETING_CVR_SUMMARY] : [],
  };
}

export async function getMockDataSource(): Promise<GetFileResponse> {
  return {
    fileName: MOCK_MARKETING_CVR_FILE_NAME,
    fileSize: MOCK_MARKETING_CVR_FILE_SIZE_BYTES,
    uploadedAt: MOCK_MARKETING_CVR_UPLOADED_AT,
    preview: await getMockMarketingCvrPreview(),
  };
}
