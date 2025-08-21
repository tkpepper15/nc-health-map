'use client';

import { useState, useEffect, useCallback } from 'react';
import { HealthcareMetrics, County } from '../types/healthcare';

// Transform backend data to match frontend interface - REAL DATA ONLY
function transformBackendData(backendItem: any): HealthcareMetrics {
  return {
    countyId: backendItem.fips_code,
    countyName: backendItem.county_name || backendItem.countyName,
    fips_code: backendItem.fips_code,
    
    // Real Medicaid data from CSV
    medicaid_enrollment_rate: backendItem.medicaid_enrollment_rate,
    medicaid_dependency_ratio: backendItem.medicaid_dependency || backendItem.medicaid_dependency_ratio,
    medicaid_total_enrollment: backendItem.medicaid_total_enrollment || backendItem.total_population * (backendItem.medicaid_enrollment_rate / 100),
    medicaid_expansion_enrollment: backendItem.medicaid_expansion_enrollment,
    medicaid_traditional_enrollment: backendItem.medicaid_traditional_enrollment,
    
    // Real demographic data
    population_2020: backendItem.population_2020,
    is_rural: backendItem.is_rural,
    
    // Real SVI data from CDC
    svi_data: backendItem.svi_data,
    
    // Use real HCVI scores from Supabase database
    vulnerability_category: backendItem.vulnerability_category || getVulnerabilityCategory(backendItem.hcvi_composite),
    vulnerability_color: getVulnerabilityColor(backendItem.vulnerability_category || getVulnerabilityCategory(backendItem.hcvi_composite)),
    hcvi_composite: backendItem.hcvi_composite,
    policy_risk_score: backendItem.policy_risk_score,
    healthcare_access_score: backendItem.healthcare_access_score,
    economic_vulnerability_score: backendItem.economic_vulnerability_score,
    
    // Use real nested structures from Supabase data
    healthcareAccess: {
      providerDensity: backendItem.physician_density || 0,
      geographicAccess: backendItem.hospital_access_score || 0,
      specialtyServices: backendItem.travel_time_to_hospital || 0,
      insuranceCoverage: (100 - (backendItem.uninsured_rate || 0)),
      score: backendItem.healthcare_access_score || 0
    },
    policyRisk: {
      medicaidDependency: backendItem.medicaid_dependency || 0,
      federalFundingReliance: backendItem.federal_funding_reliance || 0,
      snapVulnerability: backendItem.snap_participation_rate || 0,
      workRequirementImpact: backendItem.work_requirement_impact || 0,
      score: backendItem.policy_risk_score || 0
    },
    economicVulnerability: {
      hospitalFinancialHealth: backendItem.hospital_financial_health || 0,
      privateEquityExposure: backendItem.private_equity_exposure || 0,
      healthcareEmployment: backendItem.healthcare_employment_pct || 0,
      socialDeterminants: backendItem.poverty_rate || 0,
      score: backendItem.economic_vulnerability_score || 0
    },
    hcvi: {
      score: backendItem.hcvi_composite || 0,
      ranking: backendItem.vulnerability_level || 0,
      category: backendItem.vulnerability_category || getVulnerabilityCategory(backendItem.hcvi_composite),
      color: getVulnerabilityColor(backendItem.vulnerability_category || getVulnerabilityCategory(backendItem.hcvi_composite))
    }
  };
}

// Helper function to get vulnerability category from HCVI score
function getVulnerabilityCategory(hcviScore: number | null): string {
  if (!hcviScore) return 'unknown';
  if (hcviScore >= 7.5) return 'extreme';
  if (hcviScore >= 5.5) return 'high';
  if (hcviScore >= 3.5) return 'moderate';
  return 'low';
}

// Helper function to get vulnerability color
function getVulnerabilityColor(category: string): string {
  const colors = {
    'low': '#22c55e',      // Green
    'moderate': '#f59e0b', // Amber  
    'high': '#ef4444',     // Red
    'extreme': '#dc2626',  // Dark Red
    'unknown': '#6b7280'   // Gray
  };
  return colors[category as keyof typeof colors] || '#6b7280';
}

// Helper function to get color based on Medicaid enrollment rate
function getMedicaidEnrollmentColor(rate: number): string {
  if (rate >= 50) return '#1e40af';      // Very High - Deep Blue
  if (rate >= 30) return '#3b82f6';      // High - Blue  
  if (rate >= 15) return '#60a5fa';      // Moderate - Light Blue
  if (rate >= 5) return '#93c5fd';       // Low - Very Light Blue
  return '#dbeafe';                      // Very Low - Pale Blue
}

interface ProcessedData {
  healthcareData: HealthcareMetrics[];
  counties: County[];
  lastUpdated: Date | null;
  updateInProgress: boolean;
}

export function useOptimizedHealthcareData() {
  const [data, setData] = useState<ProcessedData>({
    healthcareData: [],
    counties: [],
    lastUpdated: null,
    updateInProgress: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to trigger manual data update
  const triggerUpdate = useCallback(async () => {
    setData(prev => ({ ...prev, updateInProgress: true }));
    setError(null);

    try {
      // Call backend API to process latest CSV data
      const response = await fetch('/api/process-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to process data: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Fetch updated data
      await fetchProcessedData();
      
      console.log('Data update completed:', result);
      
    } catch (err) {
      console.error('Update failed:', err);
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setData(prev => ({ ...prev, updateInProgress: false }));
    }
  }, []);

  // Fetch processed data from backend
  const fetchProcessedData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try backend API first
      try {
        const healthcareRes = await fetch('/api/healthcare-data'); // Get full data, not aggregated

        if (healthcareRes.ok) {
          const response = await healthcareRes.json();
          const backendData = response.data; // Extract data from API response
          
          console.log('✅ Using real processed data from backend:', {
            count: backendData.length,
            sample: backendData[0],
            sampleKeys: Object.keys(backendData[0] || {}),
            timestamp: response.metadata?.timestamp
          });
          
          console.log('✅ Real data loaded from backend:', {
            count: backendData.length,
            sampleCounty: backendData[0]?.countyName,
            sampleMedicaid: backendData[0]?.medicaid_total_enrollment,
            hasSVIData: !!backendData[0]?.svi_data
          });

          // Transform backend data to match frontend interface
          const healthcareData = backendData.map((item: any) => transformBackendData(item));

          // Load county boundaries from GeoJSON 
          const { ncCountiesGeoJSON } = await import('../data/ncCountiesGeoJSON');
          
          const countiesData: County[] = ncCountiesGeoJSON.features.map(feature => ({
            id: feature.properties?.fips || feature.properties?.FIPS || '',
            name: feature.properties?.NAME || feature.properties?.name || '',
            fips: feature.properties?.fips || feature.properties?.FIPS || '',
            geometry: feature.geometry as any,
            properties: {
              name: feature.properties?.NAME || feature.properties?.name || '',
              population: feature.properties?.population || 0,
              area: feature.properties?.area || 0,
              classification: (feature.properties?.classification as 'urban' | 'rural' | 'frontier') || 'rural'
            }
          }));

          setData(prev => ({
            healthcareData,
            counties: countiesData,
            lastUpdated: new Date(),
            updateInProgress: prev.updateInProgress
          }));
          setError(null);
          return;
        }
      } catch (apiError) {
        console.warn('Backend API not available, falling back to local data:', apiError);
      }

      // Fallback to local data
      const { mockHealthcareData } = await import('../data/healthcareData');
      const { ncCountiesGeoJSON } = await import('../data/ncCountiesGeoJSON');
      
      const countiesData: County[] = ncCountiesGeoJSON.features.map(feature => ({
        id: feature.properties?.fips || feature.properties?.FIPS || '',
        name: feature.properties?.NAME || feature.properties?.name || '',
        fips: feature.properties?.fips || feature.properties?.FIPS || '',
        geometry: feature.geometry as any,
        properties: {
          name: feature.properties?.NAME || feature.properties?.name || '',
          population: feature.properties?.population || 0,
          area: feature.properties?.area || 0,
          classification: (feature.properties?.classification as 'urban' | 'rural' | 'frontier') || 'rural'
        }
      }));

      console.log('⚠️ Using fallback mock data');
      
      setData(prev => ({
        healthcareData: mockHealthcareData as HealthcareMetrics[],
        counties: countiesData,
        lastUpdated: null, // null indicates local data
        updateInProgress: prev.updateInProgress
      }));
      
    } catch (err) {
      console.error('Failed to fetch healthcare data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch only
  useEffect(() => {
    fetchProcessedData();
  }, []); // Empty dependency array - only run once on mount

  // Optional: Auto-refresh every 5 minutes (disabled by default to prevent spam)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (!data.updateInProgress && data.lastUpdated) {
  //       fetchProcessedData();
  //     }
  //   }, 5 * 60 * 1000); // 5 minutes
  //   return () => clearInterval(interval);
  // }, [data.updateInProgress, data.lastUpdated]);

  // Function to get aggregated summary for map display
  const getMapData = useCallback(() => {
    return data.healthcareData.map(county => ({
      fips: county.fips_code,
      name: county.countyName,
      hcvi: county.hcvi_composite,
      category: county.vulnerability_category,
      medicaidRate: county.medicaid_enrollment_rate
    }));
  }, [data.healthcareData]);

  // Function to get detailed data for a specific county
  const getCountyDetails = useCallback((fips: string) => {
    const healthData = data.healthcareData.find(d => d.fips_code === fips);
    const countyData = data.counties.find(c => c.fips === fips);
    
    return healthData && countyData ? {
      ...healthData,
      ...countyData
    } : null;
  }, [data.healthcareData, data.counties]);

  return {
    ...data,
    loading,
    error,
    triggerUpdate,
    refresh: fetchProcessedData,
    getMapData,
    getCountyDetails,
    isBackendConnected: data.lastUpdated !== null
  };
}

// Backend API endpoints (these would be implemented)
export const HealthcareDataAPI = {
  async processRawData(): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/process-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getProcessingStatus(): Promise<{ status: 'idle' | 'processing' | 'completed' | 'error'; progress?: number }> {
    const response = await fetch('/api/processing-status');
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getHealthcareData(): Promise<HealthcareMetrics[]> {
    const response = await fetch('/api/healthcare-data');
    
    if (!response.ok) {
      throw new Error(`Data fetch failed: ${response.statusText}`);
    }
    
    return response.json();
  }
};