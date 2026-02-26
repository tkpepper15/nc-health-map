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

export default function CountyDetailPanel({
  county,
  onClose,
  currentLayer = 'medicaid',
}: CountyDetailPanelProps) {
  const { getClassification } = useCountyClassifications();

  if (!county) return null;

  // Render primary data based on current layer
  const renderPrimaryLayerData = (c: HealthcareMetrics, layer: DataLayer) => {
    // HCVI Composite and Component layers
    if (
      layer === 'hcvi_composite' ||
      layer === 'healthcare_access' ||
      layer === 'policy_risk' ||
      layer === 'economic_vulnerability'
    ) {
      return (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            Healthcare Vulnerability Index (HCVI)
          </h3>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-red-900">HCVI Composite Score</span>
              <span className="text-3xl font-bold text-red-700">
                {c.hcvi_composite != null ? c.hcvi_composite.toFixed(1) : 'N/A'}
              </span>
            </div>
            <div className="text-xs text-red-600">
              Vulnerability Level: {c.vulnerability_category || 'Unknown'} (Scale: 1-10, Higher = More
              Vulnerable)
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
                {c.healthcare_access_score != null ? c.healthcare_access_score.toFixed(1) : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-3 bg-red-50 rounded border border-red-200">
              <span className="text-red-800 font-medium">Policy Risk Score:</span>
              <span className="font-bold text-red-700">
                {c.policy_risk_score != null ? c.policy_risk_score.toFixed(1) : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
              <span className="text-yellow-800 font-medium">Economic Vulnerability:</span>
              <span className="font-bold text-yellow-700">
                {c.economic_vulnerability_score != null
                  ? c.economic_vulnerability_score.toFixed(1)
                  : 'N/A'}
              </span>
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
            <span className="w-3 h-3 bg-orange-500 rounded-full mr-2" />
            Social Vulnerability Index (2022)
          </h3>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-orange-900">Overall SVI Percentile</span>
              <span className="text-3xl font-bold text-orange-700">
                {c.svi_data?.svi_overall_percentile != null
                  ? `${(c.svi_data.svi_overall_percentile * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="text-xs text-orange-600">
              Higher percentiles indicate greater social vulnerability
            </div>
          </div>

          {/* SVI Themes */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="text-xs font-semibold text-gray-700 mb-2 px-1">
              SVI Themes (Percentile Rankings - Higher = More Vulnerable):
            </div>

            <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <span className="text-blue-800 font-medium">Theme 1 - Socioeconomic:</span>
              <span className="font-bold text-blue-700">
                {c.svi_data?.socioeconomic_percentile != null
                  ? `${(c.svi_data.socioeconomic_percentile * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-2 bg-purple-50 rounded border border-purple-200">
              <span className="text-purple-800 font-medium">Theme 2 - Household Composition:</span>
              <span className="font-bold text-purple-700">
                {c.svi_data?.household_composition_percentile != null
                  ? `${(c.svi_data.household_composition_percentile * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
              <span className="text-green-800 font-medium">Theme 3 - Racial & Ethnic Minority:</span>
              <span className="font-bold text-green-700">
                {c.svi_data?.racial_minority_percentile != null
                  ? `${(c.svi_data.racial_minority_percentile * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-2 bg-amber-50 rounded border border-amber-200">
              <span className="text-amber-800 font-medium">Theme 4 - Housing & Transportation:</span>
              <span className="font-bold text-amber-700">
                {c.svi_data?.housing_transport_percentile != null
                  ? `${(c.svi_data.housing_transport_percentile * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>

            {/* Detailed SVI Individual Metrics */}
            <div className="text-xs font-semibold text-gray-700 mb-2 mt-3 px-1">
              Individual Vulnerability Indicators (%):
            </div>

            <div className="grid grid-cols-2 gap-1">
              <Metric label="Poverty 150%" value={c.svi_data?.poverty_150_pct} />
              <Metric label="Unemployed" value={c.svi_data?.unemployment_pct} />
              <Metric label="No Insurance" value={c.svi_data?.no_insurance_pct} />
              <Metric label="No HS Diploma" value={c.svi_data?.no_highschool_pct} />
              <Metric label="Age 65+" value={c.svi_data?.age65_older_pct} />
              <Metric label="Age 17-" value={c.svi_data?.age17_younger_pct} />
              <Metric label="Disabled" value={c.svi_data?.disability_pct} />
              <Metric label="Single Parent" value={c.svi_data?.single_parent_pct} />
              <Metric label="Minority" value={c.svi_data?.minority_pct} />
              <Metric label="Mobile Homes" value={c.svi_data?.mobile_homes_pct} />
              <Metric label="No Vehicle" value={c.svi_data?.no_vehicle_pct} />
              <Metric label="Crowded Housing" value={c.svi_data?.crowded_housing_pct} />
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
            <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2" />
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

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
            Hospital ownership breakdown and PE analysis: N/A
          </div>
        </>
      );
    }

    // Default / Medicaid or other layers (example placeholder)
    if (layer === 'medicaid') {
      return (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Medicaid Enrollment Rate</span>
            <span className="text-2xl font-bold text-blue-700">
              {typeof c.medicaid_enrollment_rate === 'number'
                ? formatMedicaidRate(c.medicaid_enrollment_rate)
                : 'N/A'}
            </span>
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Total enrolled: {c.medicaid_total_enrollment?.toLocaleString() || 'N/A'}
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">Layer Data</div>
          <div className="text-sm">Data visualization for “{layer}” layer</div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-[24rem] overflow-y-auto">
      {/* Sticky Header (safe + non-colliding) */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {county.countyName || (county as any).county_name || 'County'}
            </h2>
            <p className="text-sm text-gray-500">FIPS: {county.fips_code}</p>
            <p className="text-sm text-gray-600 mt-1">
              Classification: {getClassification(county.fips_code) || 'Unknown'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 text-gray-700 whitespace-nowrap"
            title="Clear Selection"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
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
              {getClassification(county.fips_code) || 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Classification</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-bold text-gray-900">FIPS {county.fips_code.slice(-3)}</div>
            <div className="text-xs text-gray-600">County Code</div>
          </div>
        </div>

        {/* Layer-specific primary data */}
        <div className="mb-6">{renderPrimaryLayerData(county, currentLayer)}</div>

        {/* Data Sources Footer */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              <strong>Data Sources:</strong> NC DHHS, CDC SVI 2022, U.S. Census 2020
            </div>
            <div className="text-gray-400">Updated: June 2025</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small helper for SVI metrics */
function Metric({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="flex justify-between p-2 bg-white rounded border text-xs">
      <span className="text-gray-700">{label}:</span>
      <span className="font-bold text-gray-900">
        {typeof value === 'number' ? `${value.toFixed(1)}%` : 'N/A'}
      </span>
    </div>
  );
}
