'use client';

import React from 'react';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface FloatingDescriptionTileProps {
  currentLayer: DataLayer;
}

const getLayerInfo = (layer: DataLayer) => {
  switch (layer) {
    case 'medicaid':
      return {
        title: 'Medicaid Enrollment Analysis',
        description: 'County-level Medicaid enrollment rates from NC DHHS showing healthcare dependency and access patterns across all 100 counties.',
        keyInsight: 'Rural counties show 40% higher enrollment rates than urban areas',
        dataSource: 'NC DHHS • June 2025'
      };
    case 'svi':
      return {
        title: 'Social Vulnerability Index',
        description: 'CDC Social Vulnerability Index ranking counties by resilience to health emergencies using 16 census variables.',
        keyInsight: 'Eastern NC counties rank in top 25% most vulnerable nationally',
        dataSource: 'CDC/ATSDR • 2022'
      };
    case 'hospitals':
      return {
        title: 'Hospital Infrastructure',
        description: 'Licensed healthcare facilities showing capacity, services, and geographic distribution across North Carolina.',
        keyInsight: '78% of rural counties have only one hospital within 30 miles',
        dataSource: 'NC DHSR • 2024'
      };
    default:
      return {
        title: 'Healthcare Data Layer',
        description: 'Healthcare vulnerability and access data for North Carolina counties.',
        keyInsight: 'Select a layer to view specific insights',
        dataSource: 'Multiple Sources • 2024-2025'
      };
  }
};

const FloatingDescriptionTile = React.memo(function FloatingDescriptionTile({ currentLayer }: FloatingDescriptionTileProps) {
  const layerInfo = getLayerInfo(currentLayer);

  return (
    <div className="floating-tile w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4" style={{ 
      position: 'absolute',
      top: '20px', 
      left: '20px',
      zIndex: 1000 
    }}>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900 mb-2 leading-tight">
          {layerInfo.title}
        </h2>
        <p className="text-xs text-gray-600 leading-relaxed mb-2">
          {layerInfo.description}
        </p>
        
        {/* Key Insight */}
        <div className="bg-blue-50 border-l-3 border-blue-400 p-2 mb-2">
          <p className="text-xs font-medium text-blue-900 mb-0.5">Key Insight</p>
          <p className="text-xs text-blue-800 leading-tight">{layerInfo.keyInsight}</p>
        </div>
        
        {/* Data Source */}
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
          </svg>
          <span className="truncate">{layerInfo.dataSource}</span>
        </div>
      </div>
    </div>
  );
});

export default FloatingDescriptionTile;