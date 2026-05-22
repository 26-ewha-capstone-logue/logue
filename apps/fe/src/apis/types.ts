export type ApiResponse<T> = {
  success: boolean;
  code?: string | null;
  message?: string | null;
  data: T;
};

export class ApiResponseError<T = unknown> extends Error {
  code?: string | null;
  response: ApiResponse<T>;

  constructor(response: ApiResponse<T>) {
    super(response.message || 'API request failed');
    this.name = 'ApiResponseError';
    this.code = response.code;
    this.response = response;
  }
}

export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiResponseError(response);
  }

  return response.data;
}
