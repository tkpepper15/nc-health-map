'use client';

import React from 'react';
import { HealthcareMetrics } from '../../types/healthcare';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface FloatingHoverTileProps {
  county: HealthcareMetrics | null;
  currentLayer: DataLayer;
  isClicked?: boolean;
}

export default function FloatingHoverTile({ county, currentLayer, isClicked = false }: FloatingHoverTileProps) {
  if (!county) return null;

  const getLayerMetric = () => {
    switch (currentLayer) {
      case 'medicaid':
        return {
          value: county.medicaid_enrollment_rate ? `${county.medicaid_enrollment_rate.toFixed(1)}%` : 'N/A',
          label: 'Medicaid Enrollment'
        };
      case 'svi':
        return {
          value: county.svi_data?.svi_overall_percentile ? `${county.svi_data.svi_overall_percentile.toFixed(0)}th` : 'N/A',
          label: 'SVI Percentile'
        };
      case 'hospitals':
        return {
          value: county.is_rural ? 'Rural' : 'Urban',
          label: 'Classification'
        };
      default:
        return {
          value: 'N/A',
          label: 'Data'
        };
    }
  };

  const metric = getLayerMetric();
  const position = isClicked ? 'top-6 left-1/2 transform -translate-x-1/2' : 'top-20 left-1/2 transform -translate-x-1/2';

  return (
    <div 
      className={`floating-tile w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 ${position}`}
      style={{ zIndex: 1000 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 leading-tight">
            {county.countyName || 'Unknown County'}
          </h3>
          <div className="flex items-center space-x-4 mt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {metric.value}
              </div>
              <div className="text-xs text-gray-600">{metric.label}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {county.population_2020 ? county.population_2020.toLocaleString() : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">Population</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {county.is_rural ? 'Rural' : 'Urban'}
              </div>
              <div className="text-xs text-gray-600">Type</div>
            </div>
          </div>
        </div>
        
        {isClicked && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Additional quick stats for clicked state */}
      {isClicked && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {county.medicaid_enrollment_rate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Medicaid:</span>
                <span className="font-medium">{county.medicaid_enrollment_rate.toFixed(1)}%</span>
              </div>
            )}
            {county.svi_data?.svi_overall_percentile && (
              <div className="flex justify-between">
                <span className="text-gray-600">SVI:</span>
                <span className="font-medium">{county.svi_data.svi_overall_percentile.toFixed(0)}th</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}