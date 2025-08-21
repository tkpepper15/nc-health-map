/**
 * Healthcare Vulnerability Index (HCVI) Calculation System
 * Inspired by the Climate-Conflict-Vulnerability Index (CCVI) methodology
 * 
 * This system implements a three-pillar composite scoring framework
 * following IPCC risk assessment methodologies adapted for healthcare vulnerability.
 */

import { HealthcareMetrics } from '../types/healthcare';

// HCVI Framework Constants (following CCVI methodology)
const HCVI_WEIGHTS = {
  healthcareAccess: 0.33,      // Healthcare Access Pillar (33%)
  policyRisk: 0.33,            // Policy Risk Pillar (33%)  
  economicVulnerability: 0.34  // Economic Vulnerability Pillar (34%)
} as const;

// Sub-component weights within each pillar
const PILLAR_WEIGHTS = {
  healthcareAccess: {
    providerDensity: 0.30,       // Provider availability
    geographicAccess: 0.25,      // Geographic barriers
    specialtyServices: 0.25,     // Specialty care access
    insuranceCoverage: 0.20      // Insurance coverage
  },
  policyRisk: {
    medicaidDependency: 0.30,    // Medicaid expansion risk
    federalFundingReliance: 0.25, // Federal funding exposure
    snapVulnerability: 0.25,     // SNAP program risk
    workRequirementImpact: 0.20  // Work requirement effects
  },
  economicVulnerability: {
    hospitalFinancialHealth: 0.30, // Hospital financial status
    privateEquityExposure: 0.25,   // PE ownership risk
    healthcareEmployment: 0.25,    // Healthcare job dependency
    socialDeterminants: 0.20       // Social determinants
  }
} as const;

// Normalization parameters for creating 1-10 scale
const NORMALIZATION_PARAMS = {
  healthcareAccess: {
    providerDensity: { min: 5, max: 35, inverted: true },  // Higher is better
    geographicAccess: { min: 5, max: 60, inverted: false }, // Lower is better
    specialtyServices: { min: 1, max: 10, inverted: true },
    insuranceCoverage: { min: 70, max: 95, inverted: true }
  },
  policyRisk: {
    medicaidDependency: { min: 10, max: 50, inverted: false },
    federalFundingReliance: { min: 20, max: 80, inverted: false },
    snapVulnerability: { min: 5, max: 40, inverted: false },
    workRequirementImpact: { min: 1, max: 15, inverted: false }
  },
  economicVulnerability: {
    hospitalFinancialHealth: { min: 1, max: 10, inverted: true },
    privateEquityExposure: { min: 5, max: 60, inverted: false },
    healthcareEmployment: { min: 10, max: 35, inverted: false },
    socialDeterminants: { min: 1, max: 10, inverted: false }
  }
} as const;

/**
 * Normalize raw value to 1-10 scale
 * Following CCVI's perceptually uniform scaling approach
 */
function normalizeToScale(
  value: number, 
  min: number, 
  max: number, 
  inverted: boolean = false
): number {
  // Clamp value to bounds
  const clampedValue = Math.max(min, Math.min(max, value));
  
  // Linear normalization to 0-1
  const normalized = (clampedValue - min) / (max - min);
  
  // Invert if higher raw values should mean lower vulnerability
  const adjusted = inverted ? 1 - normalized : normalized;
  
  // Scale to 1-10 range with slight curve for better distribution
  return Math.max(1, Math.min(10, 1 + (adjusted * 9)));
}

/**
 * Calculate composite score for a pillar using weighted components
 * Implements CCVI's hierarchical aggregation methodology
 */
function calculatePillarScore(
  rawData: Record<string, number>,
  pillarKey: keyof typeof PILLAR_WEIGHTS,
  weights: Record<string, number>
): { score: number; components: Record<string, number> } {
  const normParams = NORMALIZATION_PARAMS[pillarKey];
  const components: Record<string, number> = {};
  let weightedSum = 0;
  let totalWeight = 0;

  // Calculate normalized scores for each component
  Object.entries(weights).forEach(([component, weight]) => {
    const rawValue = rawData[component];
    const params = (normParams as any)[component];
    
    if (rawValue !== undefined && params) {
      const normalizedScore = normalizeToScale(
        rawValue, 
        params.min, 
        params.max, 
        params.inverted
      );
      
      components[component] = normalizedScore;
      weightedSum += normalizedScore * weight;
      totalWeight += weight;
    }
  });

  // Calculate weighted average
  const score = totalWeight > 0 ? weightedSum / totalWeight : 5; // Default to middle if no data
  
  return { score, components };
}

/**
 * Calculate Healthcare Vulnerability Index (HCVI) score
 * Implements CCVI's three-pillar composite methodology
 */
export function calculateHCVI(data: any): {
  hcvi: number;
  pillarScores: {
    healthcareAccess: number;
    policyRisk: number;
    economicVulnerability: number;
  };
  componentScores: {
    healthcareAccess: Record<string, number>;
    policyRisk: Record<string, number>;
    economicVulnerability: Record<string, number>;
  };
  category: 'low' | 'moderate' | 'high' | 'extreme';
  percentile: number;
} {
  // Calculate pillar scores
  const healthcareAccessResult = calculatePillarScore(
    data.healthcareAccess || {},
    'healthcareAccess',
    PILLAR_WEIGHTS.healthcareAccess
  );
  
  const policyRiskResult = calculatePillarScore(
    data.policyRisk || {},
    'policyRisk',
    PILLAR_WEIGHTS.policyRisk
  );
  
  const economicVulnerabilityResult = calculatePillarScore(
    data.economicVulnerability || {},
    'economicVulnerability',
    PILLAR_WEIGHTS.economicVulnerability
  );

  // Calculate composite HCVI score using weighted average
  const hcvi = (
    healthcareAccessResult.score * HCVI_WEIGHTS.healthcareAccess +
    policyRiskResult.score * HCVI_WEIGHTS.policyRisk +
    economicVulnerabilityResult.score * HCVI_WEIGHTS.economicVulnerability
  );

  // Determine vulnerability category
  let category: 'low' | 'moderate' | 'high' | 'extreme';
  if (hcvi >= 8.5) category = 'extreme';
  else if (hcvi >= 6.5) category = 'high';
  else if (hcvi >= 4.0) category = 'moderate';
  else category = 'low';

  // Calculate percentile (simplified - would use actual distribution in production)
  const percentile = Math.round(((hcvi - 1) / 9) * 100);

  return {
    hcvi: Math.round(hcvi * 10) / 10, // Round to 1 decimal place
    pillarScores: {
      healthcareAccess: Math.round(healthcareAccessResult.score * 10) / 10,
      policyRisk: Math.round(policyRiskResult.score * 10) / 10,
      economicVulnerability: Math.round(economicVulnerabilityResult.score * 10) / 10
    },
    componentScores: {
      healthcareAccess: healthcareAccessResult.components,
      policyRisk: policyRiskResult.components,
      economicVulnerability: economicVulnerabilityResult.components
    },
    category,
    percentile
  };
}

/**
 * Get color mapping for HCVI scores
 * Uses perceptually uniform color scales following CCVI design principles
 */
export function getHCVIColor(score: number): string {
  // Perceptually uniform color scale from green (low) to red (high)
  const colors = [
    '#22c55e', // Green - Low vulnerability (1-2.5)
    '#84cc16', // Light green (2.5-4)
    '#eab308', // Yellow - Moderate vulnerability (4-6.5)
    '#f97316', // Orange - High vulnerability (6.5-8.5)
    '#dc2626'  // Red - Extreme vulnerability (8.5-10)
  ];
  
  if (score <= 2.5) return colors[0];
  if (score <= 4.0) return colors[1];
  if (score <= 6.5) return colors[2];
  if (score <= 8.5) return colors[3];
  return colors[4];
}

/**
 * Get pillar-specific color mapping
 * Following CCVI's three-pillar color scheme
 */
export function getPillarColor(pillar: keyof typeof HCVI_WEIGHTS): string {
  const pillarColors = {
    healthcareAccess: '#3b82f6',    // Blue - Healthcare Access
    policyRisk: '#dc2626',          // Red - Policy Risk
    economicVulnerability: '#f59e0b' // Orange - Economic Vulnerability
  };
  
  return pillarColors[pillar];
}

/**
 * Calculate relative rankings for a set of counties
 * Implements CCVI's comparative analysis methodology
 */
export function calculateCountyRankings(
  counties: Array<{ id: string; hcvi: number }>
): Array<{ id: string; hcvi: number; rank: number; percentile: number }> {
  // Sort by HCVI score (descending - higher scores = higher vulnerability)
  const sorted = counties.sort((a, b) => b.hcvi - a.hcvi);
  
  return sorted.map((county, index) => ({
    ...county,
    rank: index + 1,
    percentile: Math.round(((counties.length - index) / counties.length) * 100)
  }));
}

/**
 * Generate summary statistics for HCVI distribution
 * Following CCVI's statistical analysis approach
 */
export function getHCVIStatistics(scores: number[]): {
  mean: number;
  median: number;
  standardDeviation: number;
  quartiles: [number, number, number];
  distribution: { category: string; count: number; percentage: number }[];
} {
  const sorted = scores.sort((a, b) => a - b);
  const n = sorted.length;
  
  // Calculate basic statistics
  const mean = sorted.reduce((sum, score) => sum + score, 0) / n;
  const median = n % 2 === 0 
    ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
    : sorted[Math.floor(n/2)];
  
  const variance = sorted.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate quartiles
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const quartiles: [number, number, number] = [q1, median, q3];
  
  // Calculate distribution by category
  const distribution = [
    { category: 'Low', count: 0, percentage: 0 },
    { category: 'Moderate', count: 0, percentage: 0 },
    { category: 'High', count: 0, percentage: 0 },
    { category: 'Extreme', count: 0, percentage: 0 }
  ];
  
  scores.forEach(score => {
    if (score < 4.0) distribution[0].count++;
    else if (score < 6.5) distribution[1].count++;
    else if (score < 8.5) distribution[2].count++;
    else distribution[3].count++;
  });
  
  distribution.forEach(item => {
    item.percentage = Math.round((item.count / n) * 100);
  });
  
  return {
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    quartiles,
    distribution
  };
}