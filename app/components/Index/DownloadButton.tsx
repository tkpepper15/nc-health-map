'use client';

import { useState } from 'react';

export default function DownloadButton() {
  const [isOpen, setIsOpen] = useState(false);

  const downloadOptions = [
    { id: 'hcvi-scores', label: 'Healthcare Vulnerability Index Scores', format: 'CSV' },
    { id: 'county-metrics', label: 'County-level Healthcare Metrics', format: 'CSV' },
    { id: 'hospital-data', label: 'Hospital Financial Data', format: 'CSV' },
    { id: 'policy-impacts', label: 'Policy Impact Projections', format: 'CSV' },
    { id: 'map-visualization', label: 'Map Visualization', format: 'PNG' },
    { id: 'full-dataset', label: 'Complete Dataset', format: 'JSON' }
  ];

  const handleDownload = (optionId: string) => {
    // TODO: Implement actual download functionality
    console.log(`Downloading: ${optionId}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm">Download Data</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-2">
              <h5 className="text-xs font-medium text-gray-900 px-2 py-1">Download Options</h5>
              <div className="space-y-1">
                {downloadOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleDownload(option.id)}
                    className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-md flex items-center justify-between"
                  >
                    <span>{option.label}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                      {option.format}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}