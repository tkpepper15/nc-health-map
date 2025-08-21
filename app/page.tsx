'use client';

import { useState } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MainContent from './components/Layout/MainContent';
import NCLeafletMap from './components/Map/NCLeafletMap';
import DataLayerSelector from './components/DataLayers/DataLayerSelector';
import DataLayerDescription from './components/DataLayers/DataLayerDescription';
import MetricsPanel from './components/DataLayers/MetricsPanel';
import DataSourceIndicator from './components/UI/DataSourceIndicator';
import { useHealthcareStore } from './utils/store';
import { useOptimizedHealthcareData } from './hooks/useOptimizedHealthcareData';
import { useUnifiedHospitalData } from './hooks/useUnifiedHospitalData';
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
  
  // Use unified hospital data
  const { 
    hospitals, 
    loading: hospitalsLoading,
    getHospitalStats
  } = useUnifiedHospitalData();

  // Layer management
  const [currentLayer, setCurrentLayer] = useState<'hcvi' | 'medicaid' | 'healthcare-access' | 'policy-risk' | 'economic-vulnerability' | 'svi' | 'hospitals'>('hcvi');

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
                    Welcome to the North Carolina Healthcare Vulnerability Index (HCVI), an interactive tool for 
                    visualizing the complex healthcare landscape across North Carolina's 100 counties.
                  </p>
                  <p className="text-gray-600 mb-6">
                    This application analyzes the impacts of federal healthcare legislation and policy changes 
                    on communities throughout the state, with particular focus on rural healthcare access, 
                    Medicaid dependency, and economic vulnerability.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-blue-900 mb-3">Key Features</h3>
                      <ul className="space-y-2 text-blue-800">
                        <li>• Interactive county-level healthcare vulnerability mapping</li>
                        <li>• Real-time Medicaid enrollment and dependency analysis</li>
                        <li>• Policy risk assessments for federal funding changes</li>
                        <li>• Economic vulnerability indicators for healthcare systems</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-green-900 mb-3">Data Sources</h3>
                      <ul className="space-y-2 text-green-800">
                        <li>• NC DHHS Medicaid enrollment data (June 2025)</li>
                        <li>• U.S. Census demographic and economic indicators</li>
                        <li>• CMS hospital financial data and performance metrics</li>
                        <li>• County health rankings and social determinants</li>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Healthcare Data Overview</h1>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Counties</h3>
                    <p className="text-3xl font-bold text-blue-600">100</p>
                    <p className="text-sm text-gray-600">All NC counties covered</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Medicaid Enrollees</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {healthcareData.reduce((sum, d) => sum + (d.medicaid_total_enrollment || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Statewide total</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">High Risk Counties</h3>
                    <p className="text-3xl font-bold text-red-600">
                      {healthcareData.filter(d => d.vulnerability_category === 'high' || d.vulnerability_category === 'extreme').length}
                    </p>
                    <p className="text-sm text-gray-600">HCVI score ≥ 6.5</p>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">County Vulnerability Distribution</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-100 rounded">
                      <div className="text-2xl font-bold text-green-700">
                        {healthcareData.filter(d => d.vulnerability_category === 'low').length}
                      </div>
                      <div className="text-sm text-green-600">Low Risk</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-100 rounded">
                      <div className="text-2xl font-bold text-yellow-700">
                        {healthcareData.filter(d => d.vulnerability_category === 'moderate').length}
                      </div>
                      <div className="text-sm text-yellow-600">Moderate Risk</div>
                    </div>
                    <div className="text-center p-4 bg-orange-100 rounded">
                      <div className="text-2xl font-bold text-orange-700">
                        {healthcareData.filter(d => d.vulnerability_category === 'high').length}
                      </div>
                      <div className="text-sm text-orange-600">High Risk</div>
                    </div>
                    <div className="text-center p-4 bg-red-100 rounded">
                      <div className="text-2xl font-bold text-red-700">
                        {healthcareData.filter(d => d.vulnerability_category === 'extreme').length}
                      </div>
                      <div className="text-sm text-red-600">Extreme Risk</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'project' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">About This Project</h1>
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 mb-4">
                    The North Carolina Healthcare Vulnerability Index (HCVI) was developed to provide 
                    evidence-based insights into how federal policy changes affect healthcare access 
                    and delivery across the state.
                  </p>
                  
                  <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Methodology</h2>
                  <p className="text-gray-700 mb-4">
                    The HCVI combines multiple data sources and indicators to create a composite score 
                    for each county, weighted across three primary domains:
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6 my-8">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Healthcare Access (33%)</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Provider density</li>
                        <li>• Hospital access</li>
                        <li>• Insurance coverage</li>
                        <li>• Specialty services</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-orange-900 mb-2">Policy Risk (33%)</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Medicaid dependency</li>
                        <li>• Federal funding reliance</li>
                        <li>• SNAP vulnerability</li>
                        <li>• Work requirement impact</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-red-900 mb-2">Economic Vulnerability (34%)</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Hospital financial health</li>
                        <li>• Private equity exposure</li>
                        <li>• Healthcare employment</li>
                        <li>• Social determinants</li>
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
