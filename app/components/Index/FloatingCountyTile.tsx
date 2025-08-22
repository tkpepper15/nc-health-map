'use client';

import React from 'react';
import { HealthcareMetrics } from '../../types/healthcare';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface FloatingCountyTileProps {
  county: HealthcareMetrics | null;
  onClose: () => void;
  currentLayer: DataLayer;
}

export default function FloatingCountyTile({ county, onClose, currentLayer }: FloatingCountyTileProps) {
  if (!county) return null;

  const getLayerMetric = () => {
    switch (currentLayer) {
      case 'medicaid':
        return {
          label: 'Medicaid Enrollment Rate',
          value: county.medicaid_enrollment_rate ? `${county.medicaid_enrollment_rate.toFixed(1)}%` : 'N/A',
          description: 'Percentage of population enrolled in Medicaid'
        };
      case 'svi':
        return {
          label: 'Social Vulnerability Index',
          value: county.svi_data?.svi_overall_percentile ? `${county.svi_data.svi_overall_percentile.toFixed(0)}th percentile` : 'N/A',
          description: 'Overall social vulnerability ranking'
        };
      case 'hospitals':
        return {
          label: 'Healthcare Access',
          value: county.is_rural ? 'Rural Classification' : 'Urban Classification',
          description: 'Geographic classification affecting healthcare access'
        };
      default:
        return {
          label: 'Healthcare Data',
          value: 'Available',
          description: 'County healthcare information'
        };
    }
  };

  const metric = getLayerMetric();

  return (
    <div className="floating-tile w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3" style={{ 
      position: 'absolute',
      top: '16px', 
      right: '16px',
      zIndex: 1000 
    }}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-900 leading-tight pr-2">
          {county.countyName || 'Unknown County'}
        </h3>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0 text-sm"
          title="Close county details"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Current Layer Metric */}
        <div className="p-2.5 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-900">{metric.label}</span>
          </div>
          <div className="text-lg font-bold text-blue-700 mb-1">
            {metric.value}
          </div>
          <p className="text-xs text-blue-600 leading-tight">
            {metric.description}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm font-semibold text-gray-900">
              {county.population_2020 ? county.population_2020.toLocaleString() : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Population</div>
          </div>
          
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm font-semibold text-gray-900">
              {county.is_rural ? 'Rural' : 'Urban'}
            </div>
            <div className="text-xs text-gray-600">Type</div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-2 text-xs">
          {county.medicaid_enrollment_rate && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Medicaid Enrollment</span>
              <span className="font-medium text-gray-900">
                {county.medicaid_enrollment_rate.toFixed(1)}%
              </span>
            </div>
          )}

          {county.svi_data?.svi_overall_percentile && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Social Vulnerability</span>
              <span className="font-medium text-gray-900">
                {county.svi_data.svi_overall_percentile.toFixed(0)}th percentile
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}