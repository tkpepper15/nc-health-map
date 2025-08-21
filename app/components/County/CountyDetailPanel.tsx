'use client';

import { HealthcareMetrics } from '../../types/healthcare';
import { getMedicaidDataByCounty } from '../../data/healthcareData';

interface CountyDetailPanelProps {
  county: HealthcareMetrics | null;
  onClose: () => void;
}

export default function CountyDetailPanel({ county, onClose }: CountyDetailPanelProps) {
  if (!county) return null;

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

      {/* Medicaid Enrollment Data - REAL DATA */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          Medicaid Enrollment (June 2025)
        </h3>
        
        {/* Total Enrollment Highlight */}
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

        {/* Enrollment Breakdown */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between p-3 bg-white rounded border">
            <span className="text-gray-600">Medicaid Expansion Enrollment:</span>
            <span className="font-semibold text-green-600">
              {county.medicaid_expansion_enrollment?.toLocaleString() || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between p-3 bg-white rounded border">
            <span className="text-gray-600">Traditional Medicaid:</span>
            <span className="font-medium text-blue-600">
              {county.medicaid_traditional_enrollment?.toLocaleString() || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between p-3 bg-white rounded border">
            <span className="text-gray-600">Dependency Ratio:</span>
            <span className="font-medium text-gray-700">
              {county.medicaid_dependency_ratio?.toFixed(3) || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Social Vulnerability Index - REAL DATA */}
      {county.svi_data ? (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
            Social Vulnerability Index (SVI 2022)
          </h3>

          {/* Overall SVI */}
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-orange-900">Overall SVI Percentile</span>
              <span className="text-2xl font-bold text-orange-700">
                {county.svi_data.svi_overall_percentile !== null && county.svi_data.svi_overall_percentile !== undefined
                  ? (county.svi_data.svi_overall_percentile * 100).toFixed(0) + '%'
                  : 'No Data'
                }
              </span>
            </div>
            <div className="text-xs text-orange-600">
              Higher percentiles indicate greater vulnerability
            </div>
          </div>

          {/* Four SVI Themes */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between p-3 bg-blue-50 rounded border">
              <span className="text-blue-800 font-medium">Theme 1: Socioeconomic Status</span>
              <span className="font-bold text-blue-700">
                {county.svi_data.socioeconomic_percentile !== null && county.svi_data.socioeconomic_percentile !== undefined
                  ? (county.svi_data.socioeconomic_percentile * 100).toFixed(0) + '%'
                  : 'No Data'
                }
              </span>
            </div>
            <div className="flex justify-between p-3 bg-purple-50 rounded border">
              <span className="text-purple-800 font-medium">Theme 2: Household Composition</span>
              <span className="font-bold text-purple-700">
                {county.svi_data.household_composition_percentile !== null && county.svi_data.household_composition_percentile !== undefined
                  ? (county.svi_data.household_composition_percentile * 100).toFixed(0) + '%'
                  : 'No Data'
                }
              </span>
            </div>
            <div className="flex justify-between p-3 bg-indigo-50 rounded border">
              <span className="text-indigo-800 font-medium">Theme 3: Racial/Ethnic Minority Status</span>
              <span className="font-bold text-indigo-700">
                {county.svi_data.racial_minority_percentile !== null && county.svi_data.racial_minority_percentile !== undefined
                  ? (county.svi_data.racial_minority_percentile * 100).toFixed(0) + '%'
                  : 'No Data'
                }
              </span>
            </div>
            <div className="flex justify-between p-3 bg-teal-50 rounded border">
              <span className="text-teal-800 font-medium">Theme 4: Housing & Transportation</span>
              <span className="font-bold text-teal-700">
                {county.svi_data.housing_transport_percentile !== null && county.svi_data.housing_transport_percentile !== undefined
                  ? (county.svi_data.housing_transport_percentile * 100).toFixed(0) + '%'
                  : 'No Data'
                }
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-200 pt-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-600">⚠️ SVI Data Not Available</div>
            <div className="text-xs text-gray-500 mt-1">
              Social Vulnerability Index data not found for this county
            </div>
          </div>
        </div>
      )}

      {/* Data Sources Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div><strong>Medicaid Data:</strong> NC DHHS, June 2025</div>
          <div><strong>SVI Data:</strong> CDC Social Vulnerability Index 2022</div>
          <div><strong>Population:</strong> U.S. Census 2020</div>
        </div>
      </div>
    </div>
  );
}