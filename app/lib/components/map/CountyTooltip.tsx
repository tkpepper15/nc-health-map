'use client';

/**
 * County Tooltip Component
 * Displays county information on hover
 */

import React from 'react';
import { CountyTooltipProps } from './types';
import { formatCountyData } from './utils';

export default function CountyTooltip({
  county,
  healthcareData,
  selectedMetric,
  position,
  visible
}: CountyTooltipProps) {
  if (!visible || !county) {
    return null;
  }

  const data = formatCountyData(county, healthcareData, selectedMetric);

  return (
    <div 
      className="absolute z-[2000] bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none max-w-sm"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translate(0, -100%)'
      }}
    >
      <h4 className="font-semibold text-gray-900 mb-1">{data.name}</h4>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{selectedMetric.name}:</span>
          <span className="font-medium text-gray-900">{data.value}</span>
        </div>
        
        {data.category && (
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className={`font-medium capitalize ${
              data.category === 'extreme' ? 'text-red-600' :
              data.category === 'high' ? 'text-orange-600' :
              data.category === 'moderate' ? 'text-yellow-600' :
              data.category === 'low' ? 'text-green-600' :
              'text-gray-600'
            }`}>
              {data.category}
            </span>
          </div>
        )}
        
        {data.additionalInfo?.map((info, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-gray-600">{info.label}:</span>
            <span className="font-medium text-gray-900">{info.value}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">Click to view details</p>
      </div>
    </div>
  );
}