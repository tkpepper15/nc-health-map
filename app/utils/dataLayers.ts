/**
 * Real Data Layer System for Healthcare Mapping
 * Only includes layers with actual data available from Supabase
 */

import { HealthcareMetrics, MetricLayer } from '../types/healthcare';

// Real data layer configuration - only includes verified data sources
export const DATA_LAYERS: Record<string, MetricLayer> = {
  // Medicaid Enrollment Data (Real from state databases)
  medicaid: {
    id: 'medicaid',
    name: 'Medicaid Enrollment',
    description: 'Real enrollment rates by county',
    category: 'healthcare',
    colorScale: {
      type: 'sequential',
      colors: ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'],
      domain: [10, 60] // 10% to 60% enrollment rate
    },
    legend: {
      title: 'Enrollment Rate (%)',
      items: [
        { color: '#dbeafe', label: '10-20%', value: 10 },
        { color: '#93c5fd', label: '20-30%', value: 20 },
        { color: '#60a5fa', label: '30-40%', value: 30 },
        { color: '#3b82f6', label: '40-50%', value: 40 },
        { color: '#1d4ed8', label: '50%+', value: 50 }
      ]
    }
  },

  // Social Vulnerability Index (Real CDC data)
  svi: {
    id: 'svi',
    name: 'Social Vulnerability',
    description: 'CDC Social Vulnerability Index percentiles',
    category: 'social',
    colorScale: {
      type: 'sequential',
      colors: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#dc2626'],
      domain: [0, 100] // SVI percentile ranks
    },
    legend: {
      title: 'SVI Percentile',
      items: [
        { color: '#22c55e', label: '0-20th (Low)', value: 0 },
        { color: '#84cc16', label: '20-40th', value: 20 },
        { color: '#eab308', label: '40-60th', value: 40 },
        { color: '#f97316', label: '60-80th', value: 60 },
        { color: '#dc2626', label: '80-100th (High)', value: 80 }
      ]
    }
  },

  // Hospital Infrastructure (Real facility data)
  hospitals: {
    id: 'hospitals',
    name: 'Hospital Infrastructure',
    description: 'Licensed hospital facilities',
    category: 'infrastructure',
    colorScale: {
      type: 'categorical',
      colors: ['#1e40af', '#3b82f6', '#60a5fa', '#dc2626'],
      domain: [0, 4]
    },
    legend: {
      title: 'Facility Type',
      items: [
        { color: '#1e40af', label: 'Large Hospital (100+ beds)', value: 0 },
        { color: '#3b82f6', label: 'Medium Hospital (50-99 beds)', value: 1 },
        { color: '#60a5fa', label: 'Small Hospital (<50 beds)', value: 2 },
        { color: '#dc2626', label: 'Emergency Department', value: 3 }
      ]
    }
  }
};

/**
 * Get data layer configuration by ID
 */
export function getDataLayer(layerId: string): MetricLayer | null {
  return DATA_LAYERS[layerId] || null;
}

/**
 * Get color for a specific data value in a layer
 */
export function getLayerColor(layerId: string, value: number | null): string {
  const layer = getDataLayer(layerId);
  if (!layer || value === null || value === undefined) return '#9ca3af'; // Default gray for null/missing data
  
  const { colors, domain } = layer.colorScale;
  const [min, max] = domain;
  
  // Normalize value to 0-1 range
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Map to color scale
  const colorIndex = Math.floor(normalized * (colors.length - 1));
  
  return colors[colorIndex];
}

/**
 * Extract data value for a specific layer from healthcare metrics
 */
export function getLayerValue(data: HealthcareMetrics | null, layerId: string): number | null {
  if (!data) return null;
  
  switch (layerId) {
    case 'medicaid':
      return data.medicaid_enrollment_rate;
    case 'svi':
      return data.svi_data?.svi_overall_percentile ?? null;
    case 'hospitals':
      return null; // Hospital layer doesn't use county-level values
    default:
      return null;
  }
}

/**
 * Calculate layer statistics for real data only
 */
export function calculateLayerStatistics(
  data: HealthcareMetrics[],
  layerId: string
): {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
} {
  const values = data
    .map(d => getLayerValue(d, layerId))
    .filter((v): v is number => v !== null && !isNaN(v));
  
  if (values.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, median: 0, q1: 0, q3: 0 };
  }
  
  const sorted = values.sort((a, b) => a - b);
  const n = sorted.length;
  
  const mean = sorted.reduce((sum, val) => sum + val, 0) / n;
  const median = n % 2 === 0 
    ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
    : sorted[Math.floor(n/2)];
  
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  
  return {
    count: n,
    min: sorted[0],
    max: sorted[n - 1],
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    q1,
    q3
  };
}