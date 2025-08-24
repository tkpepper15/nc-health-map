'use client';

/**
 * Map Legend Component
 * Displays legend for the current data layer
 */

import React from 'react';
import { MapLegendProps } from './types';

export default function MapLegend({
  selectedMetric,
  position = 'bottom-right',
  className = ''
}: MapLegendProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const getLegendItems = () => {
    switch (selectedMetric.id) {
      case 'hcvi':
        return [
          { color: '#22c55e', label: 'Low (1-3)', range: '1.0-3.0' },
          { color: '#f59e0b', label: 'Moderate (4-5)', range: '3.1-5.0' },
          { color: '#ef4444', label: 'High (6-7)', range: '5.1-7.0' },
          { color: '#dc2626', label: 'Extreme (8-10)', range: '7.1-10.0' },
        ];
      case 'medicaid':
        return [
          { color: '#22c55e', label: 'Low (<20%)', range: '<20%' },
          { color: '#f59e0b', label: 'Moderate (20-30%)', range: '20-30%' },
          { color: '#ef4444', label: 'High (30-40%)', range: '30-40%' },
          { color: '#dc2626', label: 'Very High (>40%)', range: '>40%' },
        ];
      case 'svi':
        return [
          { color: '#22c55e', label: 'Low Vulnerability', range: '0-25th %tile' },
          { color: '#f59e0b', label: 'Moderate', range: '25-50th %tile' },
          { color: '#ef4444', label: 'High', range: '50-75th %tile' },
          { color: '#dc2626', label: 'Very High', range: '75-100th %tile' },
        ];
      default:
        return [
          { color: '#e5e7eb', label: 'No Data', range: 'N/A' }
        ];
    }
  };

  const legendItems = getLegendItems();

  return (
    <div className={`${getPositionClasses()} ${className} bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]`}>
      <h4 className="font-semibold text-gray-900 mb-3 text-sm">
        {selectedMetric.name}
      </h4>
      
      <div className="space-y-2">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 truncate">
                {item.label}
              </div>
              <div className="text-xs text-gray-500">
                {item.range}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedMetric.description && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 leading-relaxed">
            {selectedMetric.description}
          </p>
        </div>
      )}
    </div>
  );
}