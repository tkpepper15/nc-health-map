'use client';

/**
 * Healthcare Data Hook
 * Unified hook for healthcare data management using service layer
 */

import { useState, useEffect, useCallback } from 'react';
import { HealthcareMetrics, County } from '../../types/healthcare';
import { healthcareService, HealthcareDataFilters } from '../services/healthcare.service';

interface UseHealthcareDataOptions {
  filters?: HealthcareDataFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseHealthcareDataReturn {
  data: HealthcareMetrics[];
  counties: County[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
  getCountyData: (fipsCode: string) => HealthcareMetrics | null;
  getSummary: () => Promise<any>;
}

export function useHealthcareData(options: UseHealthcareDataOptions = {}): UseHealthcareDataReturn {
  const { filters = {}, autoRefresh = false, refreshInterval = 300000 } = options; // 5 minutes default
  
  const [data, setData] = useState<HealthcareMetrics[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCounties = useCallback(async () => {
    try {
      const response = await fetch('/data/nc-counties.json');
      if (!response.ok) throw new Error('Failed to load county boundaries');
      
      const geoData = await response.json();
      const countiesData: County[] = geoData.features.map((feature: any) => {
        const countyFips = feature.properties?.FIPS || feature.properties?.fips || '';
        const fullFips = countyFips ? `37${countyFips.padStart(3, '0')}` : '';
        
        return {
          id: fullFips,
          name: feature.properties?.NAME || feature.properties?.name || feature.properties?.CountyName || '',
          fips: fullFips,
          geometry: feature.geometry,
          properties: {
            name: feature.properties?.NAME || feature.properties?.name || '',
            population: feature.properties?.population || 0,
            area: feature.properties?.area || 0,
            classification: (feature.properties?.classification as 'urban' | 'rural' | 'frontier') || 'rural'
          }
        };
      });
      
      setCounties(countiesData);
    } catch (err) {
      console.error('Error loading counties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load counties');
    }
  }, []);

  const fetchHealthcareData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await healthcareService.getHealthcareData(filters);
      
      if (response.success) {
        setData(response.data || []);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to fetch healthcare data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refetch = useCallback(async () => {
    await fetchHealthcareData();
  }, [fetchHealthcareData]);

  const getCountyData = useCallback((fipsCode: string): HealthcareMetrics | null => {
    return data.find(d => d.fips_code === fipsCode) || null;
  }, [data]);

  const getSummary = useCallback(async () => {
    try {
      const response = await healthcareService.getHealthcareSummary();
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Error fetching summary:', err);
      return null;
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchCounties(),
        fetchHealthcareData()
      ]);
    };
    
    loadData();
  }, [fetchCounties, fetchHealthcareData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (!loading) {
        fetchHealthcareData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, fetchHealthcareData]);

  return {
    data,
    counties,
    loading,
    error,
    lastUpdated,
    refetch,
    getCountyData,
    getSummary
  };
}