export interface County {
  id: string;
  name: string;
  fips: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    name: string;
    population: number;
    area: number;
    classification: 'urban' | 'rural' | 'frontier';
  };
}

export interface HealthcareMetrics {
  countyId: string;
  countyName: string;
  fips_code: string;
  vulnerability_category: string;
  vulnerability_color: string;
  hcvi_composite: number | null;
  policy_risk_score: number | null;
  healthcare_access_score: number | null;
  economic_vulnerability_score: number | null;
  population_2020: number | null;
  is_rural: boolean;
  medicaid_enrollment_rate: number | null;
  medicaid_dependency_ratio: number | null;
  medicaid_total_enrollment: number | null;
  medicaid_expansion_enrollment: number | null;
  medicaid_traditional_enrollment: number | null;
  
  // SVI Data
  svi_data?: {
    fips_code: string;
    county_name: string;
    svi_overall_percentile: number;
    socioeconomic_percentile: number;
    household_composition_percentile: number;
    racial_minority_percentile: number;
    housing_transport_percentile: number;
  };
  
  // Healthcare Access (33% of HCVI)
  healthcareAccess: {
    providerDensity: number; // physicians per 10,000 residents
    geographicAccess: number; // average minutes to hospital
    specialtyServices: number; // availability score 1-10
    insuranceCoverage: number; // % insured
    score: number; // 1-10 composite score
  };
  
  // Policy Risk (33% of HCVI)
  policyRisk: {
    medicaidDependency: number; // % population on Medicaid expansion
    federalFundingReliance: number; // % hospital revenue from federal sources
    snapVulnerability: number; // SNAP participation rate
    workRequirementImpact: number; // projected coverage losses
    score: number; // 1-10 composite score
  };
  
  // Economic Vulnerability (34% of HCVI)
  economicVulnerability: {
    hospitalFinancialHealth: number; // operating margin percentile
    privateEquityExposure: number; // % facilities PE-owned
    healthcareEmployment: number; // % jobs in healthcare
    socialDeterminants: number; // poverty/education composite
    score: number; // 1-10 composite score
  };
  
  // Overall Healthcare Vulnerability Index
  hcvi: {
    score: number; // 1-10 overall score
    ranking: number; // 1-100 county ranking
    category: 'low' | 'moderate' | 'high' | 'extreme';
    color: string; // hex color for mapping
  };
}

export interface Hospital {
  id: string;
  name: string;
  countyId: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: 'rural' | 'urban' | 'critical_access' | 'specialty';
  bedCount: number;
  financialHealth: {
    operatingMargin: number;
    closureRisk: 'low' | 'moderate' | 'high' | 'critical';
    privateEquityOwned: boolean;
  };
  services: string[];
}

export interface PolicyImpact {
  countyId: string;
  medicaidExpansion: {
    currentEnrollment: number;
    projectedLosses: number;
    revenueImpact: number; // millions
  };
  snapChanges: {
    currentParticipation: number;
    projectedCuts: number;
    economicImpact: number; // millions
  };
  hospitalImpact: {
    revenueAtRisk: number; // millions
    jobsAtRisk: number;
    closureRisk: boolean;
  };
}

export interface MetricLayer {
  id: string;
  name: string;
  description: string;
  category: 'healthcare-access' | 'policy-risk' | 'economic-vulnerability' | 'composite';
  colorScale: {
    type: 'sequential' | 'diverging' | 'categorical';
    colors: string[];
    domain: [number, number];
  };
  legend: {
    title: string;
    items: Array<{
      color: string;
      label: string;
      value?: number;
    }>;
  };
}

export interface CountyDetailData {
  county: County;
  metrics: HealthcareMetrics;
  hospitals: Hospital[];
  policyImpacts: PolicyImpact;
  demographics: {
    population: number;
    medianAge: number;
    povertyRate: number;
    uninsuredRate: number;
    ruralPopulation: number;
  };
  trends: {
    year: number;
    hcviScore: number;
    hospitalCount: number;
    medicaidEnrollment: number;
  }[];
}

export interface AppState {
  selectedMetric: string;
  selectedCounty: string | null;
  activeLayer: string;
  sidebarOpen: boolean;
  mapView: {
    center: [number, number];
    zoom: number;
  };
  filters: {
    classification: string[];
    hcviRange: [number, number];
    riskLevel: string[];
  };
}