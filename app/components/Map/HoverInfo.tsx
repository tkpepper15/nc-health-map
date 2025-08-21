'use client';

import React from 'react';
import { HealthcareMetrics } from '../../types/healthcare';

interface HoverInfoProps {
  county: {
    name: string;
    fips: string;
  } | null;
  healthcareData: HealthcareMetrics | null;
  position: { x: number; y: number } | null;
}

export default function HoverInfo({ county, healthcareData, position }: HoverInfoProps) {
  if (!county || !position) {
    return null;
  }

  return (
    <div 
      className="fixed z-50 pointer-events-none bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 text-sm max-w-xs"
      style={{
        left: position.x + 15,
        top: position.y - 10,
        transform: position.x > window.innerWidth - 250 ? 'translateX(-100%)' : 'none'
      }}
    >
      <div className="font-semibold text-gray-900 mb-1">{county.name}</div>
      
      {healthcareData ? (
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {healthcareData.hcvi_composite?.toFixed(1) || 'N/A'}
          </div>
          <div className="text-xs text-gray-600">Vulnerability Index</div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">No data available</div>
      )}
    </div>
  );
}

function getVulnerabilityStyle(category?: string): string {
  switch (category) {
    case 'extreme':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}