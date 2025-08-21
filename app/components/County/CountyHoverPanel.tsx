'use client';

import React from 'react';
import { HealthcareMetrics } from '../../types/healthcare';
import { getMedicaidDataByCounty } from '../../data/healthcareData';

interface CountyHoverPanelProps {
  county: HealthcareMetrics | null;
}

export default function CountyHoverPanel({ county }: CountyHoverPanelProps) {
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
          FIPS: {county.fips_code} | {county.is_rural ? 'Rural' : 'Urban'} County
        </div>
      </div>

      {/* Quick Overview */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Medicaid Enrollment Rate</span>
          <span className="text-lg font-bold text-blue-600">
            {county.medicaid_enrollment_rate?.toFixed(1) || 'N/A'}%
          </span>
        </div>
        <div className="text-xs text-gray-600">
          {county.medicaid_total_enrollment?.toLocaleString() || 'N/A'} total enrolled
        </div>
      </div>

      {/* Medicaid Enrollment Breakdown - REAL DATA */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">📊 Medicaid Details</h4>
        
        <div className="space-y-2 text-sm">
          {/* Total Enrollment */}
          <div className="flex justify-between items-center py-1 border-b border-gray-100">
            <span className="font-medium text-gray-900">Total Enrolled:</span>
            <span className="font-semibold text-blue-600">
              {county.medicaid_total_enrollment?.toLocaleString() || 'N/A'}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-green-50 p-2 rounded border">
              <div className="text-xs font-medium text-green-700 mb-1">Expansion</div>
              <div className="text-sm font-semibold text-green-900">
                {county.medicaid_expansion_enrollment?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-xs text-green-600">New Medicaid</div>
            </div>
            
            <div className="bg-blue-50 p-2 rounded border">
              <div className="text-xs font-medium text-blue-700 mb-1">Traditional</div>
              <div className="text-sm font-semibold text-blue-900">
                {county.medicaid_traditional_enrollment?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-xs text-blue-600">Pre-Expansion</div>
            </div>
            
            <div className="bg-gray-50 p-2 rounded border">
              <div className="text-xs font-medium text-gray-700 mb-1">Pop. 2020</div>
              <div className="text-sm font-semibold text-gray-900">
                {county.population_2020?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-xs text-gray-600">U.S. Census</div>
            </div>
            
            <div className="bg-purple-50 p-2 rounded border">
              <div className="text-xs font-medium text-purple-700 mb-1">Ratio</div>
              <div className="text-sm font-semibold text-purple-900">
                {county.medicaid_dependency_ratio?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-xs text-purple-600">Dependency</div>
            </div>
          </div>
        </div>
      </div>

      {/* SVI Information - REAL DATA */}
      {county.svi_data ? (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">🏘️ Social Vulnerability</h4>
          <div className="bg-orange-50 p-3 rounded border border-orange-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-orange-800">Overall SVI Percentile:</span>
              <span className="text-sm font-bold text-orange-700">
                {county.svi_data.svi_overall_percentile !== null && county.svi_data.svi_overall_percentile !== undefined
                  ? (county.svi_data.svi_overall_percentile * 100).toFixed(0) + '%'
                  : 'No Data'
                }
              </span>
            </div>
            <div className="text-xs text-orange-600">
              Higher = more vulnerable
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            ⚠️ SVI data not available for this county
          </div>
        </div>
      )}

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