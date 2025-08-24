'use client';

import { useState, useCallback, useMemo } from 'react';

// Prevent static optimization that causes build issues
export const dynamic = 'force-dynamic';
import Header from './components/Layout/Header';
import MainContent from './components/Layout/MainContent';
import NCLeafletMap from './components/Map/NCLeafletMap';
import FloatingDescriptionTile from './components/Index/FloatingDescriptionTile';
import DataLayersTile from './components/Index/DataLayersTile';
import DataDownloadButton from './components/Index/DataDownloadButton';
import { DataLayer } from './components/DataLayers/DataLayerSelector';
import { useHealthcareStore } from './utils/store';
import { useOptimizedHealthcareData } from './hooks/useOptimizedHealthcareData';
import { useHospitalData } from './hooks/useHospitalData';
import { County } from './types/healthcare';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'index' | 'data' | 'project'>('index');
  const [selectedHospital, setSelectedHospital] = useState<{
    id: string | number;
    facility_name: string;
    latitude: number;
    longitude: number;
    [key: string]: unknown;
  } | null>(null);
  
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
  const [currentLayer, setCurrentLayer] = useState<DataLayer>('medicaid');

  const handleLayerChange = useCallback((layer: DataLayer) => {
    setCurrentLayer(layer);
    // Clear selections when switching to hospital layer
    if (layer === 'hospitals') {
      setSelectedCounty(null);
    }
    // Clear hospital selection when switching away from hospital layer  
    if (layer !== 'hospitals') {
      setSelectedHospital(null);
    }
  }, [setSelectedCounty]);


  const handleCountyClick = useCallback((county: County | null) => {
    if (county) {
      setSelectedCounty(county.fips);
      setSelectedHospital(null); // Clear hospital selection when county is selected
    } else {
      setSelectedCounty(null);
    }
  }, [setSelectedCounty]);

  const handleHospitalClick = useCallback((hospital: { id: string | number; facility_name: string; latitude: number; longitude: number; [key: string]: unknown } | null) => {
    if (hospital) {
      setSelectedHospital(hospital);
      setSelectedCounty(null); // Clear county selection when hospital is selected
    } else {
      setSelectedHospital(null);
    }
  }, [setSelectedCounty]);

  const handleMapClick = useCallback(() => {
    // Handle clicks on the map container
    // This can be used to clear selections or handle other map interactions
  }, []);

  // Simple computed values without useMemo to avoid build issues
  const selectedCountyData = selectedCounty ? counties.find(c => c.fips === selectedCounty) || null : null;
  const medicaidEnabled = currentLayer === 'medicaid';
  
  // Simple data summary calculations
  const validMedicaidCounties = healthcareData.filter(d => 
    d.medicaid_enrollment_rate !== null && d.medicaid_enrollment_rate !== undefined
  );
  const dataSummary = {
    totalCounties: healthcareData.length,
    avgMedicaidRate: validMedicaidCounties.length > 0 ? 
      (validMedicaidCounties.reduce((sum, d) => sum + (d.medicaid_enrollment_rate || 0), 0) / validMedicaidCounties.length).toFixed(1) + '%'
      : 'N/A',
    ruralCount: healthcareData.filter(d => d.is_rural).length,
    medicaidDataCount: validMedicaidCounties.length,
    sviDataCount: healthcareData.filter(d => 
      d.svi_data?.svi_overall_percentile !== null && d.svi_data?.svi_overall_percentile !== undefined
    ).length
  };

  // Show loading state with debug info
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Healthcare Data</h2>
          <p className="text-gray-500">Attempting to connect to Supabase...</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Counties: {counties.length} | Healthcare Data: {healthcareData.length}</p>
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
            <div 
              className="relative h-full w-full overflow-hidden"
              onClick={handleMapClick}
            >
              {/* Floating Tiles */}
              
              {/* Middle Left: Description tile */}
              <FloatingDescriptionTile currentLayer={currentLayer} />
              
              {/* Bottom Left: Data Layers selector */}
              <DataLayersTile currentLayer={currentLayer} onLayerChange={handleLayerChange} />
              
              {/* Full Screen Map */}
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
          )}
          
          {activeTab === 'home' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  North Carolina Healthcare Vulnerability Index
                </h1>
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 mb-4">
                    North Carolina Healthcare Data Viewer - an interactive mapping tool displaying real healthcare 
                    data across North Carolina&apos;s 100 counties.
                  </p>
                  <p className="text-gray-600 mb-6">
                    Currently showing verified data from state and federal sources including Medicaid enrollment 
                    rates, social vulnerability indicators, and hospital infrastructure.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-blue-900 mb-3">Available Data</h3>
                      <ul className="space-y-2 text-blue-800">
                        <li>• County-level Medicaid enrollment rates</li>
                        <li>• CDC Social Vulnerability Index (SVI) percentiles</li>
                        <li>• Hospital facility locations and capacity</li>
                        <li>• Population and rural/urban classification</li>
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-amber-900 mb-3">Data Sources</h3>
                      <ul className="space-y-2 text-amber-800">
                        <li>• NC Medicaid enrollment databases</li>
                        <li>• CDC Social Vulnerability Index</li>
                        <li>• NC hospital licensing data</li>
                        <li>• U.S. Census population data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'data' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Real Healthcare Data Summary</h1>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Counties with Data</h3>
                    <p className="text-3xl font-bold text-blue-600">{dataSummary.totalCounties}</p>
                    <p className="text-sm text-gray-600">North Carolina counties</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Medicaid Rate</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {dataSummary.avgMedicaidRate}
                    </p>
                    <p className="text-sm text-gray-600">Across all counties</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Rural Counties</h3>
                    <p className="text-3xl font-bold text-amber-600">
                      {dataSummary.ruralCount}
                    </p>
                    <p className="text-sm text-gray-600">Classified as rural</p>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Availability Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-100 rounded">
                      <div className="text-2xl font-bold text-green-700">
                        {dataSummary.medicaidDataCount}
                      </div>
                      <div className="text-sm text-green-600">Counties with Medicaid Data</div>
                    </div>
                    <div className="text-center p-4 bg-blue-100 rounded">
                      <div className="text-2xl font-bold text-blue-700">
                        {dataSummary.sviDataCount}
                      </div>
                      <div className="text-sm text-blue-600">Counties with SVI Data</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'project' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">North Carolina Healthcare Data Viewer</h1>
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 mb-4">
                    This interactive mapping application displays verified healthcare data across 
                    North Carolina&apos;s 100 counties from state and federal sources.
                  </p>
                  
                  <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Current Data Sources</h2>
                  <div className="grid md:grid-cols-2 gap-6 my-8">
                    <div className="border rounded-lg p-6">
                      <h3 className="font-semibold text-blue-900 mb-3">✅ Available Data</h3>
                      <ul className="text-sm text-gray-700 space-y-2">
                        <li>• <strong>Medicaid Enrollment:</strong> County-level enrollment rates</li>
                        <li>• <strong>Social Vulnerability:</strong> CDC SVI percentiles</li>
                        <li>• <strong>Hospital Infrastructure:</strong> 163 licensed facilities</li>
                        <li>• <strong>Demographics:</strong> Population and rural classification</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="font-semibold text-amber-900 mb-3">🚧 Future Development</h3>
                      <ul className="text-sm text-gray-700 space-y-2">
                        <li>• Healthcare access metrics</li>
                        <li>• Policy impact assessments</li>
                        <li>• Economic vulnerability indicators</li>
                        <li>• Composite risk scoring</li>
                      </ul>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Key Findings</h2>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Rural counties consistently show higher vulnerability scores than urban areas</li>
                    <li>Medicaid expansion has significantly reduced uninsured rates in participating areas</li>
                    <li>Hospital closures create healthcare deserts affecting multiple counties</li>
                    <li>Economic vulnerability patterns correlate with social determinants of health</li>
                  </ul>
                  
                  <div className="bg-blue-50 p-6 rounded-lg mt-8">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Data Sources & Updates</h3>
                    <p className="text-blue-800 text-sm">
                      This visualization uses the most recent available data from NC DHHS, U.S. Census Bureau, 
                      CMS, and County Health Rankings. Data is updated quarterly to reflect changing conditions 
                      and policy implementations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Data Download Button - only show on index tab */}
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
