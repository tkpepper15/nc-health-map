'use client';

import { HealthcareMetrics } from '../../types/healthcare';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface CountyDetailPanelProps {
  county: HealthcareMetrics | null;
  onClose: () => void;
  currentLayer?: DataLayer;
}

export default function CountyDetailPanel({ county, onClose, currentLayer = 'medicaid' }: CountyDetailPanelProps) {
  if (!county) return null;

  // Render primary data based on current layer
  const renderPrimaryLayerData = (county: HealthcareMetrics, layer: DataLayer) => {
    switch (layer) {
      case 'medicaid':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Medicaid Enrollment (June 2025)
            </h3>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">Total Enrolled</span>
                <span className="text-2xl font-bold text-blue-700">
                  {county.medicaid_total_enrollment?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <div className="text-xs text-blue-600">
                {county.medicaid_enrollment_rate ? `${county.medicaid_enrollment_rate.toFixed(1)}% of county population` : 'Rate not available'}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between p-3 bg-white rounded border">
                <span className="text-gray-600">Medicaid Expansion:</span>
                <span className="font-semibold text-gray-500">
                  -- (breakdown not available)
                </span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded border">
                <span className="text-gray-600">Traditional Medicaid:</span>
                <span className="font-medium text-gray-500">
                  -- (breakdown not available)
                </span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded border">
                <span className="text-gray-600">Dependency Ratio:</span>
                <span className="font-medium text-gray-700">
                  {county.medicaid_dependency_ratio ? county.medicaid_dependency_ratio.toFixed(3) : '--'}
                </span>
              </div>
            </div>
          </>
        );
      case 'svi':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
              Social Vulnerability Index (2022)
            </h3>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-orange-900">Overall SVI Percentile</span>
                <span className="text-3xl font-bold text-orange-700">
                  {county.svi_data?.svi_overall_percentile !== null && county.svi_data?.svi_overall_percentile !== undefined
                    ? (county.svi_data.svi_overall_percentile * 100).toFixed(0) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="text-xs text-orange-600">
                Higher percentiles indicate greater vulnerability
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between p-3 bg-blue-50 rounded border">
                <span className="text-blue-800 font-medium">Socioeconomic Status:</span>
                <span className="font-bold text-blue-700">
                  {county.svi_data?.socioeconomic_percentile !== null && county.svi_data?.socioeconomic_percentile !== undefined
                    ? (county.svi_data.socioeconomic_percentile * 100).toFixed(0) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between p-3 bg-purple-50 rounded border">
                <span className="text-purple-800 font-medium">Household Composition:</span>
                <span className="font-bold text-purple-700">
                  {county.svi_data?.household_composition_percentile !== null && county.svi_data?.household_composition_percentile !== undefined
                    ? (county.svi_data.household_composition_percentile * 100).toFixed(0) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </>
        );
      case 'hospitals':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
              Hospital Infrastructure
            </h3>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 mb-4">
              <div className="text-sm text-indigo-800 mb-2">
                Healthcare facility and infrastructure data
              </div>
              <div className="text-xs text-indigo-600">
                Hospital locations and capacity information displayed on map
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 mb-6 relative z-50 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white border-b border-gray-200 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{county.countyName}</h2>
          <p className="text-sm text-gray-500">FIPS: {county.fips_code}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
          title="Close details"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Basic Demographics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {county.population_2020?.toLocaleString() || 'N/A'}
          </div>
          <div className="text-xs text-gray-600">Population (2020)</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {county.is_rural ? 'Rural' : 'Urban'}
          </div>
          <div className="text-xs text-gray-600">Classification</div>
        </div>
      </div>

      {/* Layer-specific primary data */}
      <div className="mb-6">
        {renderPrimaryLayerData(county, currentLayer)}
      </div>

      {/* Data Sources Footer */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div><strong>Data Sources:</strong> NC DHHS, CDC SVI 2022, U.S. Census 2020</div>
          <div className="text-gray-400">Updated: June 2025</div>
        </div>
      </div>
    </div>
  );
}