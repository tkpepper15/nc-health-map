'use client';

import React from 'react';
import { HealthcareMetrics } from '../../types/healthcare';
import { DataLayer } from '../DataLayers/DataLayerSelector';
import { formatMedicaidRate } from '../../utils/medicaidHelpers';
import { useCountyClassifications } from '../../hooks/useCountyClassifications';

interface Hospital {
  id: string | number;
  facility_name: string;
  alt_name?: string;
  licensee?: string;
  license_number?: string;
  facility_type?: string;
  service_type?: string;
  county?: string;
  city?: string;
  state?: string;
  zip?: string;
  address?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  general_beds?: number;
  rehab_beds?: number;
  psych_beds?: number;
  substance_abuse_beds?: number;
  nursing_facility_beds?: number;
  total_beds?: number;
  cardiac_surgery_rooms?: number;
  cesarean_rooms?: number;
  ambulatory_surgery_rooms?: number;
  shared_rooms?: number;
  endoscopy_rooms?: number;
  other_surgery_rooms?: number;
  total_surgery_rooms?: number;
  is_major_hospital?: boolean;
  is_specialty?: boolean;
  is_emergency_dept?: boolean;
  is_ltac?: boolean;
  is_rehab?: boolean;
}

interface UnifiedCountyTileProps {
  county?: HealthcareMetrics | null;
  hospital?: Hospital | null;
  currentLayer: DataLayer;
  position: { x: number; y: number } | null;
  isFixed?: boolean;
  onClose?: () => void;
}

export default function UnifiedCountyTile({ 
  county, 
  hospital,
  currentLayer, 
  position, 
  isFixed = false, 
  onClose 
}: UnifiedCountyTileProps) {
  const { getClassification, getClassificationColor } = useCountyClassifications();
  
  if (!county && !hospital) return null;

  const getLayerData = () => {
    // If hospital is selected, show hospital data regardless of layer
    if (hospital) {
      // Calculate key metrics
      const specialtyServices = [
        hospital.is_emergency_dept ? 'Emergency Dept' : null,
        hospital.is_specialty ? 'Specialty Care' : null,
        hospital.is_rehab ? 'Rehabilitation' : null,
        hospital.is_ltac ? 'Long-term Care' : null
      ].filter(Boolean).join(', ') || 'General Hospital';

      const bedBreakdown = [
        hospital.general_beds ? `General: ${hospital.general_beds}` : null,
        hospital.rehab_beds ? `Rehab: ${hospital.rehab_beds}` : null,
        hospital.psych_beds ? `Psych: ${hospital.psych_beds}` : null,
        hospital.nursing_facility_beds ? `Nursing: ${hospital.nursing_facility_beds}` : null
      ].filter(Boolean).join(' • ') || 'Bed breakdown unavailable';

      const operatingRoomBreakdown = [
        hospital.cardiac_surgery_rooms ? `Cardiac: ${hospital.cardiac_surgery_rooms}` : null,
        hospital.cesarean_rooms ? `C-section: ${hospital.cesarean_rooms}` : null,
        hospital.ambulatory_surgery_rooms ? `Ambulatory: ${hospital.ambulatory_surgery_rooms}` : null,
        hospital.endoscopy_rooms ? `Endoscopy: ${hospital.endoscopy_rooms}` : null
      ].filter(Boolean).join(' • ') || 'OR breakdown unavailable';

      return {
        primaryValue: hospital.total_beds?.toString() || 'N/A',
        primaryLabel: 'Total Licensed Beds',
        secondaryData: [
          { label: 'Services', value: specialtyServices },
          { label: 'Location', value: `${hospital.city || 'Unknown'}, ${hospital.county || 'NC'} ${hospital.zip || ''}` },
          { label: 'Bed Types', value: bedBreakdown },
          { label: 'Operating Rooms', value: `${hospital.total_surgery_rooms || 0} total (${operatingRoomBreakdown})` },
          { label: 'License', value: `${hospital.license_number || 'N/A'} • ${hospital.licensee || 'Unknown Licensee'}` },
          { label: 'Contact Info', value: `${hospital.phone || 'No phone'} • ${hospital.address || 'No address'}` }
        ],
        color: 'green'
      };
    }

    // County data handling (existing logic)
    if (!county) {
      return {
        primaryValue: 'N/A',
        primaryLabel: 'No Data',
        secondaryData: [],
        color: 'gray'
      };
    }

    switch (currentLayer) {
      // HCVI Layers
      case 'hcvi_composite':
        return {
          primaryValue: county.hcvi_composite?.toFixed(1) || 'N/A',
          primaryLabel: 'HCVI Composite Score (1-10)',
          secondaryData: [
            { label: 'Vulnerability Category', value: county.vulnerability_category || 'N/A' },
            { label: 'Healthcare Access', value: county.healthcare_access_score?.toFixed(1) || 'N/A' },
            { label: 'Policy Risk', value: county.policy_risk_score?.toFixed(1) || 'N/A' },
            { label: 'Economic Vulnerability', value: county.economic_vulnerability_score?.toFixed(1) || 'N/A' }
          ],
          color: 'red'
        };
      case 'healthcare_access':
        return {
          primaryValue: county.healthcare_access_score?.toFixed(1) || 'N/A',
          primaryLabel: 'Healthcare Access Score',
          secondaryData: [
            { label: 'Provider Density', value: county.healthcareAccess?.providerDensity?.toFixed(1) || 'N/A' },
            { label: 'Geographic Access', value: county.healthcareAccess?.geographicAccess?.toFixed(1) || 'N/A' },
            { label: 'Insurance Coverage', value: county.healthcareAccess?.insuranceCoverage ? `${county.healthcareAccess.insuranceCoverage.toFixed(1)}%` : 'N/A' }
          ],
          color: 'blue'
        };
      case 'policy_risk':
        return {
          primaryValue: county.policy_risk_score?.toFixed(1) || 'N/A',
          primaryLabel: 'Policy Risk Score',
          secondaryData: [
            { label: 'Medicaid Dependency', value: county.policyRisk?.medicaidDependency?.toFixed(1) || 'N/A' },
            { label: 'Federal Funding Reliance', value: county.policyRisk?.federalFundingReliance?.toFixed(1) || 'N/A' },
            { label: 'SNAP Vulnerability', value: county.policyRisk?.snapVulnerability?.toFixed(1) || 'N/A' }
          ],
          color: 'amber'
        };
      case 'economic_vulnerability':
        return {
          primaryValue: county.economic_vulnerability_score?.toFixed(1) || 'N/A',
          primaryLabel: 'Economic Vulnerability Score',
          secondaryData: [
            { label: 'Healthcare Employment', value: county.economicVulnerability?.healthcareEmployment ? `${county.economicVulnerability.healthcareEmployment.toFixed(1)}%` : 'N/A' },
            { label: 'Social Determinants', value: county.economicVulnerability?.socialDeterminants?.toFixed(1) || 'N/A' }
          ],
          color: 'purple'
        };
      
      // Medicaid Layers
      case 'medicaid_total':
        return {
          primaryValue: formatMedicaidRate(county.medicaid_enrollment_rate),
          primaryLabel: 'Total Medicaid Enrollment',
          secondaryData: [
            { label: 'Total Enrolled', value: county.medicaid_total_enrollment?.toLocaleString() || 'N/A' },
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' },
            { label: 'Dependency Ratio', value: county.medicaid_dependency_ratio?.toFixed(2) || 'N/A' }
          ],
          color: 'blue'
        };
      case 'medicaid_expansion':
        return {
          primaryValue: county.medicaid_expansion_enrollment?.toLocaleString() || 'N/A',
          primaryLabel: 'Medicaid Expansion Adults',
          secondaryData: [
            { label: 'Total Medicaid', value: formatMedicaidRate(county.medicaid_enrollment_rate) },
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' },
            { label: 'Traditional Medicaid', value: county.medicaid_traditional_enrollment?.toLocaleString() || 'N/A' }
          ],
          color: 'blue'
        };
      case 'medicaid_aged':
      case 'medicaid_disabled':
      case 'medicaid_blind':
      case 'medicaid_children':
      case 'medicaid_pregnant':
        const categoryName = currentLayer.replace('medicaid_', '').replace('_', ' ');
        return {
          primaryValue: formatMedicaidRate(county.medicaid_enrollment_rate),
          primaryLabel: `Medicaid - ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}`,
          secondaryData: [
            { label: 'Total Medicaid Rate', value: formatMedicaidRate(county.medicaid_enrollment_rate) },
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' },
            { label: 'County Type', value: getClassification(county.fips_code) }
          ],
          color: 'blue'
        };
      
      // SVI Layers
      case 'svi_overall':
        return {
          primaryValue: county.svi_data?.svi_overall_percentile ? `${(county.svi_data.svi_overall_percentile * 100).toFixed(0)}th` : 'N/A',
          primaryLabel: 'Overall SVI Percentile',
          secondaryData: [
            { label: 'Socioeconomic', value: county.svi_data?.socioeconomic_percentile ? `${(county.svi_data.socioeconomic_percentile * 100).toFixed(0)}th` : 'N/A' },
            { label: 'Household Comp.', value: county.svi_data?.household_composition_percentile ? `${(county.svi_data.household_composition_percentile * 100).toFixed(0)}th` : 'N/A' },
            { label: 'Housing/Transport', value: county.svi_data?.housing_transport_percentile ? `${(county.svi_data.housing_transport_percentile * 100).toFixed(0)}th` : 'N/A' }
          ],
          color: 'amber'
        };
      case 'svi_socioeconomic':
        return {
          primaryValue: county.svi_data?.socioeconomic_percentile ? `${(county.svi_data.socioeconomic_percentile * 100).toFixed(0)}th` : 'N/A',
          primaryLabel: 'SVI Theme 1: Socioeconomic',
          secondaryData: [
            { label: 'Below 150% Poverty', value: county.svi_data?.poverty_150_pct ? `${county.svi_data.poverty_150_pct.toFixed(1)}%` : 'N/A' },
            { label: 'Unemployment', value: county.svi_data?.unemployment_pct ? `${county.svi_data.unemployment_pct.toFixed(1)}%` : 'N/A' },
            { label: 'No Insurance', value: county.svi_data?.no_insurance_pct ? `${county.svi_data.no_insurance_pct.toFixed(1)}%` : 'N/A' }
          ],
          color: 'amber'
        };
      case 'svi_household':
        return {
          primaryValue: county.svi_data?.household_composition_percentile ? `${(county.svi_data.household_composition_percentile * 100).toFixed(0)}th` : 'N/A',
          primaryLabel: 'SVI Theme 2: Household Composition',
          secondaryData: [
            { label: 'Age 65+ Population', value: county.svi_data?.age65_older_pct ? `${county.svi_data.age65_older_pct.toFixed(1)}%` : 'N/A' },
            { label: 'Age <17 Population', value: county.svi_data?.age17_younger_pct ? `${county.svi_data.age17_younger_pct.toFixed(1)}%` : 'N/A' },
            { label: 'Disability', value: county.svi_data?.disability_pct ? `${county.svi_data.disability_pct.toFixed(1)}%` : 'N/A' }
          ],
          color: 'amber'
        };
      case 'svi_minority':
        return {
          primaryValue: county.svi_data?.racial_minority_percentile ? `${(county.svi_data.racial_minority_percentile * 100).toFixed(0)}th` : 'N/A',
          primaryLabel: 'SVI Theme 3: Racial & Ethnic Minority',
          secondaryData: [
            { label: 'Minority Population', value: county.svi_data?.minority_pct ? `${county.svi_data.minority_pct.toFixed(1)}%` : 'N/A' },
            { label: 'Limited English', value: county.svi_data?.limited_english_pct ? `${county.svi_data.limited_english_pct.toFixed(1)}%` : 'N/A' }
          ],
          color: 'amber'
        };
      case 'svi_housing':
        return {
          primaryValue: county.svi_data?.housing_transport_percentile ? `${(county.svi_data.housing_transport_percentile * 100).toFixed(0)}th` : 'N/A',
          primaryLabel: 'SVI Theme 4: Housing & Transportation',
          secondaryData: [
            { label: 'No Vehicle Access', value: county.svi_data?.no_vehicle_pct ? `${county.svi_data.no_vehicle_pct.toFixed(1)}%` : 'N/A' },
            { label: 'Mobile Homes', value: county.svi_data?.mobile_homes_pct ? `${county.svi_data.mobile_homes_pct.toFixed(1)}%` : 'N/A' },
            { label: 'Crowded Housing', value: county.svi_data?.crowded_housing_pct ? `${county.svi_data.crowded_housing_pct.toFixed(1)}%` : 'N/A' }
          ],
          color: 'amber'
        };
      
      // Individual SVI Metrics
      case 'svi_poverty':
        return {
          primaryValue: county.svi_data?.poverty_150_pct ? `${county.svi_data.poverty_150_pct.toFixed(1)}%` : 'N/A',
          primaryLabel: 'Below 150% Poverty Line',
          secondaryData: [
            { label: 'Overall SVI Rank', value: county.svi_data?.svi_overall_percentile ? `${(county.svi_data.svi_overall_percentile * 100).toFixed(0)}th` : 'N/A' },
            { label: 'County Type', value: getClassification(county.fips_code) },
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' }
          ],
          color: 'red'
        };
      case 'svi_no_insurance':
        return {
          primaryValue: county.svi_data?.no_insurance_pct ? `${county.svi_data.no_insurance_pct.toFixed(1)}%` : 'N/A',
          primaryLabel: 'No Health Insurance',
          secondaryData: [
            { label: 'Medicaid Rate', value: formatMedicaidRate(county.medicaid_enrollment_rate) },
            { label: 'County Type', value: getClassification(county.fips_code) },
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' }
          ],
          color: 'red'
        };
      case 'svi_unemployment':
        return {
          primaryValue: county.svi_data?.unemployment_pct ? `${county.svi_data.unemployment_pct.toFixed(1)}%` : 'N/A',
          primaryLabel: 'Unemployment Rate',
          secondaryData: [
            { label: 'Poverty Rate', value: county.svi_data?.poverty_150_pct ? `${county.svi_data.poverty_150_pct.toFixed(1)}%` : 'N/A' },
            { label: 'County Type', value: getClassification(county.fips_code) },
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' }
          ],
          color: 'red'
        };
      case 'svi_disability':
        return {
          primaryValue: county.svi_data?.disability_pct ? `${county.svi_data.disability_pct.toFixed(1)}%` : 'N/A',
          primaryLabel: 'Population with Disability',
          secondaryData: [
            { label: 'Age 65+ Population', value: county.svi_data?.age65_older_pct ? `${county.svi_data.age65_older_pct.toFixed(1)}%` : 'N/A' },
            { label: 'Medicaid Rate', value: formatMedicaidRate(county.medicaid_enrollment_rate) },
            { label: 'County Type', value: getClassification(county.fips_code) }
          ],
          color: 'purple'
        };
      
      // Hospital Layers
      case 'hospitals':
        return {
          primaryValue: getClassification(county.fips_code),
          primaryLabel: 'County Type',
          secondaryData: [
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' },
            { label: 'Medicaid Rate', value: formatMedicaidRate(county.medicaid_enrollment_rate) },
            { label: 'SVI Score', value: county.svi_data?.svi_overall_percentile ? `${(county.svi_data.svi_overall_percentile * 100).toFixed(0)}th` : 'N/A' }
          ],
          color: getClassificationColor(county.fips_code)
        };
      case 'hospital_ownership':
      case 'private_equity':
        return {
          primaryValue: getClassification(county.fips_code),
          primaryLabel: 'County Type',
          secondaryData: [
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' },
            { label: 'HCVI Score', value: county.hcvi_composite?.toFixed(1) || 'N/A' },
            { label: 'Healthcare Access', value: county.healthcare_access_score?.toFixed(1) || 'N/A' }
          ],
          color: getClassificationColor(county.fips_code)
        };
      
      // Legacy layers
      case 'medicaid':
        return {
          primaryValue: formatMedicaidRate(county.medicaid_enrollment_rate),
          primaryLabel: 'Medicaid Enrollment',
          secondaryData: [
            { label: 'Total Enrolled', value: county.medicaid_total_enrollment?.toLocaleString() || 'N/A' },
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' },
            { label: 'Dependency Ratio', value: county.medicaid_dependency_ratio?.toFixed(2) || 'N/A' }
          ],
          color: 'blue'
        };
      case 'svi':
        return {
          primaryValue: county.svi_data?.svi_overall_percentile ? `${(county.svi_data.svi_overall_percentile * 100).toFixed(0)}th` : 'N/A',
          primaryLabel: 'SVI Percentile',
          secondaryData: [
            { label: 'Socioeconomic', value: county.svi_data?.socioeconomic_percentile ? `${(county.svi_data.socioeconomic_percentile * 100).toFixed(0)}th` : 'N/A' },
            { label: 'Household Comp.', value: county.svi_data?.household_composition_percentile ? `${(county.svi_data.household_composition_percentile * 100).toFixed(0)}th` : 'N/A' },
            { label: 'Classification', value: getClassification(county.fips_code) }
          ],
          color: 'amber'
        };
      
      default:
        return {
          primaryValue: county.hcvi_composite?.toFixed(1) || 'N/A',
          primaryLabel: 'HCVI Composite Score',
          secondaryData: [
            { label: 'Vulnerability', value: county.vulnerability_category || 'N/A' },
            { label: 'County Type', value: getClassification(county.fips_code) },
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' }
          ],
          color: 'red'
        };
    }
  };

  const data = getLayerData();
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    purple: 'border-purple-200 bg-purple-50',
    gray: 'border-gray-200 bg-gray-50'
  };

  const primaryColorClasses: Record<string, string> = {
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    green: 'text-green-700',
    red: 'text-red-700',
    purple: 'text-purple-700',
    gray: 'text-gray-700'
  };

  // Position logic - hover follows cursor, fixed stays in place
  const getPositionStyle = () => {
    if (isFixed) {
      // Fixed positioning - stays where the user clicked
      return {
        position: 'fixed' as const,
        left: position?.x ? `${position.x + 15}px` : '50%',
        top: position?.y ? `${position.y - 10}px` : '50%',
        transform: (!position?.x && !position?.y) ? 'translate(-50%, -50%)' : 'none',
        zIndex: 1000
      };
    } else if (position) {
      // Hover positioning - adjust if near screen edges
      const isNearRightEdge = position.x > window.innerWidth - 350;
      const isNearBottomEdge = position.y > window.innerHeight - 300;
      
      return {
        position: 'fixed' as const,
        left: isNearRightEdge ? position.x - 320 : position.x + 15,
        top: isNearBottomEdge ? position.y - 280 : position.y - 10,
        zIndex: 1000
      };
    }
    return { display: 'none' };
  };

  return (
    <div 
      className="floating-tile w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 pointer-events-auto"
      style={getPositionStyle()}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {hospital ? hospital.facility_name : (county?.countyName || 'Unknown County')}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {hospital ? (
              <>
                {hospital.licensee ? `Licensed to: ${hospital.licensee}` : 'Hospital Facility'} • {hospital.license_number || 'N/A'}
              </>
            ) : (
              <>
                FIPS: {county?.fips_code} • {getClassification(county.fips_code)}
              </>
            )}
          </p>
        </div>
        {isFixed && onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"
            title="Close county details"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Primary Metric */}
      <div className={`p-3 rounded-lg border-2 ${colorClasses[data.color]} mb-3`}>
        <div className={`text-2xl font-bold mb-1 ${primaryColorClasses[data.color]}`}>
          {data.primaryValue}
        </div>
        <div className="text-sm text-gray-600">
          {data.primaryLabel}
        </div>
      </div>

      {/* Secondary Data Grid */}
      {data.secondaryData.length > 0 && (
        <div className="space-y-2 mb-3">
          {data.secondaryData.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className="text-sm font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {hospital ? 'NC DHSR • 2024' :
             currentLayer === 'medicaid' ? 'NC DHHS • 2025' : 
             currentLayer === 'svi' ? 'CDC/ATSDR • 2022' :
             'NC DHSR • 2024'}
          </div>
          {!isFixed && (
            <div className="text-xs text-gray-400">
              Click to pin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}