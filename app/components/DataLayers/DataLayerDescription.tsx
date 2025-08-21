'use client';

import React from 'react';
import { DataLayer } from './DataLayerSelector';

interface DataLayerDescriptionProps {
  currentLayer: DataLayer;
}

export default function DataLayerDescription({ currentLayer }: DataLayerDescriptionProps) {
  const getLayerInfo = (layer: DataLayer) => {
    switch (layer) {
      case 'hcvi':
        return {
          title: 'Healthcare Vulnerability Index (HCVI)',
          description: 'The HCVI provides a comprehensive assessment of healthcare vulnerability across North Carolina counties. This composite index combines healthcare access, policy risk, and economic vulnerability factors to identify areas most at risk from healthcare system disruptions and policy changes. Scores range from 1-10, with higher scores indicating greater vulnerability.',
          dataRecency: 'June 2025',
          source: 'Composite Analysis',
          keyMetric: 'HCVI Score (1-10)',
          totalRecords: '100 counties',
          insights: 'Rural counties consistently score higher due to provider shortages, economic challenges, and policy dependencies.'
        };
      case 'medicaid':
        return {
          title: 'Medicaid Enrollment Analysis',
          description: 'This view displays county-level Medicaid enrollment data from North Carolina Department of Health and Human Services. The data shows total enrollment, expansion vs. traditional Medicaid splits, and enrollment rates as percentages of county population. Darker blue areas indicate higher enrollment rates, reflecting both healthcare needs and program accessibility.',
          dataRecency: 'June 2025',
          source: 'NC DHHS',
          keyMetric: 'Enrollment Rate (%)',
          totalRecords: '100 counties',
          insights: 'Rural counties often show higher Medicaid dependency rates due to economic factors and limited private insurance options.'
        };
      case 'healthcare-access':
        return {
          title: 'Healthcare Access Assessment',
          description: 'This layer evaluates healthcare accessibility through multiple dimensions: provider density, geographic access to hospitals, specialty service availability, and insurance coverage rates. Higher scores indicate poorer access, highlighting areas where residents face significant barriers to obtaining healthcare services.',
          dataRecency: 'June 2025',
          source: 'Multiple Sources',
          keyMetric: 'Access Score (1-10)',
          totalRecords: '100 counties',
          insights: 'Mountain and coastal counties often struggle with provider shortages and long travel times to specialty care.'
        };
      case 'policy-risk':
        return {
          title: 'Policy Risk Analysis',
          description: 'This analysis identifies counties most vulnerable to federal healthcare policy changes, including Medicaid work requirements, SNAP cuts, and federal funding reductions. The assessment considers current program dependencies and projected impacts of policy modifications on healthcare systems and coverage.',
          dataRecency: 'June 2025',
          source: 'Policy Analysis',
          keyMetric: 'Risk Score (1-10)',
          totalRecords: '100 counties',
          insights: 'Counties with high Medicaid expansion enrollment face the greatest risk from federal policy changes.'
        };
      case 'economic-vulnerability':
        return {
          title: 'Economic Vulnerability Assessment',
          description: 'This layer examines the economic foundations of county healthcare systems, including hospital financial health, private equity presence, healthcare employment dependency, and social determinants of health. Higher scores indicate greater economic instability threatening healthcare sustainability.',
          dataRecency: 'June 2025',
          source: 'Economic Analysis',
          keyMetric: 'Vulnerability Score (1-10)',
          totalRecords: '100 counties',
          insights: 'Rural hospitals operating on thin margins are most vulnerable to economic disruptions and closure.'
        };
      case 'svi':
        return {
          title: 'Social Vulnerability Analysis',
          description: 'The CDC Social Vulnerability Index (SVI) measures community resilience to disasters and health emergencies. It combines 16 census variables across four themes: socioeconomic status, household characteristics, racial/ethnic minority status, and housing/transportation. Higher percentiles indicate greater vulnerability requiring enhanced disaster preparedness and resource allocation.',
          dataRecency: '2022',
          source: 'CDC/ATSDR',
          keyMetric: 'SVI Percentile (0-100%)',
          totalRecords: '100 counties',
          insights: 'Eastern NC counties consistently rank higher in vulnerability due to rural isolation, poverty, and housing instability.'
        };
      case 'hospitals':
        return {
          title: 'Hospital Infrastructure Mapping',
          description: 'This layer visualizes licensed healthcare facilities across North Carolina, including general hospitals, emergency departments, specialty facilities, and rehabilitation centers. Each point represents a state-licensed facility with detailed capacity and service information. The data reveals significant healthcare infrastructure gaps in rural areas.',
          dataRecency: '2024',
          source: 'NC Division of Health Service Regulation',
          keyMetric: 'Licensed Bed Capacity',
          totalRecords: '150+ facilities',
          insights: 'Major medical centers cluster in urban areas while rural counties often lack critical care infrastructure.'
        };
      default:
        return {
          title: 'Healthcare Data Layer',
          description: 'Healthcare vulnerability and access data for North Carolina counties.',
          dataRecency: '2025',
          source: 'Multiple Sources',
          keyMetric: 'Various Metrics',
          totalRecords: '100 counties',
          insights: 'Select a specific layer for detailed analysis.'
        };
    }
  };

  const layerInfo = getLayerInfo(currentLayer);

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{layerInfo.title}</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {layerInfo.description}
        </p>
        
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <span className="font-medium">Data Source:</span>
            <span>{layerInfo.source}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-medium">Updated:</span>
            <span>{layerInfo.dataRecency}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-medium">Key Metric:</span>
            <span>{layerInfo.keyMetric}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-medium">Coverage:</span>
            <span>{layerInfo.totalRecords}</span>
          </div>
        </div>
        
        <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
          <p className="text-xs text-blue-800">
            <span className="font-medium">Key Insight:</span> {layerInfo.insights}
          </p>
        </div>
      </div>
    </div>
  );
}