import type {
  DataSourceSummary,
  FilePreview,
  GetDataSourceListParams,
  GetDataSourceListResponse,
  GetFileResponse,
} from './datasource';

export const MOCK_MARKETING_CVR_DATA_SOURCE_ID = 900001;

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

export async function getMockDataSource(): Promise<GetFileResponse> {
  return {
    fileName: MOCK_MARKETING_CVR_FILE_NAME,
    fileSize: MOCK_MARKETING_CVR_FILE_SIZE_BYTES,
    uploadedAt: MOCK_MARKETING_CVR_UPLOADED_AT,
    preview: await getMockMarketingCvrPreview(),
  };
}
