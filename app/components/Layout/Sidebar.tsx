'use client';

import { useState } from 'react';
import CountyDetailPanel from '../County/CountyDetailPanel';
import CountyHoverPanel from '../County/CountyHoverPanel';
import DataUpdatePanelFixed from './DataUpdatePanelFixed';
import MetricsPanel from '../DataLayers/MetricsPanel';
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
        w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0
        ${isOpen ? 'block' : 'hidden lg:block'}
        lg:relative lg:translate-x-0
        fixed inset-y-0 left-0 z-50 lg:z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:pt-0 pt-16 lg:top-0 top-16
      `}>
        <div className="h-full flex flex-col">
          {/* Mobile close button */}
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

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            
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
            
          </div>
        </div>
      </div>
    </>
  );
}