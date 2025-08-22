'use client';

import React from 'react';

export type DataLayer = 'medicaid' | 'svi' | 'hospitals';

interface DataLayerSelectorProps {
  currentLayer: DataLayer;
  onLayerChange: (layer: DataLayer) => void;
}

export default function DataLayerSelector({ currentLayer, onLayerChange }: DataLayerSelectorProps) {
  const layers = [
    {
      id: 'medicaid' as DataLayer,
      name: 'Medicaid Enrollment',
      icon: '📊',
      description: 'Real enrollment rate data'
    },
    {
      id: 'svi' as DataLayer,
      name: 'Social Vulnerability',
      icon: '🏘️',
      description: 'CDC vulnerability index'
    },
    {
      id: 'hospitals' as DataLayer,
      name: 'Hospital Infrastructure',
      icon: '🏥',
      description: 'Licensed facility locations'
    }
  ];

  return (
    <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Data Layers</h3>
        <p className="text-xs text-gray-500 mt-1">Select view to explore</p>
      </div>
      
      <div className="p-2">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => onLayerChange(layer.id)}
            className={`w-full flex items-start space-x-3 p-3 rounded-md text-left transition-colors ${
              currentLayer === layer.id
                ? 'bg-blue-50 border border-blue-200 text-blue-900'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span className="text-lg">{layer.icon}</span>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${
                currentLayer === layer.id ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {layer.name}
              </div>
              <div className={`text-xs ${
                currentLayer === layer.id ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {layer.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}