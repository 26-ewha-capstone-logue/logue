export type ApiSuccessResponse<T> = {
  success: true;
  code?: string | null;
  message?: string | null;
  data: T;
};

export type ApiFailureResponse<T = unknown> = {
  success: false;
  code?: string | null;
  message?: string | null;
  data?: T | null;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse<T>;

export class ApiResponseError<T = unknown> extends Error {
  code?: string | null;
  response: ApiFailureResponse<T>;

  constructor(response: ApiFailureResponse<T>) {
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
