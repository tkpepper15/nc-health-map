'use client';

import { useState, useCallback } from 'react';
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

export default function ClientApp() {
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
    if (layer === 'hospitals') {
      setSelectedCounty(null);
    }
    if (layer !== 'hospitals') {
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
              <FloatingDescriptionTile currentLayer={currentLayer} />
              <DataLayersTile currentLayer={currentLayer} onLayerChange={handleLayerChange} />
              
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
                <p className="text-lg text-gray-700">
                  Interactive mapping tool displaying healthcare data across North Carolina&apos;s counties.
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'data' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Healthcare Data Summary</h1>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Counties with Data</h3>
                    <p className="text-3xl font-bold text-blue-600">{dataSummary.totalCounties}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Medicaid Rate</h3>
                    <p className="text-3xl font-bold text-green-600">{dataSummary.avgMedicaidRate}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Rural Counties</h3>
                    <p className="text-3xl font-bold text-amber-600">{dataSummary.ruralCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'project' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">North Carolina Healthcare Data Viewer</h1>
                <p className="text-lg text-gray-700">
                  This interactive mapping application displays healthcare data across North Carolina counties.
                </p>
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