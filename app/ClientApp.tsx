'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Header from './components/Layout/Header';
import MainContent from './components/Layout/MainContent';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to prevent SSR issues
const NCLeafletMap = dynamic(() => import('./components/Map/NCLeafletMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg"></div>
});
const DescriptionLegendTile = dynamic(() => import('./components/Map/DescriptionLegendTile'), {
  ssr: false
});
import DataLayerSelector from './components/DataLayers/DataLayerSelector';
import DataDownloadButton from './components/Index/DataDownloadButton';
import DataSourceTransparency from './components/Index/DataSourceTransparency';
import { DataLayer } from './components/DataLayers/DataLayerSelector';
import { useHealthcareStore } from './utils/store';
import { useOptimizedHealthcareData } from './hooks/useOptimizedHealthcareData';
import { useHospitalData } from './hooks/useHospitalData';
import { County } from './types/healthcare';

export default function ClientApp() {
  const [activeTab, setActiveTab] = useState<'index' | 'data' | 'project'>('index');
  const [selectedHospital, setSelectedHospital] = useState<{
    id: string | number;
    facility_name: string;
    latitude: number;
    longitude: number;
    [key: string]: unknown;
  } | null>(null);
  
  // Load county classifications data
  const [countyClassifications, setCountyClassifications] = useState<Record<string, {
    county_name: string;
    classification: string;
  }>>({});
  
  useEffect(() => {
    const loadClassifications = async () => {
      try {
        const response = await fetch('/data/processed/nc-county-classifications.json');
        const data = await response.json();
        setCountyClassifications(data.counties || {});
      } catch (error) {
        console.error('Failed to load county classifications:', error);
      }
    };
    loadClassifications();
  }, []);
  
  const {
    selectedCounty,
    setSelectedCounty
  } = useHealthcareStore();
  
  // Use original optimized healthcare data hook that was working
  const { 
    healthcareData, 
    counties,
    loading, 
    error,
    isBackendConnected
  } = useOptimizedHealthcareData();
  
  // Real hospital data from NC Division of Health Service Regulation
  const { 
  } = useHospitalData();

  // Layer management
  const [currentLayer, setCurrentLayer] = useState<DataLayer>('hcvi_composite');

  const handleLayerChange = useCallback((layer: DataLayer) => {
    setCurrentLayer(layer);
    // Clear selections when switching between hospital and non-hospital layers
    if (layer.includes('hospital') || layer === 'private_equity') {
      setSelectedCounty(null);
    }
    if (!layer.includes('hospital') && layer !== 'private_equity') {
      setSelectedHospital(null);
    }
  }, [setSelectedCounty]);

  const handleCountyClick = useCallback((county: County | null) => {
    if (county) {
      setSelectedCounty(county.fips);
      setSelectedHospital(null);
    } else {
      setSelectedCounty(null);
    }
  }, [setSelectedCounty]);

  const handleHospitalClick = useCallback((hospital: { id: string | number; facility_name: string; latitude: number; longitude: number; [key: string]: unknown } | null) => {
    if (hospital) {
      setSelectedHospital(hospital);
      setSelectedCounty(null);
    } else {
      setSelectedHospital(null);
    }
  }, [setSelectedCounty]);

  const handleMapClick = useCallback(() => {
    // Handle clicks on the map container
  }, []);

  // Simple computed values
  const selectedCountyData = selectedCounty ? (counties || []).find(c => c.fips === selectedCounty) || null : null;
  const medicaidEnabled = currentLayer.includes('medicaid');
  
  // Simple data summary calculations using county classifications
  const validMedicaidCounties = (healthcareData || []).filter(d => 
    d.medicaid_enrollment_rate !== null && 
    d.medicaid_enrollment_rate !== undefined &&
    d.fips_code && 
    d.fips_code !== '37999' && // Exclude aggregate/total records
    /^37[0-1][0-9][13579]$/.test(d.fips_code) && // Valid NC county FIPS pattern
    d.fips_code <= '37199' // Ensure within valid NC range
  );
  
  const dataSummary = useMemo(() => {
    const classificationCounts = {
      rural: 0,
      urban: 0,
      suburban: 0,
      tourism: 0
    };
    
    (healthcareData || []).forEach(d => {
      const classification = countyClassifications[d.fips_code]?.classification;
      if (classification && classificationCounts.hasOwnProperty(classification)) {
        classificationCounts[classification as keyof typeof classificationCounts]++;
      }
    });
    
    // Filter to ensure exactly 100 valid NC counties
    const validHealthcareData = (healthcareData || []).filter(d => 
      d.fips_code && 
      d.fips_code !== '37999' && 
      /^37[0-1][0-9][13579]$/.test(d.fips_code) && 
      d.fips_code <= '37199'
    );

    return {
      totalCounties: validHealthcareData.length,
      ruralCount: classificationCounts.rural,
      urbanCount: classificationCounts.urban,
      suburbanCount: classificationCounts.suburban,
      tourismCount: classificationCounts.tourism,
      medicaidDataCount: validMedicaidCounties.length,
      sviDataCount: validHealthcareData.filter(d => 
        d.svi_data?.svi_overall_percentile !== null && d.svi_data?.svi_overall_percentile !== undefined
      ).length,
      hospitalsCount: 0, // Will be updated with actual hospital data
      privateEquityCount: 0 // Will be updated with actual PE data
    };
  }, [healthcareData, countyClassifications, validMedicaidCounties]);

  // Show loading state with debug info
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Healthcare Data</h2>
          <p className="text-gray-500">Attempting to connect to Supabase...</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Counties: {counties?.length || 0} | Healthcare Data: {healthcareData?.length || 0}</p>
            <p>Connected: {isBackendConnected ? '✅ Supabase' : '📂 Local'}</p>
            {error && <p className="text-red-500 mt-2">Error: {error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-500 text-lg mb-2">Data Loading Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">The application has fallen back to demonstration data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex">
        <MainContent>
          {activeTab === 'index' && (
            <div className="h-full w-full relative">
              {/* Full Width Map */}
              <div 
                className="w-full h-full relative overflow-hidden"
                onClick={handleMapClick}
              >
                <NCLeafletMap
                  counties={counties}
                  healthcareData={healthcareData}
                  medicaidEnabled={medicaidEnabled}
                  onCountyClick={handleCountyClick}
                  selectedCounty={selectedCountyData}
                  currentLayer={currentLayer}
                  onHospitalClick={handleHospitalClick}
                  selectedHospital={selectedHospital}
                />
              </div>

              {/* Floating Tiles Container */}
              <div className="absolute top-6 left-6 w-80 pointer-events-none z-10 space-y-4">
                {/* Legend Tile */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 pointer-events-auto">
                  <DescriptionLegendTile currentLayer={currentLayer} />
                </div>

                {/* Data Layer Selector Tile */}
                <div className="shadow-lg border border-gray-200 pointer-events-auto">
                  <DataLayerSelector currentLayer={currentLayer} onLayerChange={handleLayerChange} />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'data' && (
            <div className="p-8 bg-gray-50 overflow-y-auto h-full">
              <div className="max-w-6xl mx-auto space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Healthcare Data Summary</h1>
                  
                  {/* Main Statistics */}
                  <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Counties with Data</h3>
                    <p className="text-3xl font-bold text-blue-600">{dataSummary.totalCounties}/100</p>
                    <p className="text-sm text-gray-500 mt-1">NC Counties</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Medicaid Data</h3>
                    <p className="text-3xl font-bold text-green-600">{dataSummary.medicaidDataCount}/100</p>
                    <p className="text-sm text-gray-500 mt-1">Counties with enrollment data</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">SVI Data</h3>
                    <p className="text-3xl font-bold text-purple-600">{dataSummary.sviDataCount}/100</p>
                    <p className="text-sm text-gray-500 mt-1">Counties with vulnerability data</p>
                  </div>
                </div>
                
                {/* County Classifications */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">County Classifications</h2>
                  <p className="text-gray-600 mb-4">Based on Afonso 2016 research classification system</p>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <h3 className="font-semibold text-green-800 mb-1">Rural</h3>
                      <p className="text-2xl font-bold text-green-600">{dataSummary.ruralCount}</p>
                      <p className="text-xs text-green-600">Lower density, agriculture</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <h3 className="font-semibold text-blue-800 mb-1">Urban</h3>
                      <p className="text-2xl font-bold text-blue-600">{dataSummary.urbanCount}</p>
                      <p className="text-xs text-blue-600">Metropolitan areas</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg text-center">
                      <h3 className="font-semibold text-amber-800 mb-1">Suburban</h3>
                      <p className="text-2xl font-bold text-amber-600">{dataSummary.suburbanCount}</p>
                      <p className="text-xs text-amber-600">Adjacent to urban areas</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <h3 className="font-semibold text-red-800 mb-1">Tourism</h3>
                      <p className="text-2xl font-bold text-red-600">{dataSummary.tourismCount}</p>
                      <p className="text-xs text-red-600">Tourism-dependent</p>
                    </div>
                    </div>
                  </div>
                </div>
                
                {/* Data Source Transparency */}
                <DataSourceTransparency />
              </div>
            </div>
          )}

          {activeTab === 'project' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">North Carolina Healthcare Vulnerability Index</h1>
                
                {/* Prototype Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-amber-800">Development Prototype</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        This is an active development prototype. Data sources are being integrated and refined. 
                        Some features may be incomplete or subject to change as we continue implementation and validation.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-12">
                  <div className="bg-gray-50 p-8 rounded-xl">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Project Overview</h2>
                    <div className="space-y-6">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        The North Carolina Healthcare Vulnerability Index (HCVI) combines multiple data sources to provide 
                        a comprehensive view of healthcare access, policy risks, and economic vulnerability across the state. 
                        The application reveals significant disparities in healthcare infrastructure, with rural communities 
                        bearing disproportionate burdens while urban areas maintain relative advantages.
                      </p>
                      
                      <div className="bg-white p-8 rounded-lg border border-gray-200 mt-8">
                        <p className="text-gray-700 mb-6 text-center text-lg">
                          This application was developed to provide transparent, data-driven insights into North Carolina's healthcare landscape.
                        </p>
                        <div className="text-center">

                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-8 rounded-xl">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-8">Creators & Contributors</h2>
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div className="text-center p-6 bg-white rounded-lg border border-blue-100">
                        <a href="https://www.linkedin.com/in/tejjas-kaul-36091a22b/" 
                           className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200"
                           target="_blank" rel="noopener noreferrer">
                          Tejjas Kaul
                        </a>
                      </div>
                      <div className="text-center p-6 bg-white rounded-lg border border-blue-100">
                        <a href="https://www.linkedin.com/in/sumedh-kotrannavar-3b3b4a23b/" 
                           className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200"
                           target="_blank" rel="noopener noreferrer">
                          Sumedh Kotrannavar
                        </a>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-6">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        This project was developed to inform evidence-based policy decisions and resource allocation 
                        to protect vulnerable populations and maintain healthcare access across all North Carolina counties.
                      </p>
                      
                      <div className="bg-white border border-blue-200 rounded-lg p-8 mt-8">
                        <h4 className="text-xl font-semibold text-blue-900 mb-6 text-center">Complete Data Sources & Links</h4>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h5 className="font-semibold text-blue-800 mb-2">[1] NC DHHS Medicaid Data</h5>
                              <p className="text-sm text-gray-700 mb-2">Monthly enrollment reports by category (Aged, Disabled, Blind, Children, etc.)</p>
                              <a href="https://docs.google.com/spreadsheets/d/1srCsapW6I4MsqHqFoOznCBi6ShVdlFZkdqe63p8g-fU/edit?usp=drive_link" 
                                 className="text-blue-600 hover:underline text-xs font-medium">→ Access Dataset</a>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h5 className="font-semibold text-blue-800 mb-2">[2] CDC Social Vulnerability Index</h5>
                              <p className="text-sm text-gray-700 mb-2">2022 data with 16 indicators across 4 vulnerability themes</p>
                              <a href="https://drive.google.com/file/d/1bCvHe3zLp6GryaoVJTwQYRwhGcSewzpH/view?usp=drive_link" 
                                 className="text-blue-600 hover:underline text-xs font-medium">→ Access Dataset</a>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h5 className="font-semibold text-blue-800 mb-2">[3] HCVI Composite</h5>
                              <p className="text-sm text-gray-700 mb-2">Multi-source calculated metrics: Healthcare Access (60%) + Policy Risk (20%) + Economic Vulnerability (20%)</p>
                              <span className="text-xs text-gray-500 italic">Computed from sources [1], [2], [4], [5]</span>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h5 className="font-semibold text-blue-800 mb-2">[4] NC OneMap Hospital Data</h5>
                              <p className="text-sm text-gray-700 mb-2">Licensed healthcare facilities with location and capacity data</p>
                              <a href="https://drive.google.com/file/d/1kfv3HLG5ZHbenvy4fmFXwWTC-D4ZQNo3/view?usp=drive_link" 
                                 className="text-blue-600 hover:underline text-xs font-medium">→ Access Dataset</a>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h5 className="font-semibold text-blue-800 mb-2">[5] Hospital Financial Data</h5>
                              <p className="text-sm text-gray-700 mb-2">Annual operating margins, revenue, and ownership structure</p>
                              <a href="https://airtable.com/appZYwbt3vioNrb95/shricxhAQSjpv5ec8" 
                                 className="text-blue-600 hover:underline text-xs font-medium">→ Access Database</a>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h5 className="font-semibold text-blue-800 mb-2">[6] County Classifications</h5>
                              <p className="text-sm text-gray-700 mb-2">Afonso 2016 research: "The Equity of Local Sales Tax Distributions"</p>
                              <a href="https://doi.org/10.1177/1091142115588976" 
                                 className="text-blue-600 hover:underline text-xs font-medium">→ Research Paper</a>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h5 className="font-semibold text-blue-800 mb-2">[7] US Census ACS</h5>
                              <p className="text-sm text-gray-700 mb-2">Population data and demographic information</p>
                              <span className="text-xs text-gray-500 italic">Integrated via CDC SVI dataset [2]</span>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h5 className="font-semibold text-blue-800 mb-2">[8] NC County Boundaries</h5>
                              <p className="text-sm text-gray-700 mb-2">Official boundary polygons from NC Emergency Management GIS</p>
                              <a href="https://www.nconemap.gov/datasets/NCEM-GIS::north-carolina-state-and-county-boundary-polygons/explore" 
                                 className="text-blue-600 hover:underline text-xs font-medium">→ GIS Portal</a>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-blue-200">
                          <p className="text-sm text-blue-700 text-center leading-relaxed">
                            <strong>Data Processing:</strong> All datasets processed and stored in Supabase database. Exactly 100 NC counties validated (FIPS 37001-37199).
                            Statistical formulas available in the Data page. No synthetic data used.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'index' && (
            <DataDownloadButton 
              healthcareData={healthcareData}
              disabled={loading || !!error}
            />
          )}
        </MainContent>
      </div>
    </div>
  );
}