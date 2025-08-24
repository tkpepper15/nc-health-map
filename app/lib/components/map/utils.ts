/**
 * Map utility functions
 */

import { County, HealthcareMetrics } from '../../../types/healthcare';
import { DataLayer } from '../../../components/DataLayers/DataLayerSelector';
import { getLayerColor, getLayerValue } from '../../../utils/dataLayers';

/**
 * Get the color for a county based on the selected metric
 */
export function getCountyColor(
  county: County,
  healthcareData: HealthcareMetrics[],
  selectedMetric: DataLayer
): string {
  const data = healthcareData.find(d => d.countyId === county.id || d.fips_code === county.fips);
  if (!data) return '#e5e7eb';
  
  const value = getLayerValue(data, selectedMetric);
  return getLayerColor(selectedMetric, value);
}

/**
 * Get styled county properties for Leaflet
 */
export function getCountyStyle(
  county: County,
  healthcareData: HealthcareMetrics[],
  selectedMetric: DataLayer,
  isSelected: boolean = false,
  isHovered: boolean = false
) {
  const fillColor = getCountyColor(county, healthcareData, selectedMetric);
  
  return {
    fillColor,
    fillOpacity: isSelected ? 0.9 : isHovered ? 0.8 : 0.7,
    color: isSelected ? '#1f2937' : isHovered ? '#374151' : '#9ca3af',
    weight: isSelected ? 3 : isHovered ? 2 : 1,
    opacity: 1,
  };
}

/**
 * Format county data for tooltip display
 */
export function formatCountyData(
  county: County,
  healthcareData: HealthcareMetrics | null,
  selectedMetric: DataLayer
): {
  name: string;
  value: string;
  category?: string;
  additionalInfo?: Array<{ label: string; value: string }>;
} {
  if (!healthcareData) {
    return {
      name: county.name,
      value: 'No data available'
    };
  }

  const value = getLayerValue(healthcareData, selectedMetric);
  let formattedValue: string;
  let additionalInfo: Array<{ label: string; value: string }> = [];

  switch (selectedMetric.id) {
    case 'hcvi':
      formattedValue = value !== null ? value.toFixed(1) : 'N/A';
      additionalInfo = [
        { label: 'Category', value: healthcareData.vulnerability_category || 'Unknown' },
        { label: 'Population', value: healthcareData.population_2020?.toLocaleString() || 'N/A' }
      ];
      break;
    case 'medicaid':
      formattedValue = value !== null ? `${value.toFixed(1)}%` : 'N/A';
      additionalInfo = [
        { label: 'Total Enrollment', value: healthcareData.medicaid_total_enrollment?.toLocaleString() || 'N/A' }
      ];
      break;
    case 'svi':
      formattedValue = value !== null ? value.toFixed(1) : 'N/A';
      break;
    default:
      formattedValue = value !== null ? value.toString() : 'N/A';
  }

  return {
    name: county.name,
    value: formattedValue,
    category: healthcareData.vulnerability_category,
    additionalInfo
  };
}

/**
 * North Carolina map bounds
 */
export const NC_BOUNDS = {
  north: 36.588,
  south: 33.842,
  east: -75.460,
  west: -84.322
};

/**
 * Default map viewport for North Carolina
 */
export const NC_DEFAULT_VIEWPORT = {
  center: [35.5, -79.5] as [number, number],
  zoom: 7
};

/**
 * Validate if coordinates are within North Carolina bounds
 */
export function isWithinNCBounds(lat: number, lng: number): boolean {
  return (
    lat >= NC_BOUNDS.south &&
    lat <= NC_BOUNDS.north &&
    lng >= NC_BOUNDS.west &&
    lng <= NC_BOUNDS.east
  );
}