/**
 * CCVI-inspired Data Layer System for Healthcare Vulnerability Mapping
 * 
 * This system implements hierarchical data visualization layers following
 * the CCVI's three-pillar architecture with brushing and linking capabilities.
 */

import { HealthcareMetrics, MetricLayer } from '../types/healthcare';
import { getPillarColor } from './hcviCalculation';

// Layer configuration following CCVI's design principles
export const DATA_LAYERS: Record<string, MetricLayer> = {
  // Composite HCVI Layer (default)
  hcvi: {
    id: 'hcvi',
    name: 'Healthcare Vulnerability Index',
    description: 'Composite vulnerability score combining all three pillars',
    category: 'composite',
    colorScale: {
      type: 'sequential',
      colors: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#dc2626'],
      domain: [1, 10]
    },
    legend: {
      title: 'HCVI Score',
      items: [
        { color: '#22c55e', label: 'Low Vulnerability', value: 1 },
        { color: '#84cc16', label: 'Low-Moderate', value: 2.5 },
        { color: '#eab308', label: 'Moderate Vulnerability', value: 4 },
        { color: '#f97316', label: 'High Vulnerability', value: 6.5 },
        { color: '#dc2626', label: 'Extreme Vulnerability', value: 8.5 }
      ]
    }
  },

  // Healthcare Access Pillar
  'healthcare-access': {
    id: 'healthcare-access',
    name: 'Healthcare Access',
    description: 'Provider density, geographic access, and insurance coverage',
    category: 'healthcare-access',
    colorScale: {
      type: 'sequential',
      colors: ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'],
      domain: [1, 10]
    },
    legend: {
      title: 'Access Score',
      items: [
        { color: '#1d4ed8', label: 'Excellent Access', value: 1 },
        { color: '#3b82f6', label: 'Good Access', value: 3 },
        { color: '#60a5fa', label: 'Limited Access', value: 5 },
        { color: '#93c5fd', label: 'Poor Access', value: 7 },
        { color: '#dbeafe', label: 'Very Poor Access', value: 9 }
      ]
    }
  },

  // Healthcare Access Sub-components
  'provider-density': {
    id: 'provider-density',
    name: 'Provider Density',
    description: 'Primary care physicians per 10,000 residents',
    category: 'healthcare-access',
    colorScale: {
      type: 'sequential',
      colors: ['#dc2626', '#f97316', '#eab308', '#84cc16', '#22c55e'],
      domain: [5, 35]
    },
    legend: {
      title: 'Providers per 10k',
      items: [
        { color: '#22c55e', label: 'High Density', value: 30 },
        { color: '#84cc16', label: 'Adequate', value: 20 },
        { color: '#eab308', label: 'Limited', value: 15 },
        { color: '#f97316', label: 'Low', value: 10 },
        { color: '#dc2626', label: 'Very Low', value: 5 }
      ]
    }
  },

  'geographic-access': {
    id: 'geographic-access',
    name: 'Geographic Access',
    description: 'Average travel time to nearest hospital',
    category: 'healthcare-access',
    colorScale: {
      type: 'sequential',
      colors: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#dc2626'],
      domain: [5, 60]
    },
    legend: {
      title: 'Travel Time (min)',
      items: [
        { color: '#22c55e', label: 'Very Close', value: 5 },
        { color: '#84cc16', label: 'Close', value: 15 },
        { color: '#eab308', label: 'Moderate', value: 25 },
        { color: '#f97316', label: 'Far', value: 40 },
        { color: '#dc2626', label: 'Very Far', value: 60 }
      ]
    }
  },

  // Policy Risk Pillar
  'policy-risk': {
    id: 'policy-risk',
    name: 'Policy Risk',
    description: 'Vulnerability to federal healthcare policy changes',
    category: 'policy-risk',
    colorScale: {
      type: 'sequential',
      colors: ['#fee2e2', '#fecaca', '#f87171', '#ef4444', '#dc2626'],
      domain: [1, 10]
    },
    legend: {
      title: 'Policy Risk',
      items: [
        { color: '#fee2e2', label: 'Low Risk', value: 1 },
        { color: '#fecaca', label: 'Moderate Risk', value: 3 },
        { color: '#f87171', label: 'High Risk', value: 5 },
        { color: '#ef4444', label: 'Very High Risk', value: 7 },
        { color: '#dc2626', label: 'Extreme Risk', value: 9 }
      ]
    }
  },

  // Policy Risk Sub-components
  'medicaid-dependency': {
    id: 'medicaid-dependency',
    name: 'Medicaid Dependency',
    description: 'Percentage of population dependent on Medicaid expansion',
    category: 'policy-risk',
    colorScale: {
      type: 'sequential',
      colors: ['#fee2e2', '#fecaca', '#f87171', '#ef4444', '#dc2626'],
      domain: [10, 50]
    },
    legend: {
      title: 'Medicaid Dependency (%)',
      items: [
        { color: '#fee2e2', label: 'Low', value: 10 },
        { color: '#fecaca', label: 'Moderate', value: 20 },
        { color: '#f87171', label: 'High', value: 30 },
        { color: '#ef4444', label: 'Very High', value: 40 },
        { color: '#dc2626', label: 'Extreme', value: 50 }
      ]
    }
  },

  'federal-funding': {
    id: 'federal-funding',
    name: 'Federal Funding Reliance',
    description: 'Hospital revenue from federal sources',
    category: 'policy-risk',
    colorScale: {
      type: 'sequential',
      colors: ['#fee2e2', '#fecaca', '#f87171', '#ef4444', '#dc2626'],
      domain: [20, 80]
    },
    legend: {
      title: 'Federal Funding (%)',
      items: [
        { color: '#fee2e2', label: 'Low Reliance', value: 20 },
        { color: '#fecaca', label: 'Moderate', value: 35 },
        { color: '#f87171', label: 'High', value: 50 },
        { color: '#ef4444', label: 'Very High', value: 65 },
        { color: '#dc2626', label: 'Extreme', value: 80 }
      ]
    }
  },

  // Economic Vulnerability Pillar
  'economic-vulnerability': {
    id: 'economic-vulnerability',
    name: 'Economic Vulnerability',
    description: 'Healthcare system financial stability and market risks',
    category: 'economic-vulnerability',
    colorScale: {
      type: 'sequential',
      colors: ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c'],
      domain: [1, 10]
    },
    legend: {
      title: 'Economic Risk',
      items: [
        { color: '#fed7aa', label: 'Stable', value: 1 },
        { color: '#fdba74', label: 'At Risk', value: 3 },
        { color: '#fb923c', label: 'Vulnerable', value: 5 },
        { color: '#f97316', label: 'High Risk', value: 7 },
        { color: '#ea580c', label: 'Critical', value: 9 }
      ]
    }
  },

  // Economic Vulnerability Sub-components
  'hospital-financial': {
    id: 'hospital-financial',
    name: 'Hospital Financial Health',
    description: 'Hospital operating margins and financial stability',
    category: 'economic-vulnerability',
    colorScale: {
      type: 'sequential',
      colors: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#dc2626'],
      domain: [1, 10]
    },
    legend: {
      title: 'Financial Health',
      items: [
        { color: '#22c55e', label: 'Excellent', value: 9 },
        { color: '#84cc16', label: 'Good', value: 7 },
        { color: '#eab308', label: 'Fair', value: 5 },
        { color: '#f97316', label: 'Poor', value: 3 },
        { color: '#dc2626', label: 'Critical', value: 1 }
      ]
    }
  },

  'private-equity': {
    id: 'private-equity',
    name: 'Private Equity Exposure',
    description: 'Percentage of healthcare facilities owned by private equity',
    category: 'economic-vulnerability',
    colorScale: {
      type: 'sequential',
      colors: ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c'],
      domain: [5, 60]
    },
    legend: {
      title: 'PE Ownership (%)',
      items: [
        { color: '#fed7aa', label: 'Low', value: 5 },
        { color: '#fdba74', label: 'Moderate', value: 15 },
        { color: '#fb923c', label: 'High', value: 30 },
        { color: '#f97316', label: 'Very High', value: 45 },
        { color: '#ea580c', label: 'Extreme', value: 60 }
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
 * Get all available data layers grouped by category
 */
export function getDataLayersByCategory(): Record<string, MetricLayer[]> {
  const grouped: Record<string, MetricLayer[]> = {};
  
  Object.values(DATA_LAYERS).forEach(layer => {
    if (!grouped[layer.category]) {
      grouped[layer.category] = [];
    }
    grouped[layer.category].push(layer);
  });
  
  return grouped;
}

/**
 * Get color for a specific data value in a layer
 * Implements CCVI's perceptually uniform color mapping
 */
export function getLayerColor(layerId: string, value: number): string {
  const layer = getDataLayer(layerId);
  if (!layer) return '#9ca3af'; // Default gray
  
  const { colors, domain } = layer.colorScale;
  const [min, max] = domain;
  
  // Normalize value to 0-1 range
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Map to color scale
  const colorIndex = Math.floor(normalized * (colors.length - 1));
  const nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
  
  // For now, return discrete colors (could implement interpolation)
  return colors[colorIndex];
}

/**
 * Extract data value for a specific layer from healthcare metrics
 */
export function getLayerValue(layerId: string, data: HealthcareMetrics): number {
  switch (layerId) {
    case 'hcvi':
      return data.hcvi.score;
    case 'healthcare-access':
      return data.healthcareAccess.score;
    case 'provider-density':
      return data.healthcareAccess.providerDensity;
    case 'geographic-access':
      return data.healthcareAccess.geographicAccess;
    case 'policy-risk':
      return data.policyRisk.score;
    case 'medicaid-dependency':
      return data.policyRisk.medicaidDependency;
    case 'federal-funding':
      return data.policyRisk.federalFundingReliance;
    case 'economic-vulnerability':
      return data.economicVulnerability.score;
    case 'hospital-financial':
      return data.economicVulnerability.hospitalFinancialHealth;
    case 'private-equity':
      return data.economicVulnerability.privateEquityExposure;
    default:
      return 0;
  }
}

/**
 * Get layer hierarchy for coordinated visualization
 * Implements CCVI's brushing and linking pattern
 */
export function getLayerHierarchy(): {
  parent: string;
  children: string[];
}[] {
  return [
    {
      parent: 'hcvi',
      children: ['healthcare-access', 'policy-risk', 'economic-vulnerability']
    },
    {
      parent: 'healthcare-access',
      children: ['provider-density', 'geographic-access']
    },
    {
      parent: 'policy-risk',
      children: ['medicaid-dependency', 'federal-funding']
    },
    {
      parent: 'economic-vulnerability',
      children: ['hospital-financial', 'private-equity']
    }
  ];
}

/**
 * Calculate layer statistics for distribution analysis
 * Following CCVI's statistical methodology
 */
export function calculateLayerStatistics(
  layerId: string,
  data: HealthcareMetrics[]
): {
  min: number;
  max: number;
  mean: number;
  median: number;
  quartiles: [number, number, number];
} {
  const values = data.map(d => getLayerValue(layerId, d)).filter(v => v !== undefined);
  const sorted = values.sort((a, b) => a - b);
  const n = sorted.length;
  
  const min = sorted[0];
  const max = sorted[n - 1];
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const median = n % 2 === 0 
    ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
    : sorted[Math.floor(n/2)];
  
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  
  return {
    min,
    max,
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    quartiles: [q1, median, q3]
  };
}