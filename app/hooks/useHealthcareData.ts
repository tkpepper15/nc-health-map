'use client';

import { useState, useEffect } from 'react';
import { HealthcareMetrics, County } from '../types/healthcare';

// Local data configuration - no API needed

export function useHealthcareData() {
  const [data, setData] = useState<HealthcareMetrics[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);


  // Main data fetching function - now uses local data only
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load local data instead of API calls
      await loadLocalData();
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Failed to load healthcare data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
    } finally {
      setLoading(false);
    }
  };

  // Load local data - replaces API calls
  const loadLocalData = async () => {
    try {
      // Import local healthcare data
      const { mockHealthcareData } = await import('../data/healthcareData');
      setData(mockHealthcareData as HealthcareMetrics[]);
      
      // Import GeoJSON county data
      const response = await fetch('/data/nc-counties.json');
      const ncCountiesGeoJSON = await response.json();
      
      // Transform GeoJSON to County format
      const countiesData: County[] = ncCountiesGeoJSON.features.map((feature: any) => ({
        id: feature.properties?.FIPS || feature.properties?.fips || '',
        name: feature.properties?.NAME || feature.properties?.name || '',
        fips: feature.properties?.FIPS || feature.properties?.fips || '',
        geometry: feature.geometry as { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] },
        properties: {
          name: feature.properties?.NAME || feature.properties?.name || '',
          population: feature.properties?.population || 0,
          area: feature.properties?.area || 0,
          classification: (feature.properties?.classification as 'urban' | 'rural' | 'frontier') || 'rural'
        }
      }));
      
      setCounties(countiesData);
      
    } catch (localError) {
      console.error('Failed to load local data:', localError);
      setError('Failed to load local healthcare data');
    }
  };

  // Helper function to get FIPS codes
  const getCountyFips = (countyId: string): string => {
    const fipsMap: { [key: string]: string } = {
      'wake': '37183',
      'mecklenburg': '37119',
      'durham': '37063',
      'orange': '37135',
      'columbus': '37047',
      'robeson': '37155',
      'swain': '37173',
      'person': '37145'
    };
    return fipsMap[countyId] || '37999';
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refresh function
  const refresh = () => {
    fetchData();
  };

  return {
    data,
    counties,
    loading,
    error,
    lastUpdated,
    refresh
  };
}

// Hook for fetching county details from local data
export function useCountyDetails(fipsCode: string | null) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fipsCode) {
      setDetails(null);
      return;
    }

    const loadCountyDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Import local data
        const { mockHealthcareData, getMedicaidDataByCounty } = await import('../data/healthcareData');
        const response = await fetch('/data/nc-counties.json');
      const ncCountiesGeoJSON = await response.json();
        
        // Find healthcare data by FIPS
        const healthcareData = mockHealthcareData.find(county => county.fips_code === fipsCode);
        const geoData = ncCountiesGeoJSON.features.find((feature: any) => feature.properties?.fips === fipsCode);
        const medicaidData = healthcareData ? getMedicaidDataByCounty(healthcareData.countyName) : null;
        
        if (healthcareData && geoData) {
          setDetails({
            ...healthcareData,
            geometry: geoData.geometry,
            medicaidData
          });
        } else {
          setError('County not found');
        }
        
      } catch (err) {
        console.error('Failed to load county details:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadCountyDetails();
  }, [fipsCode]);

  return { details, loading, error };
}

// Hook for fetching specific layer data from local sources
export function useLayerData(layerName: string) {
  const [layerData, setLayerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!layerName) return;

    const loadLayerData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load different layers from local data
        const { mockHealthcareData } = await import('../data/healthcareData');
        
        let layerData: any = null;
        
        switch (layerName) {
          case 'medicaid':
            layerData = mockHealthcareData.map(county => ({
              fips: county.fips_code,
              name: county.countyName,
              medicaidEnrollment: county.medicaid_total_enrollment,
              medicaidRate: county.medicaid_enrollment_rate,
              medicaidDependency: county.medicaid_dependency_ratio
            }));
            break;
          case 'healthcare-access':
            layerData = mockHealthcareData.map(county => ({
              fips: county.fips_code,
              name: county.countyName,
              accessScore: county.healthcare_access_score,
              providerDensity: county.healthcareAccess.providerDensity,
              hospitalAccess: county.healthcareAccess.geographicAccess
            }));
            break;
          case 'policy-risk':
            layerData = mockHealthcareData.map(county => ({
              fips: county.fips_code,
              name: county.countyName,
              policyScore: county.policy_risk_score,
              medicaidDependency: county.policyRisk.medicaidDependency,
              workRequirementImpact: county.policyRisk.workRequirementImpact
            }));
            break;
          case 'economic-vulnerability':
            layerData = mockHealthcareData.map(county => ({
              fips: county.fips_code,
              name: county.countyName,
              economicScore: county.economic_vulnerability_score,
              hospitalHealth: county.economicVulnerability.hospitalFinancialHealth,
              socialDeterminants: county.economicVulnerability.socialDeterminants
            }));
            break;
          default:
            throw new Error(`Unknown layer: ${layerName}`);
        }
        
        setLayerData(layerData);
        
      } catch (err) {
        console.error('Failed to load layer data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadLayerData();
  }, [layerName]);

  return { layerData, loading, error };
}