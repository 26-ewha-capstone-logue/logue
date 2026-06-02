export type DataSourceSort = 'LATEST' | 'MOST_USED';

export type DataSourceSummary = {
  dataSourceId: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
};

export type GetDataSourceListParams = {
  sort: DataSourceSort;
  page: number;
  size: number;
};

export type GetDataSourceListResponse = {
  sort: DataSourceSort;
  page: number;
  size: number;
  totalPages: number;
  dataSources: DataSourceSummary[];
};

export type FilePreview = {
  headers: string[];
  rows: string[][];
};

export type GetFileResponse = {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  preview: FilePreview | null;
};

export type UploadFileResponse = {
  dataSourceId: number;
};
