'use client';

import React from 'react';
import { HealthcareMetrics } from '../../types/healthcare';
import { formatMedicaidRate } from '../../utils/medicaidHelpers';
import { useCountyClassifications } from '../../hooks/useCountyClassifications';

interface CountyHoverPanelProps {
  county: HealthcareMetrics | null;
}

export default function CountyHoverPanel({ county }: CountyHoverPanelProps) {
  const { getClassification } = useCountyClassifications();
  if (!county) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="text-center text-gray-500 py-8">
          <div className="text-lg font-medium mb-2">Hover over a county</div>
          <div className="text-sm">to see Medicaid enrollment and SVI data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-blue-900">{county.countyName} County</h3>
        <div className="text-sm text-blue-700 mt-1">
          FIPS: {county.fips_code} | {getClassification(county.fips_code)} County
        </div>
      </div>

      {/* Quick Overview */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Medicaid Enrollment Rate</span>
          <span className="text-lg font-bold text-blue-600">
            {formatMedicaidRate(county.medicaid_enrollment_rate)}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          {county.medicaid_total_enrollment?.toLocaleString() || 'N/A'} total enrolled
        </div>
      </div>

      {/* HCVI Composite Scores */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">🏥 Healthcare Vulnerability Index</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-red-50 rounded border">
            <div className="text-lg font-bold text-red-700">
              {county.hcvi_composite?.toFixed(1) || 'N/A'}
            </div>
            <div className="text-xs text-red-600">HCVI Score</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded border">
            <div className="text-sm font-bold text-gray-700">
              {county.vulnerability_category || 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Risk Level</div>
          </div>
        </div>
      </div>

      {/* Medicaid Enrollment - ALL CATEGORIES FROM SCHEMA */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">📊 Medicaid Enrollment</h4>
        
        <div className="space-y-1 text-sm">
          {/* Total Enrollment */}
          <div className="flex justify-between items-center py-1 px-2 bg-blue-50 rounded">
            <span className="font-medium text-blue-900">Total:</span>
            <span className="font-bold text-blue-700">
              {county.medicaid_total_enrollment?.toLocaleString() || 'N/A'}
            </span>
          </div>
          
          {/* All Individual Categories */}
          <div className="grid grid-cols-1 gap-1 mt-2">
            <div className="flex justify-between items-center py-1 px-2 bg-green-50 rounded">
              <span className="text-xs text-green-800">Aged (65+):</span>
              <span className="text-xs font-semibold text-green-700">
                {county?.medicaid_aged?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-purple-50 rounded">
              <span className="text-xs text-purple-800">Disabled:</span>
              <span className="text-xs font-semibold text-purple-700">
                {county?.medicaid_disabled?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-amber-50 rounded">
              <span className="text-xs text-amber-800">Blind:</span>
              <span className="text-xs font-semibold text-amber-700">
                {county?.medicaid_blind?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-emerald-50 rounded">
              <span className="text-xs text-emerald-800">Expansion Adults:</span>
              <span className="text-xs font-semibold text-emerald-700">
                {county?.medicaid_expansion_enrollment?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-cyan-50 rounded">
              <span className="text-xs text-cyan-800">Infants & Children:</span>
              <span className="text-xs font-semibold text-cyan-700">
                {county?.medicaid_infants_and_children?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-teal-50 rounded">
              <span className="text-xs text-teal-800">Pregnant Women:</span>
              <span className="text-xs font-semibold text-teal-700">
                {county?.medicaid_pregnant_women?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-indigo-50 rounded">
              <span className="text-xs text-indigo-800">TANF Under 21:</span>
              <span className="text-xs font-semibold text-indigo-700">
                {county?.medicaid_tanf_under_21?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-pink-50 rounded">
              <span className="text-xs text-pink-800">TANF 21+:</span>
              <span className="text-xs font-semibold text-pink-700">
                {county?.medicaid_tanf_21_and_over?.toLocaleString() || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SVI Information - ALL SVI DATA FROM SCHEMA */}
      {county.svi_data ? (
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">🏘️ Social Vulnerability Index</h4>
          
          {/* Overall SVI */}
          <div className="bg-orange-50 p-2 rounded border border-orange-200 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-orange-800">Overall SVI Percentile:</span>
              <span className="text-sm font-bold text-orange-700">
                {county.svi_data.svi_overall_percentile !== null && county.svi_data.svi_overall_percentile !== undefined
                  ? (county.svi_data.svi_overall_percentile * 100).toFixed(0) + '%'
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          {/* SVI Themes */}
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex justify-between items-center py-1 px-2 bg-blue-50 rounded">
              <span className="text-blue-800">Theme 1 - Socioeconomic:</span>
              <span className="font-semibold text-blue-700">
                {county.svi_data.socioeconomic_percentile !== null 
                  ? (county.svi_data.socioeconomic_percentile * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-purple-50 rounded">
              <span className="text-purple-800">Theme 2 - Household:</span>
              <span className="font-semibold text-purple-700">
                {county.svi_data.household_composition_percentile !== null
                  ? (county.svi_data.household_composition_percentile * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-green-50 rounded">
              <span className="text-green-800">Theme 3 - Minority:</span>
              <span className="font-semibold text-green-700">
                {county.svi_data.racial_minority_percentile !== null
                  ? (county.svi_data.racial_minority_percentile * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-amber-50 rounded">
              <span className="text-amber-800">Theme 4 - Housing/Transport:</span>
              <span className="font-semibold text-amber-700">
                {county.svi_data.housing_transport_percentile !== null
                  ? (county.svi_data.housing_transport_percentile * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
          </div>
          
          {/* Key Individual Metrics */}
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between items-center py-1 px-2 bg-red-50 rounded">
              <span className="text-red-800">Poverty 150%:</span>
              <span className="font-semibold text-red-700">
                {county.svi_data.poverty_150_pct ? `${county.svi_data.poverty_150_pct.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-orange-50 rounded">
              <span className="text-orange-800">No Insurance:</span>
              <span className="font-semibold text-orange-700">
                {county.svi_data.no_insurance_pct ? `${county.svi_data.no_insurance_pct.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
              <span className="text-gray-800">Unemployed:</span>
              <span className="font-semibold text-gray-700">
                {county.svi_data.unemployment_pct ? `${county.svi_data.unemployment_pct.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-1 px-2 bg-teal-50 rounded">
              <span className="text-teal-800">Disabled:</span>
              <span className="font-semibold text-teal-700">
                {county.svi_data.disability_pct ? `${county.svi_data.disability_pct.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-gray-100">
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            ⚠️ SVI data not available for this county
          </div>
        </div>
      )}

      {/* HCVI Component Scores */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">🏥 HCVI Component Scores</h4>
        <div className="grid grid-cols-1 gap-1 text-xs">
          <div className="flex justify-between items-center py-1 px-2 bg-blue-50 rounded">
            <span className="text-blue-800">Healthcare Access:</span>
            <span className="font-semibold text-blue-700">
              {county.healthcare_access_score?.toFixed(1) || 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-1 px-2 bg-red-50 rounded">
            <span className="text-red-800">Policy Risk:</span>
            <span className="font-semibold text-red-700">
              {county.policy_risk_score?.toFixed(1) || 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-1 px-2 bg-yellow-50 rounded">
            <span className="text-yellow-800">Economic Vulnerability:</span>
            <span className="font-semibold text-yellow-700">
              {county.economic_vulnerability_score?.toFixed(1) || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          💡 Click county for detailed breakdown
        </div>
      </div>
    </div>
  );
}

// Removed getVulnerabilityStyle function - no longer needed since we use real data only