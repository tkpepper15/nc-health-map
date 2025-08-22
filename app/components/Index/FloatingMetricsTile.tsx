'use client';

import React from 'react';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface LayerOption {
  id: string;
  label: string;
  description: string;
  dataLayer: DataLayer;
  icon: string;
}

interface FloatingMetricsTileProps {
  currentLayer: DataLayer;
  onLayerChange: (layer: DataLayer) => void;
}

export default function FloatingMetricsTile({ currentLayer, onLayerChange }: FloatingMetricsTileProps) {
  const dataLayers = [
    {
      id: 'medicaid',
      label: 'Medicaid Enrollment',
      description: 'County enrollment rates and healthcare dependency',
      dataLayer: 'medicaid' as DataLayer,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h1a1 1 0 010 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h1a1 1 0 010 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h1a1 1 0 010 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h1a1 1 0 010 2H4a1 1 0 01-1-1zm6-13a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1H9zm1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'svi', 
      label: 'Social Vulnerability',
      description: 'Community resilience and disaster preparedness',
      dataLayer: 'svi' as DataLayer,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'hospitals',
      label: 'Hospital Infrastructure', 
      description: 'Healthcare facilities and geographic access',
      dataLayer: 'hospitals' as DataLayer,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  const handleLayerClick = (layer: DataLayer) => {
    onLayerChange(layer);
  };

  return (
    <div className="floating-tile w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4" style={{ 
      position: 'absolute',
      top: '340px', 
      left: '20px',
      zIndex: 1000 
    }}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Layers</h3>
      <div className="space-y-1.5">
        {dataLayers.map((layer) => {
          const isActive = layer.dataLayer === currentLayer;
          return (
            <button
              key={layer.id}
              onClick={() => handleLayerClick(layer.dataLayer)}
              className={`
                w-full text-left p-2.5 rounded-lg border transition-all duration-200 hover:shadow-md
                ${
                  isActive 
                    ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5 text-gray-500">{layer.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-xs mb-0.5 leading-tight ${
                    isActive ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {layer.label}
                  </div>
                  <p className={`text-xs leading-tight ${
                    isActive ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {layer.description}
                  </p>
                </div>
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}