'use client';

import { County } from '../../types/healthcare';

interface CountyPopupProps {
  county: County;
  onClose: () => void;
}

export default function CountyPopup({ county, onClose }: CountyPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{county.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">County Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">FIPS Code:</span>
                <span className="font-medium">{county.fips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Population:</span>
                <span className="font-medium">{county.properties.population?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Classification:</span>
                <span className="font-medium capitalize">{county.properties.classification || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Data Availability</h3>
            <p className="text-sm text-blue-800">
              For detailed healthcare data including Medicaid enrollment and social vulnerability metrics, 
              please use the interactive map layers and county selection in the main interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}