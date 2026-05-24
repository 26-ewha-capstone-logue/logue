import axios from 'axios';
import { ApiResponseError } from './types';

type ApiFailurePayload = {
  success?: unknown;
  code?: unknown;
  message?: unknown;
};

function hasApiMessage(value: unknown): value is ApiFailurePayload {
  return typeof value === 'object' && value !== null && 'message' in value;
}

function pickMessage(value: unknown) {
  if (!hasApiMessage(value)) return null;
  return typeof value.message === 'string' && value.message.trim().length > 0
    ? value.message
    : null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiResponseError) {
    return error.response.message || fallback;
  }

  if (axios.isAxiosError(error)) {
    return pickMessage(error.response?.data) ?? error.message ?? fallback;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
