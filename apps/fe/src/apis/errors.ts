import axios from 'axios';
import { ApiResponseError } from './types';

type ApiFailurePayload = {
  success?: unknown;
  code?: unknown;
  message?: unknown;
};

function hasApiCode(value: unknown): value is ApiFailurePayload {
  return typeof value === 'object' && value !== null && 'code' in value;
}

function hasApiMessage(value: unknown): value is ApiFailurePayload {
  return typeof value === 'object' && value !== null && 'message' in value;
}

function pickCode(value: unknown) {
  if (!hasApiCode(value)) return null;
  return typeof value.code === 'string' && value.code.trim().length > 0
    ? value.code
    : null;
}

function pickMessage(value: unknown) {
  if (!hasApiMessage(value)) return null;
  return typeof value.message === 'string' && value.message.trim().length > 0
    ? value.message
    : null;
}

export function getApiErrorCode(error: unknown) {
  if (error instanceof ApiResponseError) {
    return error.response.code || null;
  }

  if (axios.isAxiosError(error)) {
    return pickCode(error.response?.data);
  }

  return null;
}

export function getApiErrorStatus(error: unknown) {
  if (!axios.isAxiosError(error)) return null;

  return error.response?.status ?? null;
}

export function isApiConflictError(error: unknown) {
  return getApiErrorCode(error) === 'D007' || getApiErrorStatus(error) === 409;
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
