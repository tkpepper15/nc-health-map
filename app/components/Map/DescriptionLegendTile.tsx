'use client';

import React from 'react';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface DescriptionLegendTileProps {
  currentLayer: DataLayer;
}

interface LegendItem {
  color: string;
  label: string;
  range: string;
  shape?: 'circle' | 'square' | 'area';
}

export default function DescriptionLegendTile({ currentLayer }: DescriptionLegendTileProps) {
  const getLayerInfo = (layer: DataLayer) => {
    switch (layer) {
      // HCVI Layers
      case 'hcvi_composite':
        return {
          title: 'Healthcare Vulnerability Index (HCVI)',
          description: 'Composite risk assessment combining healthcare access, policy risk, and economic vulnerability into a single vulnerability score (1-10 scale). Higher scores indicate greater vulnerability to healthcare disruptions.',
          dataRecency: '2025',
          source: 'Multi-source Analysis',
          keyMetric: 'HCVI Score (1-10)',
          totalRecords: '100 counties',
          insights: 'Rural counties typically score higher due to limited healthcare access and economic challenges.',
          legend: {
            title: 'Healthcare Vulnerability Index',
            subtitle: 'Composite vulnerability score (1-10 scale)',
            items: [
              { color: '#dc2626', label: 'Extreme Vulnerability', range: '7.5-10.0' },
              { color: '#f97316', label: 'High Vulnerability', range: '5.5-7.4' },
              { color: '#fbbf24', label: 'Moderate Vulnerability', range: '3.5-5.4' },
              { color: '#84cc16', label: 'Low-Moderate', range: '2.0-3.4' },
              { color: '#22c55e', label: 'Low Vulnerability', range: '1.0-1.9' },
              { color: '#e5e7eb', label: 'No Data', range: 'N/A' }
            ] as LegendItem[],
            footer: [
              'Higher score = higher vulnerability',
              'Combines healthcare access, policy risk, economics'
            ]
          }
        };
      case 'healthcare_access':
        return {
          title: 'Healthcare Access Score',
          description: 'Measures healthcare infrastructure availability including provider density, geographic access to facilities, specialty services, and insurance coverage rates.',
          dataRecency: '2024-2025',
          source: 'NC DHSR, Census',
          keyMetric: 'Access Score (1-10)',
          totalRecords: '100 counties',
          insights: 'Urban counties generally have better access to healthcare services and providers.',
          legend: {
            title: 'Healthcare Access',
            subtitle: 'Access infrastructure score',
            items: [
              { color: '#dc2626', label: 'Very Poor Access', range: '8.0-10.0' },
              { color: '#f97316', label: 'Poor Access', range: '6.0-7.9' },
              { color: '#fbbf24', label: 'Limited Access', range: '4.0-5.9' },
              { color: '#84cc16', label: 'Good Access', range: '2.0-3.9' },
              { color: '#22c55e', label: 'Excellent Access', range: '1.0-1.9' }
            ] as LegendItem[],
            footer: ['Higher score = poorer access', 'Includes provider density, travel time']
          }
        };
      case 'policy_risk':
        return {
          title: 'Policy Risk Assessment',
          description: 'Evaluates vulnerability to federal policy changes including Medicaid dependency, federal funding reliance, SNAP participation, and work requirement impacts.',
          dataRecency: '2025',
          source: 'NC DHHS, USDA',
          keyMetric: 'Policy Risk Score (1-10)',
          totalRecords: '100 counties',
          insights: 'Counties with high Medicaid enrollment face greater policy risk from federal changes.',
          legend: {
            title: 'Policy Risk',
            subtitle: 'Vulnerability to policy changes',
            items: [
              { color: '#dc2626', label: 'Very High Risk', range: '8.0-10.0' },
              { color: '#f97316', label: 'High Risk', range: '6.0-7.9' },
              { color: '#fbbf24', label: 'Moderate Risk', range: '4.0-5.9' },
              { color: '#84cc16', label: 'Low Risk', range: '2.0-3.9' },
              { color: '#22c55e', label: 'Very Low Risk', range: '1.0-1.9' }
            ] as LegendItem[],
            footer: ['Higher score = higher policy risk', 'Federal program dependency']
          }
        };
      case 'economic_vulnerability':
        return {
          title: 'Economic Vulnerability',
          description: 'Assesses economic factors affecting healthcare stability including hospital financial health, healthcare employment dependency, and social determinants.',
          dataRecency: '2024-2025',
          source: 'Census, BLS, Hospital Reports',
          keyMetric: 'Economic Score (1-10)',
          totalRecords: '100 counties',
          insights: 'Economic vulnerability often correlates with healthcare access challenges.',
          legend: {
            title: 'Economic Vulnerability',
            subtitle: 'Economic risk factors',
            items: [
              { color: '#dc2626', label: 'Very High Risk', range: '8.0-10.0' },
              { color: '#f97316', label: 'High Risk', range: '6.0-7.9' },
              { color: '#fbbf24', label: 'Moderate Risk', range: '4.0-5.9' },
              { color: '#84cc16', label: 'Low Risk', range: '2.0-3.9' },
              { color: '#22c55e', label: 'Very Low Risk', range: '1.0-1.9' }
            ] as LegendItem[],
            footer: ['Higher score = higher economic risk', 'Employment, poverty, hospital finances']
          }
        };
      
      // Medicaid Layers
      case 'medicaid_total':
        return {
          title: 'Total Medicaid Enrollment',
          description: 'All Medicaid categories combined showing total enrollment rates by county. Includes traditional Medicaid (aged, disabled, blind, children) and Medicaid expansion adults.',
          dataRecency: 'June 2025',
          source: 'NC DHHS',
          keyMetric: 'Enrollment Rate (%)',
          totalRecords: '100 counties',
          insights: 'Rural counties often show higher total enrollment rates.',
          legend: {
            title: 'Total Medicaid Enrollment',
            subtitle: 'All categories combined (June 2025)',
            items: [
              { color: '#1e40af', label: 'Very High', range: '≥ 50%' },
              { color: '#3b82f6', label: 'High', range: '30-49%' },
              { color: '#60a5fa', label: 'Moderate', range: '15-29%' },
              { color: '#93c5fd', label: 'Low', range: '5-14%' },
              { color: '#dbeafe', label: 'Very Low', range: '< 5%' }
            ] as LegendItem[],
            footer: ['Based on NC DHHS data', 'Includes all enrollment categories']
          }
        };
      case 'medicaid_expansion':
        return {
          title: 'Medicaid Expansion Adults',
          description: 'Adults enrolled through Medicaid expansion (typically ages 19-64, income up to 138% FPL). North Carolina expanded Medicaid in December 2023.',
          dataRecency: 'June 2025',
          source: 'NC DHHS',
          keyMetric: 'Expansion Enrollment',
          totalRecords: '100 counties',
          insights: 'Expansion has provided coverage to previously uninsured working adults.',
          legend: {
            title: 'Medicaid Expansion Enrollment',
            subtitle: 'Adults enrolled through expansion',
            items: [
              { color: '#1e40af', label: 'Very High', range: '≥ 15,000' },
              { color: '#3b82f6', label: 'High', range: '5,000-14,999' },
              { color: '#60a5fa', label: 'Moderate', range: '1,000-4,999' },
              { color: '#93c5fd', label: 'Low', range: '100-999' },
              { color: '#dbeafe', label: 'Very Low', range: '< 100' }
            ] as LegendItem[],
            footer: ['Expansion effective Dec 2023', 'Working-age adults (19-64)']
          }
        };
      
      // SVI Layers
      case 'svi_overall':
        return {
          title: 'Overall Social Vulnerability Index',
          description: 'CDC Social Vulnerability Index combining all themes: socioeconomic status, household composition, racial/ethnic minority status, and housing/transportation.',
          dataRecency: '2022',
          source: 'CDC/ATSDR',
          keyMetric: 'SVI Percentile (0-100%)',
          totalRecords: '100 counties',
          insights: 'Eastern NC counties consistently rank higher in overall vulnerability.',
          legend: {
            title: 'Overall Social Vulnerability',
            subtitle: 'CDC SVI percentile ranking (2022)',
            items: [
              { color: '#dc2626', label: 'High Vulnerability', range: '≥ 75th %ile' },
              { color: '#f97316', label: 'Moderate-High', range: '50-74th %ile' },
              { color: '#fbbf24', label: 'Moderate-Low', range: '25-49th %ile' },
              { color: '#22c55e', label: 'Low Vulnerability', range: '< 25th %ile' }
            ] as LegendItem[],
            footer: ['Higher percentile = more vulnerable', 'Combines all SVI themes']
          }
        };
      case 'svi_socioeconomic':
        return {
          title: 'SVI Theme 1: Socioeconomic Status',
          description: 'Measures poverty, unemployment, housing burden, income, and education levels. Economic disadvantage significantly impacts health outcomes and healthcare access.',
          dataRecency: '2022',
          source: 'CDC/ATSDR',
          keyMetric: 'Socioeconomic Percentile',
          totalRecords: '100 counties',
          insights: 'Rural counties often face higher poverty and unemployment rates.',
          legend: {
            title: 'Socioeconomic Vulnerability',
            subtitle: 'Poverty, unemployment, education',
            items: [
              { color: '#dc2626', label: 'High Vulnerability', range: '≥ 75th %ile' },
              { color: '#f97316', label: 'Moderate-High', range: '50-74th %ile' },
              { color: '#fbbf24', label: 'Moderate-Low', range: '25-49th %ile' },
              { color: '#22c55e', label: 'Low Vulnerability', range: '< 25th %ile' }
            ] as LegendItem[],
            footer: ['Higher percentile = more vulnerable', 'Economic factors']
          }
        };
      case 'svi_poverty':
        return {
          title: 'Population Below 150% Poverty Line',
          description: 'Percentage of population with income below 150% of the federal poverty line. This expanded poverty measure captures near-poverty conditions affecting health access.',
          dataRecency: '2022',
          source: 'Census ACS',
          keyMetric: 'Poverty Percentage',
          totalRecords: '100 counties',
          insights: 'Poverty directly correlates with healthcare access barriers.',
          legend: {
            title: 'Poverty Rate (150% FPL)',
            subtitle: 'Population below 150% poverty line',
            items: [
              { color: '#dc2626', label: 'Very High Poverty', range: '≥ 30%' },
              { color: '#f97316', label: 'High Poverty', range: '20-29%' },
              { color: '#fbbf24', label: 'Moderate Poverty', range: '10-19%' },
              { color: '#84cc16', label: 'Low Poverty', range: '5-9%' },
              { color: '#22c55e', label: 'Very Low Poverty', range: '< 5%' }
            ] as LegendItem[],
            footer: ['150% FPL = expanded poverty measure', 'Key health access barrier']
          }
        };
      case 'svi_no_insurance':
        return {
          title: 'Population Without Health Insurance',
          description: 'Percentage of civilian population without health insurance coverage. Uninsured populations face significant barriers to healthcare access and often rely on emergency services.',
          dataRecency: '2022',
          source: 'Census ACS',
          keyMetric: 'Uninsured Percentage',
          totalRecords: '100 counties',
          insights: 'Medicaid expansion has reduced uninsured rates, but gaps remain.',
          legend: {
            title: 'Uninsured Population',
            subtitle: 'No health insurance coverage',
            items: [
              { color: '#dc2626', label: 'Very High Uninsured', range: '≥ 20%' },
              { color: '#f97316', label: 'High Uninsured', range: '15-19%' },
              { color: '#fbbf24', label: 'Moderate Uninsured', range: '10-14%' },
              { color: '#84cc16', label: 'Low Uninsured', range: '5-9%' },
              { color: '#22c55e', label: 'Very Low Uninsured', range: '< 5%' }
            ] as LegendItem[],
            footer: ['Pre-expansion data', 'Medicaid expansion addresses gaps']
          }
        };
      
      // Hospital Layers
      case 'hospitals':
        return {
          title: 'Hospital Infrastructure Mapping',
          description: 'Licensed healthcare facilities across North Carolina with detailed capacity and service information. Includes general hospitals, emergency departments, specialty facilities, and rehabilitation centers.',
          dataRecency: '2024',
          source: 'NC Division of Health Service Regulation',
          keyMetric: 'Licensed Bed Capacity',
          totalRecords: '150+ facilities',
          insights: 'Major medical centers cluster in urban areas while rural counties often lack critical care infrastructure.',
          legend: {
            title: 'Hospital Infrastructure',
            subtitle: 'Licensed healthcare facilities',
            items: [
              { color: '#1e40af', label: 'Major Hospital', range: '≥ 100 beds', shape: 'circle' },
              { color: '#3b82f6', label: 'General Hospital', range: '25-99 beds', shape: 'circle' },
              { color: '#60a5fa', label: 'Small Hospital', range: '< 25 beds', shape: 'circle' },
              { color: '#dc2626', label: 'Emergency Dept', range: 'Standalone ED', shape: 'square' },
              { color: '#f3f4f6', label: 'Counties', range: 'Base layer', shape: 'area' }
            ] as LegendItem[],
            footer: ['Circle size = bed capacity', 'Click facilities for details']
          }
        };
      
      // Legacy layers
      case 'medicaid':
        return {
          title: 'Medicaid Enrollment Analysis',
          description: 'County-level Medicaid enrollment data from North Carolina DHHS showing total enrollment rates and program accessibility.',
          dataRecency: 'June 2025',
          source: 'NC DHHS',
          keyMetric: 'Enrollment Rate (%)',
          totalRecords: '100 counties',
          insights: 'Rural counties often show higher Medicaid dependency rates.',
          legend: {
            title: 'Medicaid Enrollment Rate',
            subtitle: 'Percentage of population enrolled',
            items: [
              { color: '#1e40af', label: 'Very High', range: '≥ 50%' },
              { color: '#3b82f6', label: 'High', range: '30-49%' },
              { color: '#60a5fa', label: 'Moderate', range: '15-29%' },
              { color: '#93c5fd', label: 'Low', range: '5-14%' },
              { color: '#dbeafe', label: 'Very Low', range: '< 5%' }
            ] as LegendItem[],
            footer: ['Based on NC DHHS data', 'Click counties for breakdown']
          }
        };
      case 'svi':
        return {
          title: 'Social Vulnerability Analysis',
          description: 'CDC Social Vulnerability Index measuring community resilience to health emergencies and disasters.',
          dataRecency: '2022',
          source: 'CDC/ATSDR',
          keyMetric: 'SVI Percentile',
          totalRecords: '100 counties',
          insights: 'Eastern NC counties consistently rank higher in vulnerability.',
          legend: {
            title: 'Social Vulnerability Index',
            subtitle: 'CDC SVI percentile ranking',
            items: [
              { color: '#dc2626', label: 'High Vulnerability', range: '≥ 75th %ile' },
              { color: '#f97316', label: 'Moderate-High', range: '50-74th %ile' },
              { color: '#fbbf24', label: 'Moderate-Low', range: '25-49th %ile' },
              { color: '#22c55e', label: 'Low Vulnerability', range: '< 25th %ile' }
            ] as LegendItem[],
            footer: ['Higher percentile = more vulnerable', 'Socioeconomic + demographic factors']
          }
        };
      
      default:
        return {
          title: 'Healthcare Data Layer',
          description: 'Select a specific data layer from the sidebar to view detailed information and legend.',
          dataRecency: '2025',
          source: 'Multiple Sources',
          keyMetric: 'Various Metrics',
          totalRecords: '100 counties',
          insights: 'Use the data layer selector to explore different healthcare metrics.',
          legend: {
            title: 'Data Layer Selection',
            subtitle: 'Choose layer for detailed legend',
            items: [
              { color: '#3b82f6', label: 'HCVI Composite', range: '1-10 scale' },
              { color: '#1e40af', label: 'Medicaid Data', range: 'Enrollment rates' },
              { color: '#f97316', label: 'SVI Themes', range: 'Percentile ranks' },
              { color: '#22c55e', label: 'Hospital Infrastructure', range: 'Facilities & capacity' }
            ] as LegendItem[],
            footer: ['Select layer from sidebar', '21 categories available']
          }
        };
    }
  };

  const layerInfo = getLayerInfo(currentLayer);

  return (
    <div className="p-4 overflow-y-auto">
      {/* Compact Description Section */}
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">{layerInfo.title}</h2>
        <p className="text-xs text-gray-600 leading-tight mb-2 line-clamp-2">
          {layerInfo.description}
        </p>
        
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">
            {layerInfo.source} • {layerInfo.dataRecency}
          </span>
        </div>
      </div>

      {/* Compact Legend Section */}
      <div className="p-3">
        <div className="mb-2">
          <h3 className="font-medium text-gray-900 text-xs">{layerInfo.legend.title}</h3>
          <p className="text-xs text-gray-500">{layerInfo.legend.subtitle}</p>
        </div>
        
        <div className="space-y-1.5">
          {layerInfo.legend.items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 border border-gray-300 ${
                  item.shape === 'circle' ? 'rounded-full' : 
                  item.shape === 'area' ? 'rounded-sm opacity-60' : 'rounded-sm'
                }`}
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{item.range}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {layerInfo.legend.footer.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {layerInfo.legend.footer[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}