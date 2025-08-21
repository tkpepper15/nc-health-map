'use client';

import { useEffect, useRef, useState } from 'react';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { getLayerColor, getLayerValue } from '../../utils/dataLayers';
import MapLegend from './MapLegend';
import CountyPopup from './CountyPopup';
import { DataLayer } from '../DataLayers/DataLayerSelector';

// For now, we'll use a placeholder until we implement the actual map
interface NCMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  selectedMetric: DataLayer;
  onCountyClick: (county: County) => void;
  selectedCounty: County | null;
}

export default function NCMap({ 
  counties, 
  healthcareData, 
  selectedMetric, 
  onCountyClick, 
  selectedCounty 
}: NCMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCounty, setHoveredCounty] = useState<County | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize map here
    // For now, we'll simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const getCountyColor = (countyId: string) => {
    const data = healthcareData.find(d => d.countyId === countyId);
    if (!data) return '#e5e7eb';
    
    const value = getLayerValue(selectedMetric, data);
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading North Carolina map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-gray-50">
      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
      >
        {/* SVG Map - Placeholder */}
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
          
          {/* Mock Counties */}
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
              onMouseEnter={() => setHoveredCounty(county as any)}
              onMouseLeave={() => setHoveredCounty(null)}
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
      </div>

      {/* Legend */}
      <MapLegend selectedMetric={selectedMetric} />

      {/* County Hover Tooltip */}
      {hoveredCounty && (
        <div 
          className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <h4 className="font-medium text-gray-900">{hoveredCounty.name}</h4>
          <p className="text-sm text-gray-600">
            HCVI Score: {healthcareData.find(d => d.countyId === hoveredCounty.id)?.hcvi.score.toFixed(1) || 'N/A'}
          </p>
        </div>
      )}

      {/* County Detail Popup */}
      {selectedCounty && (
        <CountyPopup 
          county={selectedCounty}
          
          onClose={() => onCountyClick(null as any)}
        />
      )}
    </div>
  );
}