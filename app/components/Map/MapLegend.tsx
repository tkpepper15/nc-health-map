'use client';

import { DataLayer } from '../DataLayers/DataLayerSelector';

interface MapLegendProps {
  selectedMetric: DataLayer;
}

interface LegendItem {
  color: string;
  label: string;
  range: string;
  shape?: 'circle' | 'square' | 'area';
}

export default function MapLegend({ selectedMetric }: MapLegendProps) {
  const getMedicaidLegend = () => ({
    title: 'Medicaid Enrollment Rate',
    subtitle: 'Percentage of population enrolled (June 2025)',
    items: [
      { color: '#1e40af', label: 'Very High', range: '≥ 50%' },
      { color: '#3b82f6', label: 'High', range: '30-49%' },
      { color: '#60a5fa', label: 'Moderate', range: '15-29%' },
      { color: '#93c5fd', label: 'Low', range: '5-14%' },
      { color: '#dbeafe', label: 'Very Low', range: '< 5%' },
      { color: '#e5e7eb', label: 'No Data', range: 'N/A' }
    ] as LegendItem[],
    footer: [
      'Toggle shows SVI overlay (red/orange)',
      'Click counties for detailed breakdown'
    ]
  });

  const getSVILegend = () => ({
    title: 'Social Vulnerability Index',
    subtitle: 'CDC SVI percentile ranking (2022)',
    items: [
      { color: '#dc2626', label: 'High Vulnerability', range: '≥ 75th %ile' },
      { color: '#f97316', label: 'Moderate-High', range: '50-74th %ile' },
      { color: '#fbbf24', label: 'Moderate-Low', range: '25-49th %ile' },
      { color: '#22c55e', label: 'Low Vulnerability', range: '< 25th %ile' },
      { color: '#e5e7eb', label: 'No Data', range: 'N/A' }
    ] as LegendItem[],
    footer: [
      'Higher percentile = more vulnerable',
      'Based on socioeconomic, demographic factors'
    ]
  });





  const getHospitalLegend = () => ({
    title: 'Hospital Infrastructure',
    subtitle: 'Licensed healthcare facilities',
    items: [
      { color: '#1e40af', label: 'Major Hospital', range: '≥ 100 beds', shape: 'circle' },
      { color: '#3b82f6', label: 'General Hospital', range: '25-99 beds', shape: 'circle' },
      { color: '#60a5fa', label: 'Small Hospital', range: '< 25 beds', shape: 'circle' },
      { color: '#dc2626', label: 'Emergency Dept', range: 'Standalone ED', shape: 'square' },
      { color: '#f3f4f6', label: 'Counties', range: 'Base layer', shape: 'area' }
    ] as LegendItem[],
    footer: [
      'Circle size = bed capacity',
      'Click facilities for detailed info'
    ]
  });

  const getCurrentLegend = () => {
    switch (selectedMetric) {
      case 'medicaid':
        return getMedicaidLegend();
      case 'svi':
        return getSVILegend();
      case 'hospitals':
        return getHospitalLegend();
      default:
        return getMedicaidLegend();
    }
  };

  const legend = getCurrentLegend();

  return (
    <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-30 min-w-52">
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 text-sm">{legend.title}</h3>
        <p className="text-xs text-gray-600">{legend.subtitle}</p>
      </div>
      
      <div className="space-y-2">
        {legend.items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className={`w-4 h-4 border border-gray-300 ${
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
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        {legend.footer.map((text, index) => (
          <p key={index} className={`text-xs text-gray-500 ${index > 0 ? 'mt-1' : ''}`}>
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}