import { ApiResponse, PaginatedResult } from '../types/api.types.js';

export function ok<T>(data: T, message?: string, meta?: Record<string, unknown>): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string
): ApiResponse<PaginatedResult<T>> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    success: true,
    message,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages,
    },
  };
}

export function fail(message: string, meta?: Record<string, unknown>): ApiResponse<null> {
  return {
    success: false,
    message,
    data: null,
    ...(meta ? { meta } : {}),
  };
}

