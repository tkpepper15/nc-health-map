'use client';

import React from 'react';
import { HealthcareMetrics } from '../../types/healthcare';
import { DataLayer } from '../DataLayers/DataLayerSelector';

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
      case 'medicaid':
        return {
          primaryValue: county.medicaid_enrollment_rate ? `${county.medicaid_enrollment_rate.toFixed(1)}%` : 'N/A',
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
            { label: 'Classification', value: county.is_rural ? 'Rural' : 'Urban' }
          ],
          color: 'amber'
        };
      case 'hospitals':
        return {
          primaryValue: county.is_rural ? 'Rural' : 'Urban',
          primaryLabel: 'County Type',
          secondaryData: [
            { label: 'Population', value: county.population_2020?.toLocaleString() || 'N/A' },
            { label: 'Medicaid Rate', value: county.medicaid_enrollment_rate ? `${county.medicaid_enrollment_rate.toFixed(1)}%` : 'N/A' },
            { label: 'SVI Score', value: county.svi_data?.svi_overall_percentile ? `${(county.svi_data.svi_overall_percentile * 100).toFixed(0)}th` : 'N/A' }
          ],
          color: 'green'
        };
      default:
        return {
          primaryValue: 'N/A',
          primaryLabel: 'Select Layer',
          secondaryData: [],
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
                FIPS: {county?.fips_code} • {county?.is_rural ? 'Rural' : 'Urban'}
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