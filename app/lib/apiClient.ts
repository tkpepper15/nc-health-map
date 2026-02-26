/**
 * apiClient.ts — Typed, centralised API client for all frontend → Next.js API calls.
 *
 * All external services (Supabase, Gemini, NewsAPI) are accessed exclusively through
 * the Next.js API routes in app/api/.  Client components never call third-party
 * services directly and never receive secrets.
 */

import { HealthcareMetrics } from '../types/healthcare';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ApiMeta {
  source: 'database' | 'file';
  count: number;
  timestamp: string;
  fallback_reason?: string;
}

export interface HealthcareDataResponse {
  data: HealthcareMetrics[];
  metadata: ApiMeta;
}

export interface HospitalRecord {
  id: number | string;
  facility_name: string;
  alt_name?: string;
  licensee?: string;
  license_number?: string;
  facility_type?: string;
  service_type?: string;
  county?: string;
  city?: string;
  state?: string;
  zip?: string;
  address?: string | null;
  phone?: string | null;
  latitude: number;
  longitude: number;
  general_beds?: number;
  rehab_beds?: number;
  psych_beds?: number;
  substance_abuse_beds?: number;
  nursing_facility_beds?: number;
  total_beds?: number | null;
  total_surgery_rooms?: number | null;
  cardiac_surgery_rooms?: number;
  cesarean_rooms?: number;
  ambulatory_surgery_rooms?: number;
  shared_rooms?: number;
  endoscopy_rooms?: number;
  other_surgery_rooms?: number;
  is_major_hospital?: boolean;
  is_specialty?: boolean;
  is_emergency_dept?: boolean;
  has_emergency_dept?: boolean;
  is_ltac?: boolean;
  is_rehab?: boolean;
  hospital_type?: string;
  zip_code?: string;
}

export interface HospitalsDataResponse {
  data: HospitalRecord[];
  metadata: ApiMeta & {
    source_description?: string;
    type?: string;
    data_vintage?: string;
  };
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  published_at: string;
  description?: string;
  image_url?: string;
}

export interface ChatResponse {
  response: string;
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Healthcare data
// ---------------------------------------------------------------------------

export async function fetchHealthcareData(opts?: {
  counties?: string[];
  aggregated?: boolean;
}): Promise<HealthcareDataResponse> {
  const params = new URLSearchParams();
  if (opts?.counties?.length) params.set('counties', opts.counties.join(','));
  if (opts?.aggregated) params.set('aggregated', 'true');

  const url = `/api/healthcare-data${params.size ? `?${params}` : ''}`;
  const res = await fetch(url);
  return handleResponse<HealthcareDataResponse>(res);
}

// ---------------------------------------------------------------------------
// Hospital data
// ---------------------------------------------------------------------------

export async function fetchHospitalsData(opts?: {
  countyFips?: string;
  format?: 'json' | 'csv';
}): Promise<HospitalsDataResponse> {
  const params = new URLSearchParams();
  if (opts?.countyFips) params.set('county_fips', opts.countyFips);
  if (opts?.format) params.set('format', opts.format);

  const url = `/api/hospitals-data${params.size ? `?${params}` : ''}`;
  const res = await fetch(url);
  return handleResponse<HospitalsDataResponse>(res);
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export async function fetchNews(county?: string | null): Promise<NewsArticle[]> {
  const url = county
    ? `/api/news?county=${encodeURIComponent(county)}`
    : '/api/news';
  const res = await fetch(url, { cache: 'no-store' });
  return handleResponse<NewsArticle[]>(res);
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export async function sendChatMessage(
  message: string,
  county?: string | null,
): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, county: county ?? null }),
  });
  return handleResponse<ChatResponse>(res);
}
