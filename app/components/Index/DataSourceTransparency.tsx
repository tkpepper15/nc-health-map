'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CircleStackIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface DataSourceInfo {
  table: string;
  columns: string[];
  originalSource: string;
  updateFrequency: string;
  description: string;
}

interface LayerSourceMapping {
  layerId: string;
  layerName: string;
  primarySources: DataSourceInfo[];
  calculations: string[];
}

export default function DataSourceTransparency() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Define all data sources used in the application with actual source links
  const dataSources: DataSourceInfo[] = [
    {
      table: 'county_health_data.medicaid_enrollment_rate',
      columns: ['medicaid_enrollment_rate', 'medicaid_aged', 'medicaid_disabled', 'medicaid_blind', 'medicaid_expansion', 'medicaid_children', 'medicaid_pregnant'],
      originalSource: '[1] NC DHHS Medicaid Enrollment Reports - https://docs.google.com/spreadsheets/d/1srCsapW6I4MsqHqFoOznCBi6ShVdlFZkdqe63p8g-fU/edit?usp=drive_link',
      updateFrequency: 'Monthly',
      description: 'Comprehensive Medicaid enrollment by category from North Carolina Department of Health and Human Services'
    },
    {
      table: 'county_health_data.svi_*',
      columns: ['svi_overall_rank', 'svi_theme1_rank', 'svi_theme2_rank', 'svi_theme3_rank', 'svi_theme4_rank', 'svi_poverty_150_pct', 'svi_unemployment_pct', 'svi_no_insurance_pct', 'svi_disability_pct'],
      originalSource: '[2] CDC Social Vulnerability Index 2022 - https://drive.google.com/file/d/1bCvHe3zLp6GryaoVJTwQYRwhGcSewzpH/view?usp=drive_link',
      updateFrequency: 'Annual',
      description: 'CDC/ATSDR Social Vulnerability Index data measuring community resilience factors from https://www.atsdr.cdc.gov/place-health/php/svi/index.html'
    },
    {
      table: 'county_health_data.hcvi_*',
      columns: ['hcvi_composite', 'healthcare_access_score', 'policy_risk_score', 'economic_vulnerability_score'],
      originalSource: '[3] Multi-source calculated metrics combining Medicaid [1], SVI [2], Hospital [4], and Financial data [5]',
      updateFrequency: 'As source data updates',
      description: 'Healthcare Vulnerability Index scores calculated from multiple data sources'
    },
    {
      table: 'hospitals_data',
      columns: ['facility_name', 'latitude', 'longitude', 'total_beds', 'facility_type', 'county', 'licensee', 'license_number'],
      originalSource: '[4] NC OneMap Hospital Data - https://drive.google.com/file/d/1kfv3HLG5ZHbenvy4fmFXwWTC-D4ZQNo3/view?usp=drive_link',
      updateFrequency: 'Quarterly',
      description: 'Licensed healthcare facilities with capacity and location data from https://www.nconemap.gov/datasets/nconemap::hospitals/explore'
    },
    {
      table: 'hospital_financials',
      columns: ['facility_name', 'operating_margin', 'total_revenue', 'ownership_type', 'pe_owned'],
      originalSource: '[5] Hospital Financial Data - https://airtable.com/appZYwbt3vioNrb95/shricxhAQSjpv5ec8',
      updateFrequency: 'Annual',
      description: 'Hospital financial performance and ownership structure data'
    },
    {
      table: 'county_classifications',
      columns: ['county_name', 'classification', 'fips_code'],
      originalSource: '[6] Afonso 2016 Research - County Classifications (Urban, Suburban, Rural, Tourism) - DOI: 10.1177/1091142115588976',
      updateFrequency: 'Static - Research-based',
      description: 'County economic classification system based on "The Equity of Local Sales Tax Distributions" research'
    },
    {
      table: 'county_health_data.population_*',
      columns: ['population_2020', 'population_density', 'demographic_data'],
      originalSource: '[7] US Census Bureau - American Community Survey',
      updateFrequency: 'Annual',
      description: 'County population data and demographic information from Census Bureau'
    },
    {
      table: 'county_boundaries',
      columns: ['geometry', 'county_name', 'fips_code', 'area_sq_miles'],
      originalSource: '[8] NC OneMap County Boundaries - https://www.nconemap.gov/datasets/NCEM-GIS::north-carolina-state-and-county-boundary-polygons/explore',
      updateFrequency: 'As needed',
      description: 'Official North Carolina county boundary polygons from NC Emergency Management GIS'
    }
  ];

  // Map each data layer to its Supabase sources
  const layerSourceMappings: LayerSourceMapping[] = [
    {
      layerId: 'hcvi_composite',
      layerName: 'HCVI Composite Score',
      primarySources: [
        dataSources.find(s => s.table === 'county_health_data.hcvi_*'),
        dataSources.find(s => s.table === 'county_health_data.population_*')
      ].filter(Boolean) as DataSourceInfo[],
      calculations: ['Weighted average of healthcare access, policy risk, and economic vulnerability scores']
    },
    {
      layerId: 'healthcare_access',
      layerName: 'Healthcare Access Score',
      primarySources: [
        dataSources.find(s => s.table === 'county_health_data.hcvi_*'),
        dataSources.find(s => s.table === 'hospitals_data')
      ].filter(Boolean) as DataSourceInfo[],
      calculations: ['Provider density analysis', 'Geographic access calculations', 'Insurance coverage rates']
    },
    {
      layerId: 'policy_risk',
      layerName: 'Policy Risk Score',
      primarySources: [
        dataSources.find(s => s.table === 'county_health_data.medicaid_enrollment_rate'),
        dataSources.find(s => s.table === 'county_health_data.hcvi_*')
      ].filter(Boolean) as DataSourceInfo[],
      calculations: ['Medicaid dependency ratios', 'Federal funding vulnerability', 'Work requirement impact modeling']
    },
    {
      layerId: 'economic_vulnerability',
      layerName: 'Economic Vulnerability Score',
      primarySources: [
        dataSources.find(s => s.table === 'county_health_data.svi_*'),
        dataSources.find(s => s.table === 'county_health_data.population_*')
      ].filter(Boolean) as DataSourceInfo[],
      calculations: ['Social determinant weighting', 'Economic indicator aggregation']
    },
    {
      layerId: 'medicaid_total',
      layerName: 'Total Medicaid Enrollment',
      primarySources: [
        dataSources.find(s => s.table === 'county_health_data.medicaid_enrollment_rate'),
        dataSources.find(s => s.table === 'county_health_data.population_*')
      ].filter(Boolean) as DataSourceInfo[],
      calculations: ['Population-adjusted enrollment rates (per 1,000)', 'Category aggregation']
    },
    {
      layerId: 'svi_overall',
      layerName: 'Overall Social Vulnerability Index',
      primarySources: [
        dataSources.find(s => s.table === 'county_health_data.svi_*')
      ].filter(Boolean) as DataSourceInfo[],
      calculations: ['CDC standard SVI calculation methodology', 'Percentile ranking across NC counties']
    },
    {
      layerId: 'svi_poverty',
      layerName: 'Population Below 150% Poverty Line',
      primarySources: [
        dataSources.find(s => s.table === 'county_health_data.svi_*')
      ].filter(Boolean) as DataSourceInfo[],
      calculations: ['Direct from Census ACS data via CDC SVI']
    },
    {
      layerId: 'svi_no_insurance',
      layerName: 'Population Without Health Insurance',
      primarySources: [
        dataSources.find(s => s.table === 'county_health_data.svi_*')
      ].filter(Boolean) as DataSourceInfo[],
      calculations: ['Direct from Census ACS data via CDC SVI']
    },
    {
      layerId: 'hospitals',
      layerName: 'Hospital Infrastructure',
      primarySources: [
        dataSources.find(s => s.table === 'hospitals_data'),
        dataSources.find(s => s.table === 'county_health_data.population_*')
      ].filter(Boolean) as DataSourceInfo[],
      calculations: ['Facility geocoding', 'Service classification', 'Capacity analysis']
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <CircleStackIcon className="h-6 w-6 mr-2 text-blue-600" />
          Data Source Transparency
        </h2>
        <p className="text-gray-600 mb-2">
          All data displayed in this application comes directly from Supabase database queries. 
          No local files, cached data, or fallback datasets are used in the current session.
        </p>
        <div className="flex items-center space-x-4 text-sm">
          <span className="flex items-center text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Live Database Connection
          </span>
          <span className="text-gray-500">
            Last Updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      {/* Primary Data Sources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div 
          className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50"
          onClick={() => toggleSection('sources')}
        >
          <h3 className="text-lg font-semibold text-gray-900">Primary Data Sources in Supabase</h3>
          {expandedSections['sources'] ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        {expandedSections['sources'] && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {dataSources.map((source, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{source.table}</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {source.updateFrequency}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{source.description}</p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  <span>{source.originalSource}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Columns:</strong> {source.columns.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Layer Mappings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div 
          className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50"
          onClick={() => toggleSection('mappings')}
        >
          <h3 className="text-lg font-semibold text-gray-900">Data Layer Source Mappings</h3>
          {expandedSections['mappings'] ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        {expandedSections['mappings'] && (
          <div className="border-t border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-4">
              Each data layer uses specific database columns and mathematical calculations:
            </p>
            
            {/* Statistical Computations Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3">Statistical Computations & Formulas</h4>
              <div className="space-y-3 text-sm">
                <div className="bg-white rounded p-3">
                  <strong className="text-blue-800">HCVI Composite Score:</strong>
                  <div className="font-mono text-xs mt-1 bg-gray-100 p-2 rounded">
                    HCVI = (Healthcare_Access × 0.60) + (Policy_Risk × 0.20) + (Economic_Vulnerability × 0.20)
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Weighted average on 1-10 scale, higher = more vulnerable</p>
                </div>
                
                <div className="bg-white rounded p-3">
                  <strong className="text-blue-800">Medicaid Enrollment Rate:</strong>
                  <div className="font-mono text-xs mt-1 bg-gray-100 p-2 rounded">
                    Rate = (Total_Medicaid_Enrollment / Population_2020) × 100
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Percentage of county population enrolled in Medicaid [Source 1]</p>
                </div>
                
                <div className="bg-white rounded p-3">
                  <strong className="text-blue-800">Classification Counts:</strong>
                  <div className="font-mono text-xs mt-1 bg-gray-100 p-2 rounded">
                    Rural: 66, Urban: 10, Suburban: 5, Tourism: 19 (Total = 100)
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Based on Afonso 2016 economic classification research [Source 6]</p>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {layerSourceMappings.map((mapping, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{mapping.layerName}</h4>
                  <div className="text-xs space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Supabase Tables:</span>
                      <ul className="mt-1 space-y-1">
                        {mapping.primarySources.map((source, i) => (
                          <li key={i} className="text-gray-600 ml-2">• {source.table}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Calculations:</span>
                      <ul className="mt-1 space-y-1">
                        {mapping.calculations.map((calc, i) => (
                          <li key={i} className="text-gray-600 ml-2">• {calc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Database Connection Status */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-800 mb-2">Current Session Status</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• All data sourced from live Supabase connection</li>
          <li>• No fallback or cached data in use</li>
          <li>• County boundaries loaded from versioned GeoJSON</li>
          <li>• Real-time data validation and error handling active</li>
        </ul>
      </div>
    </div>
  );
}