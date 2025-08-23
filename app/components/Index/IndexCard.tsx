'use client';

export default function IndexCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        NC Healthcare Data Explorer
      </h3>
      
      <p className="text-xs text-gray-600 mb-3">
        Explore Medicaid enrollment and social vulnerability across NC&apos;s 100 counties using real data sources.
      </p>
      
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