/**
 * API Types and Interfaces
 * Comprehensive type definitions for all API interactions
 */

// Base API Response
export interface BaseApiResponse {
  success: boolean;
  timestamp: string;
}

export interface ApiSuccessResponse<T> extends BaseApiResponse {
  success: true;
  data: T;
  metadata?: {
    count?: number;
    source?: string;
    page?: number;
    totalPages?: number;
    filters?: Record<string, any>;
  };
}

export interface ApiErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Healthcare Data API Types
export interface HealthcareDataRequest {
  format?: 'json' | 'csv';
  county?: string;
  fips?: string;
  rural?: boolean;
  vulnerability?: 'low' | 'moderate' | 'high' | 'extreme';
  limit?: number;
  aggregated?: boolean;
}

export interface HealthcareDataResponse {
  data: HealthcareMetrics[];
  metadata: {
    source: string;
    count: number;
    timestamp: string;
    aggregated: boolean;
    filters: Partial<HealthcareDataRequest>;
    server_info: {
      environment: string;
      timestamp: string;
    };
  };
}

// Hospital Data API Types
export interface HospitalDataRequest {
  format?: 'json' | 'csv';
  county?: string;
  city?: string;
  type?: string;
  emergency?: boolean;
  major?: boolean;
  min_beds?: number;
  max_beds?: number;
  limit?: number;
  bounds?: string; // 'north,south,east,west'
}

export interface HospitalDataResponse {
  data: HospitalData[];
  metadata: {
    source: string;
    count: number;
    timestamp: string;
    filters: Partial<HospitalDataRequest>;
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
}

// Data Processing API Types
export interface DataProcessingRequest {
  force?: boolean;
  source?: 'csv' | 'database' | 'all';
  validate?: boolean;
}

export interface DataProcessingResponse {
  status: 'started' | 'completed' | 'error';
  jobId?: string;
  message: string;
  progress?: number;
  results?: {
    recordsProcessed: number;
    recordsUpdated: number;
    recordsCreated: number;
    errors: string[];
  };
}

// Status API Types
export interface StatusRequest {
  jobId?: string;
}

export interface StatusResponse {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  startTime?: string;
  endTime?: string;
  results?: {
    recordsProcessed: number;
    errors: string[];
  };
}

// Summary API Types
export interface SummaryResponse {
  healthcare: {
    totalCounties: number;
    averageMedicaidRate: number;
    ruralCounties: number;
    urbanCounties: number;
    highVulnerabilityCounties: number;
  };
  hospitals: {
    totalHospitals: number;
    majorHospitals: number;
    emergencyDeptCount: number;
    averageBeds: number;
    countiesCovered: number;
  };
  lastUpdated: string;
}

// Error Types
export interface ApiValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
  validationErrors?: ApiValidationError[];
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// Request Headers
export interface ApiHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'Cache-Control'?: string;
  'Accept'?: string;
  'User-Agent'?: string;
}

// Cache Control Types
export type CacheControl = 
  | 'no-cache'
  | 'no-store'
  | 'must-revalidate'
  | 'public'
  | 'private'
  | `max-age=${number}`
  | `s-maxage=${number}`;

// Import required types
import { HealthcareMetrics } from '../../types/healthcare';
import { HospitalData } from '../services/hospital.service';