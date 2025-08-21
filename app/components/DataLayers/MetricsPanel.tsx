'use client';

import React from 'react';
import { DataLayer } from './DataLayerSelector';

interface MetricsData {
  totalCount?: number;
  majorFacilities?: number;
  emergencyDepts?: number;
  totalBeds?: number;
  averageBedsPerHospital?: number;
}

interface MetricsPanelProps {
  currentLayer: DataLayer;
  metricsData?: MetricsData | null;
  healthcareData?: any[];
  isLoading?: boolean;
}

export default function MetricsPanel({ 
  currentLayer, 
  metricsData, 
  healthcareData = [], 
  isLoading 
}: MetricsPanelProps) {
  
  const renderMedicaidMetrics = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Statewide Medicaid Overview</h3>
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <div className="text-sm font-medium text-blue-900">Total Enrollment</div>
          <div className="text-lg font-bold text-blue-800">
            {healthcareData.reduce((sum, d) => sum + (d.medicaid_total_enrollment || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-blue-600">Active Medicaid beneficiaries</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <div className="text-sm font-medium text-green-900">Expansion Enrollment</div>
          <div className="text-lg font-bold text-green-800">
            {healthcareData.reduce((sum, d) => sum + (d.medicaid_expansion_enrollment || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-green-600">Post-2014 expansion enrollees</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-orange-50 p-2 rounded border text-center">
            <div className="text-xs text-orange-700 font-medium">High Enrollment Counties</div>
            <div className="text-sm font-bold text-orange-800">
              {healthcareData.filter(d => d.medicaid_enrollment_rate && d.medicaid_enrollment_rate >= 30).length}
            </div>
            <div className="text-xs text-orange-600">≥30% rate</div>
          </div>
          <div className="bg-gray-50 p-2 rounded border text-center">
            <div className="text-xs text-gray-700 font-medium">All Counties</div>
            <div className="text-sm font-bold text-gray-800">100</div>
            <div className="text-xs text-gray-600">NC total</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSVIMetrics = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Social Vulnerability Overview</h3>
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <div className="text-sm font-medium text-red-900">High Vulnerability</div>
          <div className="text-lg font-bold text-red-800">
            {healthcareData.filter(d => d.svi_data?.svi_overall_percentile && d.svi_data.svi_overall_percentile >= 0.75).length}
          </div>
          <div className="text-xs text-red-600">Counties ≥75th percentile</div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <div className="text-sm font-medium text-yellow-900">Moderate Vulnerability</div>
          <div className="text-lg font-bold text-yellow-800">
            {healthcareData.filter(d => d.svi_data?.svi_overall_percentile && 
              d.svi_data.svi_overall_percentile >= 0.5 && d.svi_data.svi_overall_percentile < 0.75).length}
          </div>
          <div className="text-xs text-yellow-600">50th-74th percentile</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 p-2 rounded border text-center">
            <div className="text-xs text-green-700 font-medium">Low Vulnerability</div>
            <div className="text-sm font-bold text-green-800">
              {healthcareData.filter(d => d.svi_data?.svi_overall_percentile && d.svi_data.svi_overall_percentile < 0.5).length}
            </div>
            <div className="text-xs text-green-600">&lt;50th percentile</div>
          </div>
          <div className="bg-gray-50 p-2 rounded border text-center">
            <div className="text-xs text-gray-700 font-medium">Data Available</div>
            <div className="text-sm font-bold text-gray-800">
              {healthcareData.filter(d => d.svi_data?.svi_overall_percentile).length}
            </div>
            <div className="text-xs text-gray-600">Counties</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHospitalMetrics = () => {
    if (!metricsData) return null;
    
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Hospital Infrastructure</h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="text-sm font-medium text-blue-900">Total Facilities</div>
            <div className="text-lg font-bold text-blue-800">{metricsData.totalCount}</div>
            <div className="text-xs text-blue-600">Licensed healthcare facilities</div>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
            <div className="text-sm font-medium text-indigo-900">Licensed Bed Capacity</div>
            <div className="text-lg font-bold text-indigo-800">{metricsData.totalBeds?.toLocaleString()}</div>
            <div className="text-xs text-indigo-600">Total inpatient beds</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 p-2 rounded border text-center">
              <div className="text-xs text-green-700 font-medium">Major Hospitals</div>
              <div className="text-sm font-bold text-green-800">{metricsData.majorFacilities}</div>
              <div className="text-xs text-green-600">≥100 beds</div>
            </div>
            <div className="bg-red-50 p-2 rounded border text-center">
              <div className="text-xs text-red-700 font-medium">Emergency Depts</div>
              <div className="text-sm font-bold text-red-800">{metricsData.emergencyDepts}</div>
              <div className="text-xs text-red-600">Standalone EDs</div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded border text-center">
            <div className="text-xs text-gray-700 font-medium">Avg Beds per Hospital</div>
            <div className="text-sm font-bold text-gray-800">{metricsData.averageBedsPerHospital}</div>
            <div className="text-xs text-gray-600">State average</div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {currentLayer === 'medicaid' && renderMedicaidMetrics()}
      {currentLayer === 'svi' && renderSVIMetrics()}
      {currentLayer === 'hospitals' && renderHospitalMetrics()}
    </div>
  );
}