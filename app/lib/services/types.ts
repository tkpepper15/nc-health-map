/**
 * Common service types and interfaces
 */

export interface ServiceResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    count?: number;
    source?: string;
    timestamp?: string;
    page?: number;
    totalPages?: number;
  };
}

export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface SortOptions {
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: unknown;
}