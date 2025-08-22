'use client';

import { useState, useEffect, useCallback } from 'react';
import { HealthcareMetrics, County } from '../types/healthcare';

interface DataSource {
  source: 'supabase' | 'local' | 'fallback';
  lastUpdated: Date | null;
  error?: string;
}

// Unified data transformation that works for both Supabase and local data
function transformToUnifiedFormat(rawData: any, source: 'supabase' | 'local'): HealthcareMetrics {
  if (source === 'supabase') {
    // Transform Supabase flat structure to nested UI format
    return {
      countyId: rawData.fips_code,
      countyName: rawData.county_name,
      fips_code: rawData.fips_code,
      
      // Demographics
      population_2020: rawData.total_population || rawData.population_2020,
      is_rural: rawData.is_rural,
      
      // HCVI Scores - use real Supabase data
      hcvi_composite: rawData.hcvi_composite,
      vulnerability_category: rawData.vulnerability_category || getVulnerabilityCategory(rawData.hcvi_composite),
      vulnerability_color: getVulnerabilityColor(rawData.vulnerability_category || getVulnerabilityCategory(rawData.hcvi_composite)),
      healthcare_access_score: rawData.healthcare_access_score,
      policy_risk_score: rawData.policy_risk_score,
      economic_vulnerability_score: rawData.economic_vulnerability_score,
      
      // Medicaid Data
      medicaid_enrollment_rate: rawData.medicaid_enrollment_rate,
      medicaid_dependency_ratio: rawData.medicaid_dependency || rawData.medicaid_dependency_ratio,
      medicaid_total_enrollment: rawData.medicaid_total_enrollment || calculateMedicaidEnrollment(rawData),
      medicaid_expansion_enrollment: rawData.medicaid_expansion_enrollment,
      medicaid_traditional_enrollment: rawData.medicaid_traditional_enrollment,
      
      // SVI Data - transform flat fields to nested structure expected by UI
      svi_data: {
        svi_overall_percentile: (rawData.svi_overall_rank !== null && rawData.svi_overall_rank !== undefined) ? rawData.svi_overall_rank : null,
        svi_overall_score: (rawData.svi_overall_score !== null && rawData.svi_overall_score !== undefined) ? rawData.svi_overall_score : null,
        socioeconomic_percentile: (rawData.svi_theme1_rank !== null && rawData.svi_theme1_rank !== undefined) ? rawData.svi_theme1_rank : null,
        household_composition_percentile: (rawData.svi_theme2_rank !== null && rawData.svi_theme2_rank !== undefined) ? rawData.svi_theme2_rank : null,
        racial_minority_percentile: (rawData.svi_theme3_rank !== null && rawData.svi_theme3_rank !== undefined) ? rawData.svi_theme3_rank : null,
        housing_transport_percentile: (rawData.svi_theme4_rank !== null && rawData.svi_theme4_rank !== undefined) ? rawData.svi_theme4_rank : null,
        
        // Theme 1: Socioeconomic
        poverty_150_pct: rawData.svi_poverty_150_pct || 0,
        unemployment_pct: rawData.svi_unemployment_pct || 0,
        housing_burden_pct: rawData.svi_housing_burden_pct || 0,
        no_highschool_pct: rawData.svi_no_highschool_pct || 0,
        no_insurance_pct: rawData.svi_no_insurance_pct || 0,
        
        // Theme 2: Household Characteristics  
        age65_older_pct: rawData.svi_age65_older_pct || 0,
        age17_younger_pct: rawData.svi_age17_younger_pct || 0,
        disability_pct: rawData.svi_disability_pct || 0,
        single_parent_pct: rawData.svi_single_parent_pct || 0,
        limited_english_pct: rawData.svi_limited_english_pct || 0,
        
        // Theme 3: Racial & Ethnic Minority
        minority_pct: rawData.svi_minority_pct || 0,
        
        // Theme 4: Housing & Transportation
        multiunit_housing_pct: rawData.svi_multiunit_housing_pct || 0,
        mobile_homes_pct: rawData.svi_mobile_homes_pct || 0,
        crowded_housing_pct: rawData.svi_crowded_housing_pct || 0,
        no_vehicle_pct: rawData.svi_no_vehicle_pct || 0,
        group_quarters_pct: rawData.svi_group_quarters_pct || 0
      },
      
      // Nested structure for UI compatibility
      healthcareAccess: {
        providerDensity: getSafeValue(rawData.physician_density),
        geographicAccess: getSafeValue(rawData.hospital_access_score),
        specialtyServices: getSafeValue(rawData.travel_time_to_hospital),
        insuranceCoverage: getSafeValue(rawData.uninsured_rate) !== null ? (100 - rawData.uninsured_rate) : null,
        score: getSafeValue(rawData.healthcare_access_score)
      },
      
      policyRisk: {
        medicaidDependency: getSafeValue(rawData.medicaid_dependency),
        federalFundingReliance: getSafeValue(rawData.federal_funding_reliance),
        snapVulnerability: getSafeValue(rawData.snap_participation_rate),
        workRequirementImpact: getSafeValue(rawData.work_requirement_impact),
        score: getSafeValue(rawData.policy_risk_score)
      },
      
      economicVulnerability: {
        hospitalFinancialHealth: getSafeValue(rawData.hospital_financial_health),
        privateEquityExposure: getSafeValue(rawData.private_equity_exposure),
        healthcareEmployment: getSafeValue(rawData.healthcare_employment_pct),
        socialDeterminants: getSafeValue(rawData.poverty_rate),
        score: getSafeValue(rawData.economic_vulnerability_score)
      },
      
      hcvi: {
        score: getSafeValue(rawData.hcvi_composite),
        ranking: getSafeValue(rawData.vulnerability_level),
        category: rawData.vulnerability_category || getVulnerabilityCategory(rawData.hcvi_composite),
        color: getVulnerabilityColor(rawData.vulnerability_category || getVulnerabilityCategory(rawData.hcvi_composite))
      }
    };
  } else {
    // Local data is already in the correct format, just pass through
    return rawData as HealthcareMetrics;
  }
}

// Helper functions
function getSafeValue(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function getVulnerabilityCategory(hcviScore: number | null): string {
  if (!hcviScore) return 'unknown';
  if (hcviScore >= 7.5) return 'extreme';
  if (hcviScore >= 5.5) return 'high';
  if (hcviScore >= 3.5) return 'moderate';
  return 'low';
}

function getVulnerabilityColor(category: string): string {
  const colors = {
    'low': '#22c55e',
    'moderate': '#f59e0b',
    'high': '#ef4444',
    'extreme': '#dc2626',
    'unknown': '#6b7280'
  };
  return colors[category as keyof typeof colors] || '#6b7280';
}

function calculateMedicaidEnrollment(data: any): number {
  if (data.medicaid_total_enrollment) return data.medicaid_total_enrollment;
  if (data.total_population && data.medicaid_enrollment_rate) {
    return Math.round(data.total_population * (data.medicaid_enrollment_rate / 100));
  }
  return 0;
}

export function useUnifiedHealthcareData() {
  const [healthcareData, setHealthcareData] = useState<HealthcareMetrics[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>({
    source: 'fallback',
    lastUpdated: null
  });

  console.log('useUnifiedHealthcareData hook state:', { 
    loading, 
    error, 
    healthcareDataLength: healthcareData.length, 
    countiesLength: counties.length,
    dataSource: dataSource.source 
  });

  const fetchUnifiedData = useCallback(async () => {
    console.log('🚀 Starting fetchUnifiedData...');
    setLoading(true);
    setError(null);

    try {
      // TEMPORARILY SKIP SUPABASE - GO DIRECTLY TO LOCAL DATA FOR DEBUGGING
      console.log('🔧 DEBUG MODE: Skipping Supabase, using local data directly');
      
      // Load local data directly
      console.log('📁 Loading local healthcare data...');
      const { mockHealthcareData } = await import('../data/healthcareData');
      console.log('📁 Loading county GeoJSON data...');
      const geoResponse = await fetch('/data/nc-counties.json');
      const ncCountiesGeoJSON = await geoResponse.json();
      console.log('✅ Local data loaded successfully:', { 
        healthcareDataLength: mockHealthcareData.length,
        countiesLength: ncCountiesGeoJSON.features.length 
      });

      // Transform local data (minimal transformation needed)
      console.log('🔄 Transforming local data, sample item:', mockHealthcareData[0]);
      const transformedData = mockHealthcareData.map((item: any) => {
        const transformed = transformToUnifiedFormat(item, 'local');
        console.log('Transformed item:', { original: item.countyName, transformed: transformed.countyName });
        return transformed;
      });

      console.log('📊 Setting healthcare data, count:', transformedData.length);
      setHealthcareData(transformedData);
      setDataSource({
        source: 'local',
        lastUpdated: null
      });

      const countiesData: County[] = ncCountiesGeoJSON.features.map((feature: any) => {
        const countyFips = feature.properties?.FIPS || feature.properties?.fips || '';
        const fullFips = countyFips ? `37${countyFips.padStart(3, '0')}` : '';
        return {
          id: fullFips,
          name: feature.properties?.NAME || feature.properties?.name || feature.properties?.CountyName || '',
          fips: fullFips,
          geometry: feature.geometry as any,
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
      console.error('❌ CRITICAL ERROR in fetchUnifiedData:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack');
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setDataSource({
        source: 'fallback',
        lastUpdated: null,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      console.log('🏁 FINALLY BLOCK: Setting loading to false');
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    console.log('🚀 useEffect triggered - starting data fetch');
    fetchUnifiedData();
  }, [fetchUnifiedData]);

  // EMERGENCY FALLBACK - Force load data after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && healthcareData.length === 0) {
        console.log('⚠️ EMERGENCY FALLBACK: Loading taking too long, forcing simple data load');
        const loadFallbackData = async () => {
          try {
            const { mockHealthcareData } = await import('../data/healthcareData');
            const fallbackGeoResponse = await fetch('/data/nc-counties.json');
            const ncCountiesGeoJSON = await fallbackGeoResponse.json();
            
            const transformedData = mockHealthcareData.slice(0, 5).map((item: any) => transformToUnifiedFormat(item, 'local'));
            setHealthcareData(transformedData);
            setCounties(ncCountiesGeoJSON.features.slice(0, 5).map((f: any) => ({
              id: `37${f.properties.FIPS}`,
              name: f.properties.NAME,
              fips: `37${f.properties.FIPS}`,
              geometry: f.geometry as any,
              properties: { name: f.properties.NAME, population: 0, area: 0, classification: 'rural' as const }
            })));
            setLoading(false);
            console.log('✅ Emergency fallback data loaded');
          } catch (e) {
            console.error('❌ Emergency fallback failed:', e);
            setLoading(false);
          }
        };
        loadFallbackData();
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timer);
  }, [loading, healthcareData.length]);

  // Get county details by FIPS
  const getCountyDetails = useCallback((fips: string) => {
    const healthData = healthcareData.find(d => d.fips_code === fips);
    const countyData = counties.find(c => c.fips === fips);
    
    return healthData && countyData ? {
      ...healthData,
      ...countyData
    } : null;
  }, [healthcareData, counties]);

  return {
    healthcareData,
    counties,
    loading,
    error,
    dataSource,
    refresh: fetchUnifiedData,
    getCountyDetails
  };
}