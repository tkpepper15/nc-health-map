'use client';

import { useEffect, useRef, useState } from 'react';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { getLayerColor, getLayerValue } from '../../utils/dataLayers';
// GeoJSON moved to public/data/nc-counties.json
import MapLegend from './MapLegend';
import CountyPopup from './CountyPopup';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface SimpleMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  selectedMetric: DataLayer;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
}

export default function SimpleMap({ 
  counties, 
  healthcareData, 
  selectedMetric, 
  onCountyClick, 
  selectedCounty 
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize simple interactive map
  useEffect(() => {
    // Simulate loading time then show fallback map
    const timer = setTimeout(() => {
      setIsLoading(false);
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getCountyColor = (countyId: string) => {
    const data = healthcareData.find(d => d.countyId === countyId);
    if (!data) return '#e5e7eb';
    
    const value = getLayerValue(data, selectedMetric);
    return getLayerColor(selectedMetric, value);
  };

  // Mock North Carolina counties with more realistic positioning
  const ncCounties = [
    { id: 'wake', name: 'Wake County', x: 420, y: 280, width: 80, height: 60 },
    { id: 'mecklenburg', name: 'Mecklenburg County', x: 280, y: 350, width: 70, height: 50 },
    { id: 'durham', name: 'Durham County', x: 450, y: 250, width: 60, height: 45 },
    { id: 'orange', name: 'Orange County', x: 400, y: 220, width: 50, height: 50 },
    { id: 'columbus', name: 'Columbus County', x: 320, y: 420, width: 75, height: 60 },
    { id: 'robeson', name: 'Robeson County', x: 260, y: 380, width: 70, height: 55 },
    { id: 'swain', name: 'Swain County', x: 120, y: 280, width: 60, height: 50 },
    { id: 'person', name: 'Person County', x: 460, y: 180, width: 55, height: 45 },
  ];

  const handleCountyClick = (countyData: any) => {
    const county: County = {
      id: countyData.id,
      name: countyData.name,
      fips: `37${Math.floor(Math.random() * 199) + 1}`.padStart(5, '0'),
      geometry: { type: 'Polygon', coordinates: [[]] },
      properties: {
        name: countyData.name,
        population: Math.floor(Math.random() * 500000) + 50000,
        area: Math.floor(Math.random() * 1000) + 200,
        classification: Math.random() > 0.7 ? 'urban' : 'rural'
      }
    };
    onCountyClick(county);
  };

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
      {/* Interactive SVG Map */}
      <div className="w-full h-full relative">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 700 500"
          className="w-full h-full"
          style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}
        >
          {/* North Carolina State Outline */}
          <path
            d="M100 200 L150 180 L200 170 L300 160 L450 150 L550 160 L600 180 L620 220 L610 280 L590 320 L570 360 L540 400 L480 430 L400 440 L320 450 L250 440 L180 420 L130 380 L110 340 L100 300 Z"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* County Regions */}
          {ncCounties.map((county) => {
            const healthData = healthcareData.find(d => d.countyId === county.id);
            const isSelected = selectedCounty?.id === county.id;
            
            return (
              <g key={county.id}>
                <rect
                  x={county.x}
                  y={county.y}
                  width={county.width}
                  height={county.height}
                  fill={getCountyColor(county.id)}
                  stroke={isSelected ? '#1f2937' : '#374151'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  rx="4"
                  className="cursor-pointer transition-all duration-200 hover:stroke-2 hover:drop-shadow-md"
                  onClick={() => handleCountyClick(county)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                    e.currentTarget.style.strokeWidth = '2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.strokeWidth = isSelected ? '3' : '1.5';
                  }}
                />
                
                {/* County Labels */}
                <text
                  x={county.x + county.width / 2}
                  y={county.y + county.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#374151"
                  className="pointer-events-none select-none"
                  style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
                >
                  {county.name.replace(' County', '')}
                </text>
                
                {/* HCVI Score Badge */}
                {healthData && (
                  <g>
                    <circle
                      cx={county.x + county.width - 15}
                      cy={county.y + 15}
                      r="12"
                      fill="rgba(255,255,255,0.9)"
                      stroke="#374151"
                      strokeWidth="1"
                      className="pointer-events-none"
                    />
                    <text
                      x={county.x + county.width - 15}
                      y={county.y + 15}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="8"
                      fontWeight="bold"
                      fill="#374151"
                      className="pointer-events-none"
                    >
                      {healthData.hcvi.score !== null ? healthData.hcvi.score.toFixed(1) : 'N/A'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          
          {/* Map Title */}
          <text
            x="350"
            y="30"
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill="#1f2937"
            className="select-none"
          >
            North Carolina Healthcare Vulnerability Index
          </text>
          
          {/* Interactive Instructions */}
          <text
            x="350"
            y="480"
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
            className="select-none"
          >
            Click counties to view detailed healthcare data • Hover for scores
          </text>
        </svg>
      </div>

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
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-gray-700">Interactive Map Active</span>
        </div>
      </div>
    </div>
  );
}