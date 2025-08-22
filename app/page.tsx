'use client';

import { useState } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MainContent from './components/Layout/MainContent';
import NCLeafletMap from './components/Map/NCLeafletMap';
import DataLayerSelector, { DataLayer } from './components/DataLayers/DataLayerSelector';
import DataLayerDescription from './components/DataLayers/DataLayerDescription';
import MetricsPanel from './components/DataLayers/MetricsPanel';
import DataSourceIndicator from './components/UI/DataSourceIndicator';
import { useHealthcareStore } from './utils/store';
import { useOptimizedHealthcareData } from './hooks/useOptimizedHealthcareData';
import { useHospitalData } from './hooks/useHospitalData';
import { County } from './types/healthcare';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'index' | 'data' | 'project'>('index');
  const [medicaidEnabled, setMedicaidEnabled] = useState<boolean>(true);
  const [forceLocalData, setForceLocalData] = useState<boolean>(false);
  
  const {
    selectedCounty,
    sidebarOpen,
    setSelectedCounty,
    toggleSidebar,
    setSidebarOpen
  } = useHealthcareStore();

  // Handle data source toggle
  const handleDataSourceToggle = () => {
    setForceLocalData(!forceLocalData);
    // Trigger data refresh with the toggled source
    if (refresh) {
      refresh();
    }
    console.log('Toggled data source to:', forceLocalData ? 'Supabase' : 'Local');
  };

  // Use original optimized healthcare data hook that was working
  const { 
    healthcareData, 
    counties, 
    loading, 
    error,
    lastUpdated,
    isBackendConnected,
    getCountyDetails,
    refresh 
  } = useOptimizedHealthcareData();
  
  // Real hospital data from NC Division of Health Service Regulation
  const { 
    hospitals, 
    loading: hospitalsLoading,
    getHospitalStats
  } = useHospitalData();

  // Layer management
  const [currentLayer, setCurrentLayer] = useState<DataLayer>('medicaid');

  const handleMedicaidToggle = (enabled: boolean) => {
    setMedicaidEnabled(enabled);
  };

  const handleCountyClick = (county: County | null) => {
    if (county) {
      setSelectedCounty(county.fips);
    } else {
      setSelectedCounty(null);
    }
  };

  const selectedCountyData = selectedCounty ? counties.find(c => c.fips === selectedCounty) || null : null;
  const selectedHealthcareData = selectedCounty ? healthcareData.find(h => h.fips_code === selectedCounty) || null : null;

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex">
        <Sidebar
          medicaidEnabled={medicaidEnabled}
          onMedicaidToggle={handleMedicaidToggle}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          selectedCounty={selectedHealthcareData}
          healthcareData={healthcareData}
          onCountyDeselect={() => setSelectedCounty(null)}
          currentLayer={currentLayer}
          layerStats={getHospitalStats()}
          hospitalsLoading={hospitalsLoading}
          dataSource={{
            source: isBackendConnected ? 'supabase' : 'local',
            lastUpdated: lastUpdated,
            error: error || undefined
          }}
        />
        
        <MainContent
          sidebarOpen={sidebarOpen}
          onSidebarToggle={toggleSidebar}
        >
          {activeTab === 'index' && (
            <>
              {/* Data Layer Description */}
              <DataLayerDescription currentLayer={currentLayer} />
              
              {/* Main Map Container */}
              <div className="relative flex-1">
                {/* Data Layer Selector */}
                <DataLayerSelector 
                  currentLayer={currentLayer} 
                  onLayerChange={setCurrentLayer} 
                />
                
                {/* Map Component */}
                <NCLeafletMap
                  counties={counties}
                  healthcareData={healthcareData}
                  medicaidEnabled={medicaidEnabled}
                  onCountyClick={handleCountyClick}
                  selectedCounty={selectedCountyData}
                  currentLayer={currentLayer}
                />
              </div>
            </>
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
                    data across North Carolina's 100 counties.
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
                    <p className="text-3xl font-bold text-blue-600">{healthcareData.length}</p>
                    <p className="text-sm text-gray-600">North Carolina counties</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Medicaid Rate</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {(() => {
                        const validCounties = healthcareData.filter(d => d.medicaid_enrollment_rate !== null && d.medicaid_enrollment_rate !== undefined);
                        return validCounties.length > 0 ? 
                          (validCounties.reduce((sum, d) => sum + (d.medicaid_enrollment_rate || 0), 0) / validCounties.length).toFixed(1) + '%'
                          : 'N/A';
                      })()}
                    </p>
                    <p className="text-sm text-gray-600">Across all counties</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Rural Counties</h3>
                    <p className="text-3xl font-bold text-amber-600">
                      {healthcareData.filter(d => d.is_rural).length}
                    </p>
                    <p className="text-sm text-gray-600">Classified as rural</p>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Availability Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-100 rounded">
                      <div className="text-2xl font-bold text-green-700">
                        {healthcareData.filter(d => d.medicaid_enrollment_rate !== null && d.medicaid_enrollment_rate !== undefined).length}
                      </div>
                      <div className="text-sm text-green-600">Counties with Medicaid Data</div>
                    </div>
                    <div className="text-center p-4 bg-blue-100 rounded">
                      <div className="text-2xl font-bold text-blue-700">
                        {healthcareData.filter(d => d.svi_data?.svi_overall_percentile !== null && d.svi_data?.svi_overall_percentile !== undefined).length}
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
                    North Carolina's 100 counties from state and federal sources.
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
        </MainContent>
      </div>

      {/* Data Source Indicator */}
      <DataSourceIndicator
        source={forceLocalData ? 'local' : (isBackendConnected ? 'supabase' : 'local')}
        lastUpdated={lastUpdated}
        error={error || undefined}
        onSourceToggle={handleDataSourceToggle}
        isToggleable={true}
      />
    </div>
  );
}
