/**
 * Hospital Data Service
 * Centralized service for all hospital-related data operations
 */

import { supabaseClient } from '../supabase/client';
import { ServiceResponse } from './types';

export interface HospitalData {
  id: string;
  facility_name: string;
  alt_name: string | null;
  county: string;
  city: string;
  facility_type: string;
  total_beds: number | null;
  general_beds: number | null;
  total_surgery_rooms: number | null;
  is_major_hospital: boolean;
  is_emergency_dept: boolean;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  licensee: string | null;
  created_at: string;
  updated_at: string;
}

export interface HospitalFilters {
  county?: string;
  city?: string;
  facilityType?: string;
  hasEmergencyDept?: boolean;
  isMajorHospital?: boolean;
  minBeds?: number;
  maxBeds?: number;
}

export interface HospitalOptions {
  orderBy?: 'facility_name' | 'total_beds' | 'county';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
}

class HospitalService {
  /**
   * Fetch hospital data with optional filters
   */
  async getHospitalData(
    filters: HospitalFilters = {},
    options: HospitalOptions = {}
  ): Promise<ServiceResponse<HospitalData[]>> {
    try {
      let query = supabaseClient
        .from('hospitals')
        .select('*');

      // Apply filters
      if (filters.county) {
        query = query.ilike('county', `%${filters.county}%`);
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.facilityType) {
        query = query.eq('facility_type', filters.facilityType);
      }
      if (filters.hasEmergencyDept !== undefined) {
        query = query.eq('is_emergency_dept', filters.hasEmergencyDept);
      }
      if (filters.isMajorHospital !== undefined) {
        query = query.eq('is_major_hospital', filters.isMajorHospital);
      }
      if (filters.minBeds !== undefined) {
        query = query.gte('total_beds', filters.minBeds);
      }
      if (filters.maxBeds !== undefined) {
        query = query.lte('total_beds', filters.maxBeds);
      }

      // Apply options
      if (options.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection !== 'desc'
        });
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Failed to fetch hospital data: ${error.message}`,
          data: null,
        };
      }

      return {
        success: true,
        data: data || [],
        metadata: {
          count: data?.length || 0,
          source: 'supabase',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null,
      };
    }
  }

  /**
   * Get hospitals by county
   */
  async getHospitalsByCounty(county: string): Promise<ServiceResponse<HospitalData[]>> {
    return this.getHospitalData({ county });
  }

  /**
   * Get hospital by ID
   */
  async getHospitalById(id: string): Promise<ServiceResponse<HospitalData>> {
    try {
      const { data, error } = await supabaseClient
        .from('hospitals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to fetch hospital: ${error.message}`,
          data: null,
        };
      }

      return {
        success: true,
        data,
        metadata: {
          source: 'supabase',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null,
      };
    }
  }

  /**
   * Get hospitals within a geographic bounding box
   */
  async getHospitalsInBounds(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }
  ): Promise<ServiceResponse<HospitalData[]>> {
    try {
      const { data, error } = await supabaseClient
        .from('hospitals')
        .select('*')
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east);

      if (error) {
        return {
          success: false,
          error: `Failed to fetch hospitals in bounds: ${error.message}`,
          data: null,
        };
      }

      return {
        success: true,
        data: data || [],
        metadata: {
          count: data?.length || 0,
          source: 'supabase',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null,
      };
    }
  }

  /**
   * Get hospital summary statistics
   */
  async getHospitalSummary(): Promise<ServiceResponse<{
    totalHospitals: number;
    majorHospitals: number;
    emergencyDeptCount: number;
    averageBeds: number;
    countiesCovered: number;
  }>> {
    try {
      const { data, error } = await supabaseClient
        .from('hospitals')
        .select('total_beds, is_major_hospital, is_emergency_dept, county');

      if (error) {
        return {
          success: false,
          error: `Failed to fetch hospital summary: ${error.message}`,
          data: null,
        };
      }

      const uniqueCounties = new Set(data?.map(h => h.county) || []);
      const totalBeds = data?.filter(h => h.total_beds !== null)
        .reduce((sum, h) => sum + (h.total_beds || 0), 0) || 0;
      const hospitalsWithBeds = data?.filter(h => h.total_beds !== null).length || 1;

      const summary = {
        totalHospitals: data?.length || 0,
        majorHospitals: data?.filter(h => h.is_major_hospital).length || 0,
        emergencyDeptCount: data?.filter(h => h.is_emergency_dept).length || 0,
        averageBeds: Math.round(totalBeds / hospitalsWithBeds),
        countiesCovered: uniqueCounties.size,
      };

      return {
        success: true,
        data: summary,
        metadata: {
          source: 'supabase',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null,
      };
    }
  }
}

export const hospitalService = new HospitalService();