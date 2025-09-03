'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function IndexCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        NC Healthcare Data Explorer
      </h3>
      
      <div className="text-xs text-gray-600 mb-3">
        <p className="mb-2">
          Explore Medicaid enrollment and social vulnerability across NC&apos;s 100 counties using real data sources.
        </p>
        
        {isExpanded && (
          <div className="max-h-40 overflow-y-auto border-t border-gray-100 pt-3 space-y-3 bg-gray-50 -mx-4 px-4 py-3 rounded-lg mt-2">
            <p>
              This application visualizes the North Carolina Healthcare Vulnerability Index (HCVI), combining multiple data sources to assess healthcare access, policy risks, and economic vulnerability across all 100 counties.
            </p>
            <p>
              <strong>Data Sources [Citations]:</strong> NC DHHS Medicaid enrollment data [1], CDC Social Vulnerability Index 2022 [2], NC OneMap hospital locations [4], hospital financial data [5], and county boundaries from NC Emergency Management [8].
            </p>
            <p>
              <strong>Methodology:</strong> HCVI composite scores calculated as Healthcare Access (33%) + Policy Risk (33%) + Economic Vulnerability (34%). Counties classified using Afonso 2016 research [6] into Urban, Suburban, Rural, and Tourism categories.
            </p>
            <p>
              <strong>Key Features:</strong> Interactive county-level mapping, real-time Medicaid analysis, social vulnerability integration, hospital infrastructure display, and financial risk assessment. All data validated with no dummy or synthetic values.
            </p>
            <p className="text-xs text-blue-600">
              💡 Select different data layers to explore relationships between Medicaid dependency, social vulnerability, and healthcare infrastructure across North Carolina.
            </p>
          </div>
        )}
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="h-3 w-3 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-3 w-3 mr-1" />
              Read More
            </>
          )}
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full mt-0.5"></div>
          <div>
            <div className="text-xs font-medium text-gray-700">Medicaid Enrollment</div>
            <div className="text-xs text-gray-500">June 2025 data from NC DHHS</div>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full mt-0.5"></div>
          <div>
            <div className="text-xs font-medium text-gray-700">Social Vulnerability Index</div>
            <div className="text-xs text-gray-500">CDC SVI 2022 data</div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Use SVI overlay toggle to compare vulnerability patterns
        </p>
      </div>
    </div>
  );
}