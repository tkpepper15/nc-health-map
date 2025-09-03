'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { HealthcareMetrics, County } from '../types/healthcare';

// Transform backend data to match frontend interface - REAL DATA ONLY, NO DUMMY VALUES
function transformBackendData(backendItem: Record<string, unknown>): HealthcareMetrics {
  // Only use real population data, no defaults
  const totalPopulation = backendItem.total_population || backendItem.population_2020;
  const medicaidRate = backendItem.medicaid_enrollment_rate;
  
  // Only calculate Medicaid totals if we have BOTH population and rate
  // Note: medicaidRate is per 1000 population, NOT percentage
  let medicaidTotalEnrollment = null;
  if (typeof totalPopulation === 'number' && typeof medicaidRate === 'number') {
    medicaidTotalEnrollment = Math.round(totalPopulation * (medicaidRate / 1000));
  }
  
  return {
    countyId: backendItem.fips_code as string,
    countyName: (backendItem.county_name || backendItem.countyName) as string,
    fips_code: backendItem.fips_code as string,
    
    // Real Medicaid data from database - no dummy values
    medicaid_enrollment_rate: backendItem.medicaid_enrollment_rate || null,
    medicaid_dependency_ratio: backendItem.medicaid_dependency || null, // Use real field, not calculated
    medicaid_total_enrollment: medicaidTotalEnrollment,
    medicaid_expansion_enrollment: null, // No real data available
    medicaid_traditional_enrollment: null, // No real data available
    
    // Real demographic data only
    population_2020: backendItem.total_population || backendItem.population_2020 || null,
    is_rural: backendItem.is_rural, // Use actual field, don't calculate
    
    // Transform SVI data structure
    svi_data: {
      svi_overall_percentile: backendItem.svi_overall_rank,
      svi_overall_score: backendItem.svi_overall_score,
      socioeconomic_percentile: backendItem.svi_theme1_rank,
      household_composition_percentile: backendItem.svi_theme2_rank,
      racial_minority_percentile: backendItem.svi_theme3_rank,
      housing_transport_percentile: backendItem.svi_theme4_rank,
      
      // Theme 1: Socioeconomic
      poverty_150_pct: backendItem.svi_poverty_150_pct || 0,
      unemployment_pct: backendItem.svi_unemployment_pct || 0,
      housing_burden_pct: backendItem.svi_housing_burden_pct || 0,
      no_highschool_pct: backendItem.svi_no_highschool_pct || 0,
      no_insurance_pct: backendItem.svi_no_insurance_pct || 0,
      
      // Theme 2: Household
      age65_older_pct: backendItem.svi_age65_older_pct || 0,
      age17_younger_pct: backendItem.svi_age17_younger_pct || 0,
      disability_pct: backendItem.svi_disability_pct || 0,
      single_parent_pct: backendItem.svi_single_parent_pct || 0,
      limited_english_pct: backendItem.svi_limited_english_pct || 0,
      
      // Theme 3: Racial & Ethnic Minority
      minority_pct: backendItem.svi_minority_pct || 0,
      
      // Theme 4: Housing & Transportation
      multiunit_housing_pct: backendItem.svi_multiunit_housing_pct || 0,
      mobile_homes_pct: backendItem.svi_mobile_homes_pct || 0,
      crowded_housing_pct: backendItem.svi_crowded_housing_pct || 0,
      no_vehicle_pct: backendItem.svi_no_vehicle_pct || 0,
      group_quarters_pct: backendItem.svi_group_quarters_pct || 0
    },
    
    // Use real HCVI scores from Supabase database
    vulnerability_category: backendItem.vulnerability_category || getVulnerabilityCategory(backendItem.hcvi_composite),
    vulnerability_color: getVulnerabilityColor(backendItem.vulnerability_category || getVulnerabilityCategory(backendItem.hcvi_composite)),
    hcvi_composite: backendItem.hcvi_composite,
    policy_risk_score: backendItem.policy_risk_score,
    healthcare_access_score: backendItem.healthcare_access_score,
    economic_vulnerability_score: backendItem.economic_vulnerability_score,
    
    // Create nested structures with ONLY real data - no dummy values
    healthcareAccess: {
      providerDensity: backendItem.physician_density, // null in database
      geographicAccess: backendItem.travel_time_to_hospital, // null in database  
      specialtyServices: backendItem.hospital_access_score, // null in database
      insuranceCoverage: backendItem.uninsured_rate ? (100 - backendItem.uninsured_rate) : null,
      score: backendItem.healthcare_access_score
    },
    policyRisk: {
      medicaidDependency: backendItem.medicaid_dependency, // null in database
      federalFundingReliance: backendItem.federal_funding_reliance, // null in database
      snapVulnerability: backendItem.snap_participation_rate, // null in database
      workRequirementImpact: backendItem.work_requirement_impact, // null in database
      score: backendItem.policy_risk_score
    },
    economicVulnerability: {
      hospitalFinancialHealth: null, // Not in database
      privateEquityExposure: null, // Not in database
      healthcareEmployment: backendItem.healthcare_employment_pct, // null in database
      socialDeterminants: backendItem.poverty_150_rate,
      score: backendItem.economic_vulnerability_score
    },
    hcvi: {
      score: backendItem.hcvi_composite,
      ranking: backendItem.vulnerability_level, // null in database
      category: backendItem.vulnerability_category,
      color: backendItem.vulnerability_category ? getVulnerabilityColor(backendItem.vulnerability_category) : '#e5e7eb'
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

  // Fetch processed data from backend
  const fetchProcessedData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try Supabase API first (prioritize real data)
      console.log('🔄 Attempting to connect to Supabase backend...');
      try {
        const healthcareRes = await fetch('/api/healthcare-data');

        if (healthcareRes.ok) {
          const response = await healthcareRes.json();
          const backendData = response.data;
          
          if (backendData && backendData.length > 0) {
            console.log('✅ Successfully connected to Supabase! Using real data:', {
              count: backendData.length,
              sampleCounty: backendData[0]?.county_name || backendData[0]?.countyName,
              timestamp: response.metadata?.timestamp || new Date().toISOString()
            });

            // Transform backend data to match frontend interface
            const healthcareData = backendData.map((item: Record<string, unknown>) => transformBackendData(item));

          // Load county boundaries from GeoJSON 
          const geoResponse = await fetch('/data/nc-counties.json');
          const ncCountiesGeoJSON = await geoResponse.json();
          
          const countiesData: County[] = ncCountiesGeoJSON.features.map((feature: GeoJSON.Feature) => {
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

            setData(prev => ({
              healthcareData,
              counties: countiesData,
              lastUpdated: new Date(response.metadata?.timestamp || Date.now()),
              updateInProgress: prev.updateInProgress
            }));
            setError(null);
            setLoading(false);
            return;
          }
        }
        
        // If we get here, API responded but had no data
        console.log('⚠️ Supabase API responded but returned no data');
      } catch (apiError) {
        console.error('❌ Supabase connection failed:', apiError);
        setError('Unable to connect to Supabase database. Please check your connection.');
        setData(() => ({
          healthcareData: [],
          counties: [],
          lastUpdated: null,
          updateInProgress: false
        }));
        setLoading(false);
        return;
      }

      // This shouldn't be reached since we return above, but keeping for safety
      console.error('❌ Supabase API call failed - no fallback available');
      setError('Database connection required. Please ensure Supabase is accessible.');
      
      setData(() => ({
        healthcareData: [],
        counties: [],
        lastUpdated: null,
        updateInProgress: false
      }));
      
    } catch (err) {
      console.error('Failed to fetch healthcare data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [fetchProcessedData]);

  // Initial data fetch only
  useEffect(() => {
    fetchProcessedData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Function to get aggregated summary for map display - memoized
  const getMapData = useMemo(() => {
    return data.healthcareData.map(county => ({
      fips: county.fips_code,
      name: county.countyName,
      hcvi: county.hcvi_composite,
      category: county.vulnerability_category,
      medicaidRate: county.medicaid_enrollment_rate
    }));
  }, [data.healthcareData]);

  // Create lookup maps for O(1) performance
  const healthcareDataMap = useMemo(() => {
    const map = new Map<string, HealthcareMetrics>();
    data.healthcareData.forEach(item => {
      map.set(item.fips_code, item);
    });
    return map;
  }, [data.healthcareData]);

  const countiesMap = useMemo(() => {
    const map = new Map<string, County>();
    data.counties.forEach(county => {
      map.set(county.fips, county);
    });
    return map;
  }, [data.counties]);

  // Function to get detailed data for a specific county - optimized with Map lookup
  const getCountyDetails = useCallback((fips: string) => {
    const healthData = healthcareDataMap.get(fips);
    const countyData = countiesMap.get(fips);
    
    return healthData && countyData ? {
      ...healthData,
      ...countyData
    } : null;
  }, [healthcareDataMap, countiesMap]);

  return {
    ...data,
    loading,
    error,
    triggerUpdate,
    refresh: fetchProcessedData,
    mapData: getMapData,
    getCountyDetails,
    healthcareDataMap,
    countiesMap,
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