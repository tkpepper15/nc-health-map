'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataLayer } from '../components/DataLayers/DataLayerSelector';

interface HospitalData {
  id: number;
  facility_name: string;
  alt_name: string;
  county: string;
  city: string;
  facility_type: string;
  total_beds: number;
  general_beds: number;
  total_surgery_rooms: number;
  is_major_hospital: boolean;
  is_emergency_dept: boolean;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  licensee: string;
}

interface DataLayersState {
  hospitals: HospitalData[];
  hospitalsLoading: boolean;
  hospitalsError: string | null;
  currentLayer: DataLayer;
}

export function useDataLayers() {
  const [state, setState] = useState<DataLayersState>({
    hospitals: [],
    hospitalsLoading: false,
    hospitalsError: null,
    currentLayer: 'medicaid'
  });

  // Fetch hospital data
  const fetchHospitals = useCallback(async () => {
    setState(prev => ({ ...prev, hospitalsLoading: true, hospitalsError: null }));

    try {
      const response = await fetch('/api/hospitals-data');
      if (!response.ok) {
        throw new Error(`Failed to fetch hospitals: ${response.statusText}`);
      }

      const result = await response.json();
      const hospitalsData = result.data || [];

      console.log('✅ Loaded hospital data:', {
        count: hospitalsData.length,
        majorHospitals: hospitalsData.filter((h: HospitalData) => h.is_major_hospital).length,
        emergencyDepts: hospitalsData.filter((h: HospitalData) => h.is_emergency_dept).length
      });

      setState(prev => ({
        ...prev,
        hospitals: hospitalsData,
        hospitalsLoading: false
      }));

    } catch (error) {
      console.error('Failed to fetch hospital data:', error);
      setState(prev => ({
        ...prev,
        hospitalsError: error instanceof Error ? error.message : 'Failed to load hospitals',
        hospitalsLoading: false
      }));
    }
  }, []);

  // Load hospital data on mount
  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // Change active data layer
  const setCurrentLayer = useCallback((layer: DataLayer) => {
    setState(prev => ({ ...prev, currentLayer: layer }));
  }, []);

  // Get layer-specific statistics
  const getLayerStats = useCallback(() => {
    switch (state.currentLayer) {
      case 'hospitals':
        return {
          totalCount: state.hospitals.length,
          majorFacilities: state.hospitals.filter(h => h.is_major_hospital).length,
          emergencyDepts: state.hospitals.filter(h => h.is_emergency_dept).length,
          totalBeds: state.hospitals.reduce((sum, h) => sum + h.total_beds, 0),
          averageBedsPerHospital: state.hospitals.length > 0 ? 
            Math.round(state.hospitals.reduce((sum, h) => sum + h.total_beds, 0) / state.hospitals.length) : 0
        };
      default:
        return null;
    }
  }, [state.currentLayer, state.hospitals]);

  return {
    // Data
    hospitals: state.hospitals,
    currentLayer: state.currentLayer,
    
    // Loading states
    hospitalsLoading: state.hospitalsLoading,
    hospitalsError: state.hospitalsError,
    
    // Actions
    setCurrentLayer,
    refreshHospitals: fetchHospitals,
    
    // Statistics
    getLayerStats
  };
}