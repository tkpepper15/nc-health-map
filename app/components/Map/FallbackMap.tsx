'use client';

import { County, HealthcareMetrics } from '../../types/healthcare';
import { getLayerColor, getLayerValue } from '../../utils/dataLayers';
import MapLegend from './MapLegend';
import CountyPopup from './CountyPopup';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface FallbackMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  selectedMetric: DataLayer;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
}

export default function FallbackMap({ 
  counties, 
  healthcareData, 
  selectedMetric, 
  onCountyClick, 
  selectedCounty 
}: FallbackMapProps) {
  const getCountyColor = (countyId: string) => {
    const data = healthcareData.find(d => d.countyId === countyId);
    if (!data) return '#e5e7eb';
    
    const value = getLayerValue(data, selectedMetric);
    return getLayerColor(selectedMetric, value);
  };

  const mockCounties = [
    { id: 'wake', name: 'Wake County', x: 350, y: 180, width: 60, height: 40 },
    { id: 'mecklenburg', name: 'Mecklenburg County', x: 200, y: 250, width: 50, height: 35 },
    { id: 'durham', name: 'Durham County', x: 370, y: 160, width: 45, height: 30 },
    { id: 'orange', name: 'Orange County', x: 330, y: 140, width: 40, height: 35 },
    { id: 'columbus', name: 'Columbus County', x: 280, y: 320, width: 55, height: 45 },
    { id: 'robeson', name: 'Robeson County', x: 240, y: 290, width: 50, height: 40 },
    { id: 'swain', name: 'Swain County', x: 100, y: 200, width: 45, height: 35 },
    { id: 'person', name: 'Person County', x: 380, y: 120, width: 40, height: 30 },
  ];

  return (
    <div className="h-full relative bg-gray-50">
      {/* SVG Map */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 600 400"
        className="w-full h-full"
      >
        {/* NC State Outline */}
        <rect 
          x="50" 
          y="50" 
          width="500" 
          height="300" 
          fill="none" 
          stroke="#9ca3af" 
          strokeWidth="2"
          rx="10"
        />
        
        {/* Counties */}
        {mockCounties.map((county) => (
          <rect
            key={county.id}
            x={county.x}
            y={county.y}
            width={county.width}
            height={county.height}
            fill={getCountyColor(county.id)}
            stroke="#374151"
            strokeWidth="1"
            className="cursor-pointer hover:stroke-2 transition-all"
            onClick={() => {
              const mockCounty: County = {
                id: county.id,
                name: county.name,
                fips: `37${county.id.slice(0, 3)}`,
                geometry: { type: 'Polygon', coordinates: [[]] },
                properties: {
                  name: county.name,
                  population: Math.floor(Math.random() * 500000) + 50000,
                  area: Math.floor(Math.random() * 1000) + 200,
                  classification: Math.random() > 0.7 ? 'urban' : 'rural'
                }
              };
              onCountyClick(mockCounty);
            }}
          />
        ))}
        
        {/* County Labels */}
        {mockCounties.map((county) => (
          <text
            key={`${county.id}-label`}
            x={county.x + county.width / 2}
            y={county.y + county.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#374151"
            className="pointer-events-none font-medium"
          >
            {county.name.replace(' County', '')}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <MapLegend selectedMetric={selectedMetric} />

      {/* County Detail Popup */}
      {selectedCounty && (
        <CountyPopup 
          county={selectedCounty}
          onClose={() => onCountyClick(null)}
        />
      )}
      
      {/* Map Type Indicator */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded text-xs text-gray-600">
        Interactive County Map
      </div>
    </div>
  );
}