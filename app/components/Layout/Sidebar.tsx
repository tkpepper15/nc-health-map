'use client';

import { useState } from 'react';
import CountyDetailPanel from '../County/CountyDetailPanel';
import CountyHoverPanel from '../County/CountyHoverPanel';
import DataUpdatePanelFixed from './DataUpdatePanelFixed';
import MetricsPanel from '../DataLayers/MetricsPanel';
import IndexDescriptionCard from '../Index/IndexDescriptionCard';
import LegendSection from '../Index/LegendSection';
import MetricsTree from '../Index/MetricsTree';
import { HealthcareMetrics } from '../../types/healthcare';
import { useHealthcareStore } from '../../utils/store';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface DataSource {
  source: 'supabase' | 'local' | 'fallback';
  lastUpdated: Date | null;
  error?: string;
}

interface SidebarProps {
  medicaidEnabled: boolean;
  onMedicaidToggle: (enabled: boolean) => void;
  isOpen: boolean;
  onToggle: () => void;
  selectedCounty?: HealthcareMetrics | null;
  healthcareData?: HealthcareMetrics[];
  onCountyDeselect?: () => void;
  currentLayer?: DataLayer;
  onLayerChange?: (layer: DataLayer) => void;
  layerStats?: any;
  hospitalsLoading?: boolean;
  dataSource?: DataSource;
}

export default function Sidebar({ 
  medicaidEnabled, 
  onMedicaidToggle, 
  isOpen, 
  onToggle, 
  selectedCounty,
  healthcareData = [],
  onCountyDeselect,
  currentLayer = 'medicaid',
  onLayerChange,
  layerStats,
  hospitalsLoading = false
}: SidebarProps) {
  const { hoveredCounty } = useHealthcareStore();
  const hoveredCountyData = hoveredCounty ? healthcareData.find(h => h.fips_code === hoveredCounty) || null : null;
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        bg-white border-r border-gray-200 enhanced-shadow flex-shrink-0 relative sidebar-transition
        ${isOpen ? 'w-64' : 'w-12'}
        ${isOpen ? 'block' : 'lg:block'}
        lg:relative lg:translate-x-0
        fixed inset-y-0 left-0 z-50 lg:z-40
        lg:pt-0 pt-16 lg:top-0 top-16
      `}>
        {/* Toggle button - always visible */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-4 z-60 bg-white border border-gray-200 rounded-full p-1.5 sidebar-toggle-button enhanced-shadow hover:bg-gray-50"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg 
            className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="h-full flex flex-col">
          {/* Mobile close button */}
          {isOpen && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
              <h2 className="text-lg font-semibold text-gray-900">Controls</h2>
              <button
                onClick={onToggle}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Sidebar content */}
          <div className={`flex-1 overflow-y-auto content-scroll transition-all duration-300 ${isOpen ? 'p-3 space-y-4' : 'p-1'}`}>
            
            {/* Collapsed state - show minimal icons */}
            {!isOpen && (
              <div className="flex flex-col items-center space-y-4 pt-4">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center" title="Healthcare Data">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                {selectedCounty && (
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center" title="County Selected">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </div>
            )}
            
            {/* Expanded content */}
            {isOpen && (
              <>
                {/* Main Index Description Card */}
                <IndexDescriptionCard 
                  title="Healthcare Vulnerability and Access"
                  description="This map presents a combined view of healthcare vulnerability, policy impacts, and care access across North Carolina's 100 counties. The data reveals significant disparities in healthcare infrastructure, Medicaid dependency, and social vulnerability indicators."
                  helpText="Click on different metrics below to explore healthcare data across various dimensions including Medicaid enrollment, social vulnerability, and hospital infrastructure."
                />
                
                {/* Legend */}
                <LegendSection 
                  title="Legend"
                  helpText="What do the colors mean?"
                  items={[
                    { label: 'Healthcare Access', color: '#3b82f6' },
                    { label: 'Policy Risk', color: '#ef4444' },
                    { label: 'Vulnerability', color: '#f59e0b' }
                  ]}
                />
                
                {/* Metrics Tree Navigation */}
                {onLayerChange && (
                  <MetricsTree 
                    currentLayer={currentLayer}
                    onLayerChange={onLayerChange}
                  />
                )}
                
                {/* County Detail Panel - shows when county is selected */}
                {selectedCounty && onCountyDeselect && (
                  <CountyDetailPanel 
                    county={selectedCounty}
                    onClose={onCountyDeselect}
                    currentLayer={currentLayer}
                  />
                )}
                
                {/* County Hover Panel - shows detailed info on hover, hidden when county is selected */}
                {!selectedCounty && (
                  <CountyHoverPanel county={hoveredCountyData} />
                )}
                
                {/* Metrics Panel - Only when no county is selected */}
                {!selectedCounty && (
                  <MetricsPanel 
                    currentLayer={currentLayer}
                    metricsData={layerStats}
                    healthcareData={healthcareData}
                    isLoading={hospitalsLoading && currentLayer === 'hospitals'}
                  />
                )}

                {/* Data Update Panel */}
                <DataUpdatePanelFixed />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}