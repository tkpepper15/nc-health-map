'use client';

import React from 'react';
import { HealthcareMetrics } from '../../types/healthcare';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface CountyOverviewTileProps {
  county: HealthcareMetrics | null;
  currentLayer: DataLayer;
  onClose?: () => void;
}

export default function CountyOverviewTile({ county, currentLayer, onClose }: CountyOverviewTileProps) {
  if (!county) return null;

  const getLayerData = () => {
    switch (currentLayer) {
      case 'medicaid':
        return {
          primaryValue: county.medicaid_enrollment_rate ? `${county.medicaid_enrollment_rate.toFixed(1)}%` : 'N/A',
          primaryLabel: 'Medicaid Enrollment',
          secondaryValue: county.population_2020 ? county.population_2020.toLocaleString() : 'N/A',
          secondaryLabel: 'Population',
          tertiaryValue: county.is_rural ? 'Rural' : 'Urban',
          tertiaryLabel: 'Classification',
          color: 'blue'
        };
      case 'svi':
        return {
          primaryValue: county.svi_data?.svi_overall_percentile ? `${county.svi_data.svi_overall_percentile.toFixed(0)}th` : 'N/A',
          primaryLabel: 'SVI Percentile',
          secondaryValue: county.svi_data?.socioeconomic_percentile ? `${county.svi_data.socioeconomic_percentile.toFixed(0)}th` : 'N/A',
          secondaryLabel: 'Socioeconomic',
          tertiaryValue: county.is_rural ? 'Rural' : 'Urban',
          tertiaryLabel: 'Type',
          color: 'amber'
        };
      case 'hospitals':
        return {
          primaryValue: county.is_rural ? 'Rural' : 'Urban',
          primaryLabel: 'Classification',
          secondaryValue: county.population_2020 ? county.population_2020.toLocaleString() : 'N/A',
          secondaryLabel: 'Population',
          tertiaryValue: county.medicaid_enrollment_rate ? `${county.medicaid_enrollment_rate.toFixed(1)}%` : 'N/A',
          tertiaryLabel: 'Medicaid Rate',
          color: 'green'
        };
      default:
        return {
          primaryValue: 'N/A',
          primaryLabel: 'Value',
          secondaryValue: 'N/A', 
          secondaryLabel: 'Data',
          tertiaryValue: 'N/A',
          tertiaryLabel: 'Info',
          color: 'gray'
        };
    }
  };

  const data = getLayerData();
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    green: 'border-green-200 bg-green-50',
    gray: 'border-gray-200 bg-gray-50'
  };

  const primaryColorClasses: Record<string, string> = {
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    green: 'text-green-700',
    gray: 'text-gray-700'
  };

  return (
    <div 
      className="floating-tile w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4"
      style={{ 
        position: 'absolute',
        top: '20px', 
        left: '20px',
        zIndex: 1000 
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {county.countyName || 'Unknown County'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0 text-sm"
            title="Close county details"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className={`p-3 rounded-lg border-2 ${colorClasses[data.color]} mb-3`}>
        <div className={`text-2xl font-bold mb-1 ${primaryColorClasses[data.color]}`}>
          {data.primaryValue}
        </div>
        <div className="text-sm text-gray-600">
          {data.primaryLabel}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-base font-semibold text-gray-900">
            {data.secondaryValue}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {data.secondaryLabel}
          </div>
        </div>
        
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-base font-semibold text-gray-900">
            {data.tertiaryValue}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {data.tertiaryLabel}
          </div>
        </div>
      </div>
    </div>
  );
}