'use client';

import { HealthcareMetrics } from '../../types/healthcare';
import { DataLayer } from '../DataLayers/DataLayerSelector';
import { formatMedicaidRate } from '../../utils/medicaidHelpers';
import { useCountyClassifications } from '../../hooks/useCountyClassifications';

interface CountyDetailPanelProps {
  county: HealthcareMetrics | null;
  onClose: () => void;
  currentLayer?: DataLayer;
}

export default function CountyDetailPanel({ county, onClose, currentLayer = 'medicaid' }: CountyDetailPanelProps) {
  const { getClassification } = useCountyClassifications();
  
  if (!county) return null;

  // Render primary data based on current layer
  const renderPrimaryLayerData = (county: HealthcareMetrics, layer: DataLayer) => {
    // HCVI Composite and Component layers
    if (layer === 'hcvi_composite' || layer === 'healthcare_access' || layer === 'policy_risk' || layer === 'economic_vulnerability') {
      return (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Healthcare Vulnerability Index (HCVI)
          </h3>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-red-900">HCVI Composite Score</span>
              <span className="text-3xl font-bold text-red-700">
                {county.hcvi_composite?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <div className="text-xs text-red-600">
              Vulnerability Level: {county.vulnerability_category || 'Unknown'} (Scale: 1-10, Higher = More Vulnerable)
            </div>
          </div>
          
          {/* HCVI Component Breakdown */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="text-xs font-semibold text-gray-700 mb-2 px-1">
              HCVI Component Scores (Each contributes ~33%):
            </div>
            
            <div className="flex justify-between p-3 bg-blue-50 rounded border border-blue-200">
              <span className="text-blue-800 font-medium">Healthcare Access Score:</span>
              <span className="font-bold text-blue-700">
                {county.healthcare_access_score?.toFixed(1) || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-3 bg-red-50 rounded border border-red-200">
              <span className="text-red-800 font-medium">Policy Risk Score:</span>
              <span className="font-bold text-red-700">
                {county.policy_risk_score?.toFixed(1) || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
              <span className="text-yellow-800 font-medium">Economic Vulnerability:</span>
              <span className="font-bold text-yellow-700">
                {county.economic_vulnerability_score?.toFixed(1) || 'N/A'}
              </span>
            </div>
          </div>
        </>
      );
    }
    
    // All Medicaid layers
    if (layer.includes('medicaid')) {
      return (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Medicaid Enrollment Data (June 2025)
          </h3>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-900">Total Enrolled</span>
              <span className="text-2xl font-bold text-blue-700">
                {county.medicaid_total_enrollment?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="text-xs text-blue-600">
              {county.medicaid_enrollment_rate ? `${formatMedicaidRate(county.medicaid_enrollment_rate)} of county population` : 'Rate not available'}
            </div>
          </div>

          {/* ALL Medicaid Categories from Schema */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="text-xs font-semibold text-gray-700 mb-2 px-1">
              Medicaid Enrollment by Category (All 21+ Categories):
            </div>
            
            {/* Primary Traditional Categories */}
            <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
              <span className="text-green-800 font-medium">Aged (65+ years):</span>
              <span className="font-bold text-green-700">
                {county?.medicaid_aged?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-purple-50 rounded border border-purple-200">
              <span className="text-purple-800 font-medium">Disabled:</span>
              <span className="font-bold text-purple-700">
                {county?.medicaid_disabled?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-amber-50 rounded border border-amber-200">
              <span className="text-amber-800 font-medium">Blind:</span>
              <span className="font-bold text-amber-700">
                {county?.medicaid_blind?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-emerald-50 rounded border border-emerald-200">
              <span className="text-emerald-800 font-medium">Medicaid Expansion Adults:</span>
              <span className="font-bold text-emerald-700">
                {county?.medicaid_expansion_enrollment?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            {/* Child and Family Categories */}
            <div className="flex justify-between p-2 bg-cyan-50 rounded border border-cyan-200">
              <span className="text-cyan-800 font-medium">Infants and Children:</span>
              <span className="font-bold text-cyan-700">
                {county?.medicaid_infants_and_children?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-pink-50 rounded border border-pink-200">
              <span className="text-pink-800 font-medium">Other Child:</span>
              <span className="font-bold text-pink-700">
                {county?.medicaid_other_child?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-teal-50 rounded border border-teal-200">
              <span className="text-teal-800 font-medium">Pregnant Women:</span>
              <span className="font-bold text-teal-700">
                {county?.medicaid_pregnant_women?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <span className="text-blue-800 font-medium">Family Planning:</span>
              <span className="font-bold text-blue-700">
                {county?.medicaid_family_planning?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            {/* TANF Categories */}
            <div className="flex justify-between p-2 bg-indigo-50 rounded border border-indigo-200">
              <span className="text-indigo-800 font-medium">TANF/AFDC Under 21:</span>
              <span className="font-bold text-indigo-700">
                {county?.medicaid_tanf_under_21?.toLocaleString() || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-violet-50 rounded border border-violet-200">
              <span className="text-violet-800 font-medium">TANF/AFDC 21+:</span>
              <span className="font-bold text-violet-700">
                {county?.medicaid_tanf_21_and_over?.toLocaleString() || 'N/A'}
              </span>
            </div>

            {/* Additional Special Categories */}
            <div className="text-xs font-semibold text-gray-700 mb-2 mt-3 px-1">
              Special Medicaid Categories:
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div className="flex justify-between p-2 bg-gray-50 rounded border text-xs">
                <span className="text-gray-800">MCHIP:</span>
                <span className="font-bold text-gray-700">
                  {county?.medicaid_mchip?.toLocaleString() || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-gray-50 rounded border text-xs">
                <span className="text-gray-800">BCC:</span>
                <span className="font-bold text-gray-700">
                  {county?.medicaid_bcc?.toLocaleString() || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-gray-50 rounded border text-xs">
                <span className="text-gray-800">Refugees:</span>
                <span className="font-bold text-gray-700">
                  {county?.medicaid_refugees?.toLocaleString() || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-gray-50 rounded border text-xs">
                <span className="text-gray-800">COVID-19:</span>
                <span className="font-bold text-gray-700">
                  {county?.medicaid_covid_19?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </>
      );
    }
    
    // SVI layers
    if (layer.includes('svi')) {
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
              Higher percentiles indicate greater social vulnerability
            </div>
          </div>

          {/* ALL SVI Data from Schema */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="text-xs font-semibold text-gray-700 mb-2 px-1">
              SVI Themes (Percentile Rankings - Higher = More Vulnerable):
            </div>
            
            <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <span className="text-blue-800 font-medium">Theme 1 - Socioeconomic:</span>
              <span className="font-bold text-blue-700">
                {county.svi_data?.socioeconomic_percentile !== null 
                  ? (county.svi_data.socioeconomic_percentile * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-purple-50 rounded border border-purple-200">
              <span className="text-purple-800 font-medium">Theme 2 - Household Composition:</span>
              <span className="font-bold text-purple-700">
                {county.svi_data?.household_composition_percentile !== null
                  ? (county.svi_data.household_composition_percentile * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
              <span className="text-green-800 font-medium">Theme 3 - Racial & Ethnic Minority:</span>
              <span className="font-bold text-green-700">
                {county.svi_data?.racial_minority_percentile !== null
                  ? (county.svi_data.racial_minority_percentile * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between p-2 bg-amber-50 rounded border border-amber-200">
              <span className="text-amber-800 font-medium">Theme 4 - Housing & Transportation:</span>
              <span className="font-bold text-amber-700">
                {county.svi_data?.housing_transport_percentile !== null
                  ? (county.svi_data.housing_transport_percentile * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
            
            {/* Detailed SVI Individual Metrics */}
            <div className="text-xs font-semibold text-gray-700 mb-2 mt-3 px-1">
              Individual Vulnerability Indicators (%):
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div className="flex justify-between p-2 bg-red-50 rounded border text-xs">
                <span className="text-red-800">Poverty 150%:</span>
                <span className="font-bold text-red-700">
                  {county.svi_data?.poverty_150_pct ? `${county.svi_data.poverty_150_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-orange-50 rounded border text-xs">
                <span className="text-orange-800">Unemployed:</span>
                <span className="font-bold text-orange-700">
                  {county.svi_data?.unemployment_pct ? `${county.svi_data.unemployment_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-yellow-50 rounded border text-xs">
                <span className="text-yellow-800">No Insurance:</span>
                <span className="font-bold text-yellow-700">
                  {county.svi_data?.no_insurance_pct ? `${county.svi_data.no_insurance_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-teal-50 rounded border text-xs">
                <span className="text-teal-800">No HS Diploma:</span>
                <span className="font-bold text-teal-700">
                  {county.svi_data?.no_highschool_pct ? `${county.svi_data.no_highschool_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-indigo-50 rounded border text-xs">
                <span className="text-indigo-800">Age 65+:</span>
                <span className="font-bold text-indigo-700">
                  {county.svi_data?.age65_older_pct ? `${county.svi_data.age65_older_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-purple-50 rounded border text-xs">
                <span className="text-purple-800">Age 17-:</span>
                <span className="font-bold text-purple-700">
                  {county.svi_data?.age17_younger_pct ? `${county.svi_data.age17_younger_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-pink-50 rounded border text-xs">
                <span className="text-pink-800">Disabled:</span>
                <span className="font-bold text-pink-700">
                  {county.svi_data?.disability_pct ? `${county.svi_data.disability_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-cyan-50 rounded border text-xs">
                <span className="text-cyan-800">Single Parent:</span>
                <span className="font-bold text-cyan-700">
                  {county.svi_data?.single_parent_pct ? `${county.svi_data.single_parent_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-emerald-50 rounded border text-xs">
                <span className="text-emerald-800">Minority:</span>
                <span className="font-bold text-emerald-700">
                  {county.svi_data?.minority_pct ? `${county.svi_data.minority_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-lime-50 rounded border text-xs">
                <span className="text-lime-800">Mobile Homes:</span>
                <span className="font-bold text-lime-700">
                  {county.svi_data?.mobile_homes_pct ? `${county.svi_data.mobile_homes_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-slate-50 rounded border text-xs">
                <span className="text-slate-800">No Vehicle:</span>
                <span className="font-bold text-slate-700">
                  {county.svi_data?.no_vehicle_pct ? `${county.svi_data.no_vehicle_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between p-2 bg-gray-50 rounded border text-xs">
                <span className="text-gray-800">Crowded Housing:</span>
                <span className="font-bold text-gray-700">
                  {county.svi_data?.crowded_housing_pct ? `${county.svi_data.crowded_housing_pct.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </>
      );
    }

    // Hospital layers
    if (layer.includes('hospital') || layer === 'private_equity') {
      return (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
            Hospital Infrastructure & Ownership Analysis
          </h3>
          
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-indigo-900">Licensed Hospitals in County</span>
              <span className="text-2xl font-bold text-indigo-700">N/A</span>
            </div>
            <div className="text-xs text-indigo-600">
              NC Division of Health Service Regulation licensed facilities
            </div>
          </div>
          
          {/* Comprehensive Hospital Data */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="text-xs font-semibold text-gray-700 mb-2 px-1">
              Hospital Ownership Types:
            </div>
            
            <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
              <span className="text-green-800 font-medium">Government Owned:</span>
              <span className="font-bold text-green-700">N/A</span>
            </div>
            
            <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <span className="text-blue-800 font-medium">Voluntary Non-Profit:</span>
              <span className="font-bold text-blue-700">N/A</span>
            </div>
            
            <div className="flex justify-between p-2 bg-amber-50 rounded border border-amber-200">
              <span className="text-amber-800 font-medium">Proprietary (For-Profit):</span>
              <span className="font-bold text-amber-700">N/A</span>
            </div>
            
            <div className="text-xs font-semibold text-gray-700 mb-2 mt-3 px-1">
              Private Equity Analysis:
            </div>
            
            <div className="flex justify-between p-2 bg-red-50 rounded border border-red-200">
              <span className="text-red-800 font-medium">PE-Owned Facilities:</span>
              <span className="font-bold text-red-700">N/A</span>
            </div>
            
            <div className="flex justify-between p-2 bg-orange-50 rounded border border-orange-200">
              <span className="text-orange-800 font-medium">Independent Facilities:</span>
              <span className="font-bold text-orange-700">N/A</span>
            </div>
            
            <div className="text-xs font-semibold text-gray-700 mb-2 mt-3 px-1">
              Company Legal Structure:
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div className="flex justify-between p-2 bg-purple-50 rounded border text-xs">
                <span className="text-purple-800">Corporation (Inc):</span>
                <span className="font-bold text-purple-700">N/A</span>
              </div>
              
              <div className="flex justify-between p-2 bg-teal-50 rounded border text-xs">
                <span className="text-teal-800">LLC:</span>
                <span className="font-bold text-teal-700">N/A</span>
              </div>
              
              <div className="flex justify-between p-2 bg-pink-50 rounded border text-xs">
                <span className="text-pink-800">Partnership:</span>
                <span className="font-bold text-pink-700">N/A</span>
              </div>
              
              <div className="flex justify-between p-2 bg-cyan-50 rounded border text-xs">
                <span className="text-cyan-800">Other:</span>
                <span className="font-bold text-cyan-700">N/A</span>
              </div>
            </div>
            
            <div className="text-xs font-semibold text-gray-700 mb-2 mt-3 px-1">
              Financial Health Indicators:
            </div>
            
            <div className="flex justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
              <span className="text-yellow-800 font-medium">Operating Margins:</span>
              <span className="font-bold text-yellow-700">N/A</span>
            </div>
            
            <div className="flex justify-between p-2 bg-red-50 rounded border border-red-200">
              <span className="text-red-800 font-medium">Closure Risk Level:</span>
              <span className="font-bold text-red-700">N/A</span>
            </div>
          </div>
        </>
      );
    }
    
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">Layer Data</div>
          <div className="text-sm">Data visualization for &quot;{layer}&quot; layer</div>
        </div>
      </div>
    );
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
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {county.population_2020?.toLocaleString() || 'N/A'}
          </div>
          <div className="text-xs text-gray-600">Population (2020)</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {getClassification(county.fips_code)}
          </div>
          <div className="text-xs text-gray-600">Classification</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-bold text-gray-900">
            FIPS {county.fips_code.slice(-3)}
          </div>
          <div className="text-xs text-gray-600">County Code</div>
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