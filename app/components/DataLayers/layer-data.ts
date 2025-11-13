import { DataLayer } from './DataLayerSelector';

export interface LayerInfo {
  title: string;
  description: string;
  dataRecency: string;
  source: string;
  keyMetric: string;
  totalRecords: string;
  insights: string;
}

export const layerInfoMap: Partial<Record<DataLayer, LayerInfo>> = {
  // Medicaid Categories
  medicaid_total: {
    title: 'Total Medicaid Enrollment',
    description: 'All Medicaid categories combined across North Carolina counties.',
    dataRecency: 'June 2025',
    source: 'NC DHHS',
    keyMetric: 'Total Enrollment',
    totalRecords: '100 counties',
    insights: 'Total enrollment reflects economic needs and healthcare vulnerability across regions.'
  },
  medicaid_aged: {
    title: 'Aged Medicaid (65+)',
    description: 'Traditional Medicaid enrollment for seniors aged 65 and older.',
    dataRecency: 'June 2025',
    source: 'NC DHHS',
    keyMetric: 'Aged Enrollment',
    totalRecords: '100 counties',
    insights: 'Aged populations show higher concentrations in rural and economically challenged counties.'
  },
  medicaid_disabled: {
    title: 'Disabled Adults',
    description: 'Traditional Medicaid enrollment for disabled adults.',
    dataRecency: 'June 2025',
    source: 'NC DHHS',
    keyMetric: 'Disabled Enrollment',
    totalRecords: '100 counties',
    insights: 'Disability rates correlate with economic vulnerability and healthcare access challenges.'
  },
  medicaid_blind: {
    title: 'Blind Adults',
    description: 'Traditional Medicaid enrollment for blind individuals.',
    dataRecency: 'June 2025',
    source: 'NC DHHS',
    keyMetric: 'Blind Enrollment',
    totalRecords: '100 counties',
    insights: 'Blind population represents a specialized category with specific healthcare needs.'
  },
  medicaid_expansion: {
    title: 'Medicaid Expansion Adults',
    description: 'Adults enrolled through Medicaid expansion program.',
    dataRecency: 'June 2025',
    source: 'NC DHHS',
    keyMetric: 'Expansion Enrollment',
    totalRecords: '100 counties',
    insights: 'Expansion enrollment varies significantly based on county economic conditions.'
  },
  medicaid_children: {
    title: 'Children & Infants',
    description: 'Infants, children, TANF and other child welfare categories.',
    dataRecency: 'June 2025',
    source: 'NC DHHS',
    keyMetric: 'Child Enrollment',
    totalRecords: '100 counties',
    insights: 'Child enrollment reflects family poverty rates and regional economic disparities.'
  },
  medicaid_pregnant: {
    title: 'Pregnant Women & Family Planning',
    description: 'Pregnant women and family planning services enrollment.',
    dataRecency: 'June 2025',
    source: 'NC DHHS',
    keyMetric: 'Maternal Enrollment',
    totalRecords: '100 counties',
    insights: 'Maternal health enrollment indicates reproductive health vulnerability.'
  },
  medicaid: {
    title: 'Medicaid Enrollment Analysis',
    description: 'This view displays county-level Medicaid enrollment data from North Carolina Department of Health and Human Services. The data shows total enrollment, expansion vs. traditional Medicaid splits, and enrollment rates as percentages of county population. Darker blue areas indicate higher enrollment rates, reflecting both healthcare needs and program accessibility.',
    dataRecency: 'June 2025',
    source: 'NC DHHS',
    keyMetric: 'Enrollment Rate (%)',
    totalRecords: '100 counties',
    insights: 'Rural counties often show higher Medicaid dependency rates due to economic factors and limited private insurance options.'
  },
  // SVI Categories
  svi_overall: {
    title: 'Overall SVI Ranking',
    description: 'Composite Social Vulnerability Index ranking across all themes.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'SVI Percentile',
    totalRecords: '100 counties',
    insights: 'Overall vulnerability combines economic, social, and housing vulnerabilities.'
  },
  svi_socioeconomic: {
    title: 'Theme 1: Socioeconomic Status',
    description: 'Poverty, unemployment, housing burden, and education factors.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'SVI Percentile',
    totalRecords: '100 counties',
    insights: 'Socioeconomic vulnerability is a primary driver of health disparities.'
  },
  svi_household: {
    title: 'Theme 2: Household Composition',
    description: 'Age, disability, and single-parent household characteristics.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'SVI Percentile',
    totalRecords: '100 counties',
    insights: 'Household composition affects healthcare access and social support systems.'
  },
  svi_minority: {
    title: 'Theme 3: Racial & Ethnic Minority',
    description: 'Minority population percentage and linguistic isolation.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'SVI Percentile',
    totalRecords: '100 counties',
    insights: 'Minority status correlates with historical healthcare inequities.'
  },
  svi_housing: {
    title: 'Theme 4: Housing & Transportation',
    description: 'Housing types, crowding, and vehicle access.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'SVI Percentile',
    totalRecords: '100 counties',
    insights: 'Housing and transportation access directly impact healthcare utilization.'
  },
  svi_poverty: {
    title: 'Below 150% Poverty Line',
    description: 'Population below 150% of federal poverty line.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'Poverty Rate (%)',
    totalRecords: '100 counties',
    insights: 'Poverty is strongly associated with health vulnerability and limited healthcare access.'
  },
  svi_unemployment: {
    title: 'Unemployment Rate',
    description: 'Civilian unemployment rate.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'Unemployment Rate (%)',
    totalRecords: '100 counties',
    insights: 'High unemployment correlates with lack of employer-sponsored insurance.'
  },
  svi_no_insurance: {
    title: 'No Health Insurance',
    description: 'Population without health insurance coverage.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'Uninsured Rate (%)',
    totalRecords: '100 counties',
    insights: 'Uninsured populations face significant barriers to healthcare access.'
  },
  svi_disability: {
    title: 'Population with Disability',
    description: 'Civilian population with disability.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'Disability Rate (%)',
    totalRecords: '100 counties',
    insights: 'Disability is associated with higher healthcare needs and costs.'
  },
  svi: {
    title: 'Social Vulnerability Analysis',
    description: 'The CDC Social Vulnerability Index (SVI) measures community resilience to disasters and health emergencies. It combines 16 census variables across four themes: socioeconomic status, household characteristics, racial/ethnic minority status, and housing/transportation. Higher percentiles indicate greater vulnerability requiring enhanced disaster preparedness and resource allocation.',
    dataRecency: '2022',
    source: 'CDC/ATSDR',
    keyMetric: 'SVI Percentile (0-100%)',
    totalRecords: '100 counties',
    insights: 'Eastern NC counties consistently rank higher in vulnerability due to rural isolation, poverty, and housing instability.'
  },
  // Hospital & Healthcare Access
  hospitals: {
    title: 'Hospital Infrastructure Mapping',
    description: 'This layer visualizes licensed healthcare facilities across North Carolina, including general hospitals, emergency departments, specialty facilities, and rehabilitation centers. Each point represents a state-licensed facility with detailed capacity and service information. The data reveals significant healthcare infrastructure gaps in rural areas.',
    dataRecency: '2024',
    source: 'NC Division of Health Service Regulation',
    keyMetric: 'Licensed Bed Capacity',
    totalRecords: '150+ facilities',
    insights: 'Major medical centers cluster in urban areas while rural counties often lack critical care infrastructure.'
  },
  hospital_ownership: {
    title: 'Hospital Ownership Types',
    description: 'Government, non-profit, and proprietary hospital ownership distribution.',
    dataRecency: '2024',
    source: 'NC Division of Health Service Regulation',
    keyMetric: 'Ownership Type',
    totalRecords: '150+ facilities',
    insights: 'Ownership type affects hospital mission, financial stability, and community health priorities.'
  },
  private_equity: {
    title: 'Private Equity Ownership',
    description: 'Private equity owned versus independent healthcare facilities.',
    dataRecency: '2024',
    source: 'NC Division of Health Service Regulation',
    keyMetric: 'Ownership Category',
    totalRecords: '150+ facilities',
    insights: 'Private equity ownership affects financial margins and rural service sustainability.'
  },
  // HCVI Components
  hcvi_composite: {
    title: 'HCVI Composite Score',
    description: 'Overall Healthcare Vulnerability Index combining multiple risk factors.',
    dataRecency: '2025',
    source: 'NC Health Map',
    keyMetric: 'Composite Score (1-10)',
    totalRecords: '100 counties',
    insights: 'Composite scores identify counties with multiple overlapping healthcare vulnerabilities.'
  },
  healthcare_access: {
    title: 'Healthcare Access Score',
    description: 'Provider density, geographic accessibility, and service availability.',
    dataRecency: '2025',
    source: 'NC Health Map',
    keyMetric: 'Access Score (0-100)',
    totalRecords: '100 counties',
    insights: 'Access scores reflect provider capacity relative to population demand.'
  },
  policy_risk: {
    title: 'Policy Risk Score',
    description: 'Medicaid dependency and federal funding vulnerability.',
    dataRecency: '2025',
    source: 'NC Health Map',
    keyMetric: 'Policy Risk (0-100)',
    totalRecords: '100 counties',
    insights: 'Policy risk indicates susceptibility to changes in federal healthcare programs.'
  },
  economic_vulnerability: {
    title: 'Economic Vulnerability',
    description: 'Financial health, employment rates, and social determinants.',
    dataRecency: '2025',
    source: 'NC Health Map',
    keyMetric: 'Economic Score (0-100)',
    totalRecords: '100 counties',
    insights: 'Economic factors drive healthcare affordability and utilization patterns.'
  }
};
