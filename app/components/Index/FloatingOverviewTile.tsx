'use client';

import React from 'react';
import { HealthcareMetrics } from '../../types/healthcare';
import { DataLayer } from '../DataLayers/DataLayerSelector';
import { formatMedicaidRate } from '../../utils/medicaidHelpers';
import { useCountyClassifications } from '../../hooks/useCountyClassifications';

interface FloatingOverviewTileProps {
  county: HealthcareMetrics | null;
  currentLayer: DataLayer;
  position: { x: number; y: number } | null;
  isFixed?: boolean;
}

export default function FloatingOverviewTile({
 county, currentLayer, position, isFixed = false }: FloatingOverviewTileProps) {
  const { getClassification } = useCountyClassifications();
  if (!county) return null;

  const getLayerData = () => {
    switch (currentLayer) {
      case 'medicaid':
        return {
          primaryValue: formatMedicaidRate(county.medicaid_enrollment_rate),
          primaryLabel: 'Medicaid Enrollment',
          secondaryValue: county.population_2020 ? county.population_2020.toLocaleString() : 'N/A',
          secondaryLabel: 'Population',
          tertiaryValue: getClassification(county.fips_code),
          tertiaryLabel: 'Classification',
          color: 'blue'
        };
      case 'svi':
        return {
          primaryValue: county.svi_data?.svi_overall_percentile ? `${county.svi_data.svi_overall_percentile.toFixed(0)}th` : 'N/A',
          primaryLabel: 'SVI Percentile',
          secondaryValue: county.svi_data?.socioeconomic_percentile ? `${county.svi_data.socioeconomic_percentile.toFixed(0)}th` : 'N/A',
          secondaryLabel: 'Socioeconomic',
          tertiaryValue: getClassification(county.fips_code),
          tertiaryLabel: 'Type',
          color: 'amber'
        };
      case 'hospitals':
        return {
          primaryValue: getClassification(county.fips_code),
          primaryLabel: 'Classification',
          secondaryValue: county.population_2020 ? county.population_2020.toLocaleString() : 'N/A',
          secondaryLabel: 'Population',
          tertiaryValue: formatMedicaidRate(county.medicaid_enrollment_rate),
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

  // When pinned (isFixed) show the overview tile in the top-left corner to match other floating tiles
  const positioning = isFixed 
    ? 'top-6 left-6'
    : position 
      ? `fixed`
      : 'hidden';

  const style = !isFixed && position ? {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, -100%)',
    zIndex: 1000
  } : { zIndex: 1000 };

  return (
    <div 
      className={`floating-tile w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-4 ${positioning}`}
      style={style}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {county.countyName || 'Unknown County'}
        </h3>
        
        <div className={`p-3 rounded-lg border-2 ${colorClasses[data.color]} mb-3`}>
          {/* Render horizontally when the tile is pinned to the top-left (isFixed) */}
          {isFixed ? (
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${primaryColorClasses[data.color]}`}>
                {data.primaryValue}
              </div>
              <div className="text-sm text-gray-600 text-right max-w-[60%]">
                {data.primaryLabel}
              </div>
            </div>
          ) : (
            <>
              <div className={`text-2xl font-bold mb-1 ${primaryColorClasses[data.color]}`}>
                {data.primaryValue}
              </div>
              <div className="text-sm text-gray-600">
                {data.primaryLabel}
              </div>
            </>
          )}
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
        
        {isFixed && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Click anywhere to dismiss
            </div>
          </div>
        )}
      </div>
    </div>
  );
}