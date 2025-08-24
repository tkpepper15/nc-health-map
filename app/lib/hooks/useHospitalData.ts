'use client';

/**
 * Hospital Data Hook
 * Hook for hospital data management using service layer
 */

import { useState, useEffect, useCallback } from 'react';
import { hospitalService, HospitalData, HospitalFilters } from '../services/hospital.service';

interface UseHospitalDataOptions {
  filters?: HospitalFilters;
  autoLoad?: boolean;
}

interface UseHospitalDataReturn {
  hospitals: HospitalData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
  getHospitalsByCounty: (county: string) => Promise<HospitalData[]>;
  getHospitalById: (id: string) => Promise<HospitalData | null>;
  getHospitalsInBounds: (bounds: { north: number; south: number; east: number; west: number }) => Promise<HospitalData[]>;
  getSummary: () => Promise<any>;
}

export function useHospitalData(options: UseHospitalDataOptions = {}): UseHospitalDataReturn {
  const { filters = {}, autoLoad = true } = options;
  
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHospitals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await hospitalService.getHospitalData(filters);
      
      if (response.success) {
        setHospitals(response.data || []);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to fetch hospital data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refetch = useCallback(async () => {
    await fetchHospitals();
  }, [fetchHospitals]);

  const getHospitalsByCounty = useCallback(async (county: string): Promise<HospitalData[]> => {
    try {
      const response = await hospitalService.getHospitalsByCounty(county);
      return response.success ? response.data || [] : [];
    } catch (err) {
      console.error('Error fetching hospitals by county:', err);
      return [];
    }
  }, []);

  const getHospitalById = useCallback(async (id: string): Promise<HospitalData | null> => {
    try {
      const response = await hospitalService.getHospitalById(id);
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Error fetching hospital by ID:', err);
      return null;
    }
  }, []);

  const getHospitalsInBounds = useCallback(async (bounds: { north: number; south: number; east: number; west: number }): Promise<HospitalData[]> => {
    try {
      const response = await hospitalService.getHospitalsInBounds(bounds);
      return response.success ? response.data || [] : [];
    } catch (err) {
      console.error('Error fetching hospitals in bounds:', err);
      return [];
    }
  }, []);

  const getSummary = useCallback(async () => {
    try {
      const response = await hospitalService.getHospitalSummary();
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Error fetching hospital summary:', err);
      return null;
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (autoLoad) {
      fetchHospitals();
    }
  }, [autoLoad, fetchHospitals]);

  return {
    hospitals,
    loading,
    error,
    lastUpdated,
    refetch,
    getHospitalsByCounty,
    getHospitalById,
    getHospitalsInBounds,
    getSummary
  };
}