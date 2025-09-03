'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export type DataLayer = 
  // Medicaid Categories
  | 'medicaid_total' | 'medicaid_aged' | 'medicaid_disabled' | 'medicaid_blind' 
  | 'medicaid_expansion' | 'medicaid_children' | 'medicaid_pregnant' 
  // SVI Themes  
  | 'svi_overall' | 'svi_socioeconomic' | 'svi_household' | 'svi_minority' | 'svi_housing'
  // SVI Individual Metrics
  | 'svi_poverty' | 'svi_unemployment' | 'svi_no_insurance' | 'svi_disability'
  // Hospitals & Healthcare Access
  | 'hospitals' | 'hospital_ownership' | 'private_equity'
  // HCVI Components
  | 'hcvi_composite' | 'healthcare_access' | 'policy_risk' | 'economic_vulnerability';

interface LayerInfo {
  id: DataLayer;
  name: string;
  description: string;
}

interface CategoryInfo {
  title: string;
  description: string;
  layers: LayerInfo[];
}

interface DataLayerSelectorProps {
  currentLayer: DataLayer;
  onLayerChange: (layer: DataLayer) => void;
}

export default function DataLayerSelector({ currentLayer, onLayerChange }: DataLayerSelectorProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'Healthcare Vulnerability Index': true,
    'Medicaid Enrollment Data': true,
    'Social Vulnerability Index (SVI)': true,
    'Key Vulnerability Indicators': true,
    'Hospital Infrastructure': true
  });

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const layerCategories: CategoryInfo[] = [
    {
      title: 'Healthcare Vulnerability Index',
      description: 'Composite risk assessment scores',
      layers: [
        {
          id: 'hcvi_composite',
          name: 'HCVI Composite Score',
          description: 'Overall healthcare vulnerability (1-10 scale)'
        },
        {
          id: 'healthcare_access',
          name: 'Healthcare Access Score', 
          description: 'Provider density, geographic access, services'
        },
        {
          id: 'policy_risk',
          name: 'Policy Risk Score',
          description: 'Medicaid dependency, federal funding risk'
        },
        {
          id: 'economic_vulnerability',
          name: 'Economic Vulnerability',
          description: 'Financial health, employment, social factors'
        }
      ]
    },
    {
      title: 'Medicaid Enrollment Data',
      description: 'NC DHHS Medicaid enrollment by category (June 2025)',
      layers: [
        {
          id: 'medicaid_total',
          name: 'Total Medicaid Enrollment',
          description: 'All Medicaid categories combined'
        },
        {
          id: 'medicaid_expansion',
          name: 'Medicaid Expansion Adults',
          description: 'Adults enrolled through Medicaid expansion'
        },
        {
          id: 'medicaid_aged',
          name: 'Aged (65+ years)',
          description: 'Traditional Medicaid - aged category'
        },
        {
          id: 'medicaid_disabled',
          name: 'Disabled Adults',
          description: 'Traditional Medicaid - disabled category'
        },
        {
          id: 'medicaid_blind',
          name: 'Blind Adults',
          description: 'Traditional Medicaid - blind category'
        },
        {
          id: 'medicaid_children',
          name: 'Children & Infants',
          description: 'Infants and children, Other Child, TANF categories'
        },
        {
          id: 'medicaid_pregnant',
          name: 'Pregnant Women & Family Planning',
          description: 'Pregnant women and family planning services'
        }
      ]
    },
    {
      title: 'Social Vulnerability Index (SVI)',
      description: 'CDC Social Vulnerability Index 2022 data',
      layers: [
        {
          id: 'svi_overall',
          name: 'Overall SVI Ranking',
          description: 'Composite social vulnerability percentile'
        },
        {
          id: 'svi_socioeconomic',
          name: 'Theme 1: Socioeconomic',
          description: 'Poverty, unemployment, housing burden, education'
        },
        {
          id: 'svi_household',
          name: 'Theme 2: Household Composition',
          description: 'Age, disability, single parent households'
        },
        {
          id: 'svi_minority',
          name: 'Theme 3: Racial & Ethnic Minority',
          description: 'Minority population percentage'
        },
        {
          id: 'svi_housing',
          name: 'Theme 4: Housing & Transportation',
          description: 'Housing types, crowding, vehicle access'
        }
      ]
    },
    {
      title: 'Key Vulnerability Indicators',
      description: 'Individual SVI metrics for detailed analysis',
      layers: [
        {
          id: 'svi_poverty',
          name: 'Below 150% Poverty Line',
          description: 'Population below 150% federal poverty line'
        },
        {
          id: 'svi_no_insurance',
          name: 'No Health Insurance',
          description: 'Population without health insurance'
        },
        {
          id: 'svi_unemployment',
          name: 'Unemployment Rate',
          description: 'Civilian unemployment rate'
        },
        {
          id: 'svi_disability',
          name: 'Population with Disability',
          description: 'Civilian population with disability'
        }
      ]
    },
    {
      title: 'Hospital Infrastructure',
      description: 'Licensed hospitals and healthcare facilities',
      layers: [
        {
          id: 'hospitals',
          name: 'Hospital Locations',
          description: 'Licensed hospitals with location data'
        },
        {
          id: 'hospital_ownership',
          name: 'Hospital Ownership Types',
          description: 'Government, non-profit, proprietary ownership'
        },
        {
          id: 'private_equity',
          name: 'Private Equity Ownership',
          description: 'Private equity owned vs independent facilities'
        }
      ]
    }
  ];

  // Check if all sections are collapsed to apply proper bottom rounding
  const allCollapsed = layerCategories.every(category => collapsedSections[category.title]);

  return (
    <div className="w-full overflow-hidden rounded-xl">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-semibold text-gray-900">Data Layers</h3>
        <p className="text-xs text-gray-500 mt-1">Select data to visualize (21 categories available)</p>
      </div>
      
      {/* Collapsible Sections */}
      <div className="max-h-80 overflow-y-auto">
        {layerCategories.map((category, categoryIndex) => {
          const isCollapsed = collapsedSections[category.title];
          const isLast = categoryIndex === layerCategories.length - 1;
          return (
            <div key={category.title} className={categoryIndex > 0 ? 'border-t border-gray-100' : ''}>
              {/* Section Header - Clickable */}
              <div 
                className={`px-3 py-2 bg-gray-50 cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors ${
                  isLast && isCollapsed && allCollapsed ? 'rounded-b-xl' : ''
                }`}
                onClick={() => toggleSection(category.title)}
              >
                <div className="flex-1">
                  <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                    {category.title}
                  </h4>
                  <p className="text-xs text-gray-500 leading-tight">
                    {category.description}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {isCollapsed ? (
                    <ChevronDownIcon className="h-3 w-3 text-gray-400" />
                  ) : (
                    <ChevronUpIcon className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Section Content - Collapsible */}
              {!isCollapsed && (
                <div className={`p-2 bg-white ${isLast ? 'rounded-b-xl' : ''}`}>
                  {category.layers.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => onLayerChange(layer.id)}
                      className={`w-full flex items-start p-2 rounded text-left transition-colors mb-1 last:mb-0 ${
                        currentLayer === layer.id
                          ? 'bg-blue-50 text-blue-900 border-l-2 border-blue-500'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${
                          currentLayer === layer.id ? 'text-blue-900 font-medium' : 'text-gray-700'
                        }`}>
                          {layer.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}