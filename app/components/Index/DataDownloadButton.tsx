'use client';

import React, { useState } from 'react';
import { HealthcareMetrics } from '../../types/healthcare';

interface DataDownloadButtonProps {
  healthcareData: HealthcareMetrics[];
  disabled?: boolean;
}

export default function DataDownloadButton({ healthcareData, disabled = false }: DataDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAsCSV = async () => {
    setIsDownloading(true);
    try {
      // Prepare CSV data
      const csvHeaders = [
        'County Name',
        'FIPS Code',
        'Medicaid Enrollment Rate (%)',
        'Total Population',
        'Is Rural',
        'SVI Overall Percentile',
        'SVI Socioeconomic',
        'SVI Household Composition',
        'SVI Racial/Ethnic Minority',
        'SVI Housing Transportation'
      ];

      const csvRows = healthcareData.map(county => [
        county.countyName || '',
        county.fips_code || '',
        county.medicaid_enrollment_rate || '',
        county.population_2020 || '',
        county.is_rural ? 'Yes' : 'No',
        county.svi_data?.svi_overall_percentile || '',
        county.svi_data?.socioeconomic_percentile || '',
        county.svi_data?.household_composition_percentile || '',
        county.svi_data?.racial_minority_percentile || '',
        county.svi_data?.housing_transport_percentile || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `nc-healthcare-data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsJSON = async () => {
    setIsDownloading(true);
    try {
      const jsonData = {
        metadata: {
          title: "North Carolina Healthcare Vulnerability Data",
          exported_at: new Date().toISOString(),
          counties_count: healthcareData.length,
          data_sources: [
            "NC Medicaid enrollment databases",
            "CDC Social Vulnerability Index",
            "U.S. Census population data"
          ]
        },
        data: healthcareData
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `nc-healthcare-data-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex space-x-2">
        <button
          onClick={downloadAsCSV}
          disabled={disabled || isDownloading || healthcareData.length === 0}
          className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{isDownloading ? 'DOWNLOADING...' : 'DATA DOWNLOAD (CSV)'}</span>
        </button>
        
        <button
          onClick={downloadAsJSON}
          disabled={disabled || isDownloading || healthcareData.length === 0}
          className="bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1 shadow-lg transition-colors duration-200"
        >
          <span>{isDownloading ? '...' : 'JSON'}</span>
        </button>
      </div>
    </div>
  );
}