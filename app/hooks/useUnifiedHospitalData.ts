'use client';

import { useState, useEffect, useCallback } from 'react';

interface HospitalData {
  id: number;
  facility_name: string;
  alt_name?: string;
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

interface HospitalDataSource {
  source: 'supabase' | 'file' | 'fallback';
  lastUpdated: Date | null;
  error?: string;
}

// Unified hospital data transformation
function transformHospitalData(rawData: any, source: 'supabase' | 'file'): HospitalData {
  if (source === 'file') {
    // Transform GeoJSON structure from file
    const props = rawData.properties;
    const coords = rawData.geometry.coordinates;
    
    return {
      id: props.objectid || rawData.id || Math.random(),
      facility_name: props.facility || props.facility_name || 'Unknown Facility',
      alt_name: props.altfacname || props.alt_name,
      licensee: props.licensee || 'N/A',
      facility_type: props.hltype || props.facility_type || 'Hospital',
      
      // Location
      county: props.fcounty || props.county || 'Unknown',
      city: props.fcity || props.city || 'Unknown',
      address: props.faddr1 || props.address || 'N/A',
      phone: props.fphone || props.phone || 'N/A',
      latitude: coords[1],
      longitude: coords[0],
      
      // Capacity
      general_beds: props.hgenlic || props.general_beds || 0,
      total_beds: (props.hgenlic || 0) + (props.rehabhlic || 0) + (props.psylic || 0) + (props.nfgenlic || 0),
      total_surgery_rooms: (props.orheart_hl || 0) + (props.orcsect_hl || 0) + (props.oramsu_hl || 0) + 
                          (props.orshare_hl || 0) + (props.orendo_hl || 0) + (props.orother_hl || 0),
      
      // Classifications
      is_major_hospital: (props.hgenlic || 0) >= 100,
      is_emergency_dept: props.hltype === 'ED' || props.has_emergency_dept
    };
  } else {
    // Supabase data is already in correct format
    return {
      id: rawData.id,
      facility_name: rawData.facility_name,
      alt_name: rawData.alt_name,
      county: rawData.county,
      city: rawData.city,
      facility_type: rawData.facility_type,
      total_beds: rawData.total_beds || 0,
      general_beds: rawData.general_beds || 0,
      total_surgery_rooms: rawData.total_surgery_rooms || 0,
      is_major_hospital: rawData.is_major_hospital || false,
      is_emergency_dept: rawData.is_emergency_dept || rawData.has_emergency_dept || false,
      latitude: rawData.latitude,
      longitude: rawData.longitude,
      address: rawData.address,
      phone: rawData.phone,
      licensee: rawData.licensee
    };
  }
}

export function useUnifiedHospitalData() {
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<HospitalDataSource>({
    source: 'fallback',
    lastUpdated: null
  });

  const fetchUnifiedHospitalData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try Supabase/API first
      const response = await fetch('/api/hospitals-data');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
          console.log('✅ Using hospital data from API:', {
            count: result.data.length,
            source: result.metadata?.source,
            majorHospitals: result.data.filter((h: any) => h.is_major_hospital).length
          });

          // Transform data based on source
          const transformedData = result.data.map((item: any) => {
            // Check if this is file-based data (has properties structure) or direct DB data
            const source = item.properties ? 'file' : 'supabase';
            return transformHospitalData(item, source);
          });

          setHospitals(transformedData);
          setDataSource({
            source: result.metadata?.source === 'database' ? 'supabase' : 'file',
            lastUpdated: new Date(result.metadata?.timestamp || Date.now())
          });
          
          return;
        }
      }

      // Fallback - this shouldn't happen with the API fallback, but just in case
      console.log('⚠️ No hospital data available from any source');
      setHospitals([]);
      setDataSource({
        source: 'fallback',
        lastUpdated: null,
        error: 'No hospital data available'
      });

    } catch (err) {
      console.error('Failed to fetch hospital data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hospital data');
      setDataSource({
        source: 'fallback',
        lastUpdated: null,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUnifiedHospitalData();
  }, [fetchUnifiedHospitalData]);

  // Get hospitals by county
  const getHospitalsByCounty = useCallback((countyName: string) => {
    return hospitals.filter(h => 
      h.county.toLowerCase().includes(countyName.toLowerCase())
    );
  }, [hospitals]);

  // Get hospital statistics
  const getHospitalStats = useCallback(() => {
    return {
      totalCount: hospitals.length,
      majorFacilities: hospitals.filter(h => h.is_major_hospital).length,
      emergencyDepts: hospitals.filter(h => h.is_emergency_dept).length,
      totalBeds: hospitals.reduce((sum, h) => sum + h.total_beds, 0),
      averageBedsPerHospital: hospitals.length > 0 ? 
        Math.round(hospitals.reduce((sum, h) => sum + h.total_beds, 0) / hospitals.length) : 0
    };
  }, [hospitals]);

  return {
    hospitals,
    loading,
    error,
    dataSource,
    refresh: fetchUnifiedHospitalData,
    getHospitalsByCounty,
    getHospitalStats
  };
}