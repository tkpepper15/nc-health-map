'use client';

import { County } from '../../types/healthcare';
import { getMedicaidDataByCounty } from '../../data/healthcareData';

interface CountyPopupProps {
  county: County;
  onClose: () => void;
}

export default function CountyPopup({ county, onClose }: CountyPopupProps) {
  const healthcareData = getMedicaidDataByCounty(county.name);

  if (!healthcareData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{county.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">No healthcare data available for this county.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{healthcareData.countyName}</h2>
            <p className="text-sm text-gray-600">FIPS: {healthcareData.fips_code}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* HCVI Score */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Healthcare Vulnerability Index</h3>
            <div className="text-3xl font-bold text-blue-800">
              {healthcareData.hcvi_composite?.toFixed(1) || 'N/A'} / 10
            </div>
            <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
              healthcareData.vulnerability_category === 'extreme' ? 'bg-red-100 text-red-800' :
              healthcareData.vulnerability_category === 'high' ? 'bg-orange-100 text-orange-800' :
              healthcareData.vulnerability_category === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {healthcareData.vulnerability_category?.toUpperCase() || 'Unknown'}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medicaid Enrollment */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Total Medicaid Enrollment</h4>
              <div className="text-2xl font-bold text-green-800">
                {healthcareData.medicaid_total_enrollment?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">
                {healthcareData.medicaid_enrollment_rate?.toFixed(1) || 'N/A'}% of population
              </div>
            </div>

            {/* Medicaid Expansion */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Medicaid Expansion</h4>
              <div className="text-2xl font-bold text-purple-800">
                {healthcareData.medicaid_expansion_enrollment?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">
                Expansion enrollees
              </div>
            </div>

            {/* Healthcare Access */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">Healthcare Access Score</h4>
              <div className="text-2xl font-bold text-orange-800">
                {healthcareData.healthcare_access_score?.toFixed(1) || 'N/A'} / 10
              </div>
              <div className="text-sm text-gray-600">
                Provider density: {healthcareData.healthcareAccess.providerDensity?.toFixed(1) || 'N/A'} per 10k
              </div>
            </div>

            {/* Policy Risk */}
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Policy Risk Score</h4>
              <div className="text-2xl font-bold text-red-800">
                {healthcareData.policy_risk_score?.toFixed(1) || 'N/A'} / 10
              </div>
              <div className="text-sm text-gray-600">
                Federal funding reliance: {healthcareData.policyRisk.federalFundingReliance?.toFixed(1) || 'N/A'}%
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rural County:</span>
                  <span className="font-medium">{healthcareData.is_rural ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Population (2020):</span>
                  <span className="font-medium">{healthcareData.population_2020?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance Coverage:</span>
                  <span className="font-medium">{healthcareData.healthcareAccess.insuranceCoverage?.toFixed(1) || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Travel Time to Hospital:</span>
                  <span className="font-medium">{healthcareData.healthcareAccess.geographicAccess?.toFixed(1) || 'N/A'} min</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Economic Vulnerability:</span>
                  <span className="font-medium">{healthcareData.economic_vulnerability_score?.toFixed(1) || 'N/A'}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hospital Financial Health:</span>
                  <span className="font-medium">{healthcareData.economicVulnerability.hospitalFinancialHealth?.toFixed(1) || 'N/A'}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Healthcare Employment:</span>
                  <span className="font-medium">{healthcareData.economicVulnerability.healthcareEmployment?.toFixed(1) || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Private Equity Exposure:</span>
                  <span className="font-medium">{healthcareData.economicVulnerability.privateEquityExposure?.toFixed(1) || 'N/A'}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}