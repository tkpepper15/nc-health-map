/**
 * Centralized Type Definitions
 * Re-exports all type definitions for easy importing
 */

export * from '../../types/healthcare';
export * from '../services/types';
export * from '../components/map/types';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    count?: number;
    source?: string;
    timestamp?: string;
    page?: number;
    totalPages?: number;
    filters?: Record<string, any>;
    server_info?: {
      environment?: string;
      timestamp?: string;
    };
  };
}

// Environment Types
export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  baseUrl: string;
  version: string;
}

export interface FeatureFlags {
  enableHospitalLayer: boolean;
  enableSVI: boolean;
  enableAnalytics: boolean;
}

// Data Processing Types
export interface DataProcessingStatus {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  startTime?: string;
  endTime?: string;
  recordsProcessed?: number;
  errors?: string[];
}

// GeoJSON Types (extended from standard GeoJSON)
export interface CountyGeoJSONProperties {
  NAME?: string;
  name?: string;
  CountyName?: string;
  FIPS?: string;
  fips?: string;
  population?: number;
  area?: number;
  classification?: 'urban' | 'rural' | 'frontier';
}

export interface CountyGeoJSONFeature extends GeoJSON.Feature {
  properties: CountyGeoJSONProperties;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event Types
export interface CountySelectEvent {
  county: County;
  source: 'click' | 'hover' | 'search';
}

export interface LayerChangeEvent {
  layerId: string;
  layerName: string;
  previousLayer?: string;
}

export interface DataUpdateEvent {
  dataType: 'healthcare' | 'hospital' | 'county';
  recordCount: number;
  timestamp: string;
  source: 'api' | 'file' | 'cache';
}