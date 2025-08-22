'use client';

import { useState, useEffect } from 'react';

export interface HospitalData {
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

interface HospitalStats {
  totalCount: number;
  majorFacilities: number;
  emergencyDepts: number;
  totalBeds: number;
  averageBedsPerHospital: number;
}

export function useHospitalData() {
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHospitalStats = (): HospitalStats => {
    if (hospitals.length === 0) {
      return {
        totalCount: 0,
        majorFacilities: 0,
        emergencyDepts: 0,
        totalBeds: 0,
        averageBedsPerHospital: 0
      };
    }

    const totalBeds = hospitals.reduce((sum, h) => sum + (h.total_beds || 0), 0);
    const majorFacilities = hospitals.filter(h => h.is_major_hospital).length;
    const emergencyDepts = hospitals.filter(h => h.is_emergency_dept).length;

    return {
      totalCount: hospitals.length,
      majorFacilities,
      emergencyDepts,
      totalBeds,
      averageBedsPerHospital: Math.round(totalBeds / hospitals.length)
    };
  };

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/hospitals-data');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.message || 'Failed to load hospital data');
        }

        setHospitals(result.data || []);
        console.log(`✅ Loaded ${result.data?.length || 0} hospitals from ${result.metadata?.source || 'unknown source'}`);
        
      } catch (err) {
        console.error('Failed to fetch hospital data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load hospital data');
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  return {
    hospitals,
    loading,
    error,
    getHospitalStats
  };
}