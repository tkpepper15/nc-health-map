'use client';

/**
 * Interactive Map Component
 * Unified, reusable map component using Leaflet for North Carolina healthcare data
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapProps } from './types';
import { getCountyStyle, formatCountyData, NC_DEFAULT_VIEWPORT } from './utils';
import CountyTooltip from './CountyTooltip';
import MapLegend from './MapLegend';
import HospitalLayer from './HospitalLayer';

// Dynamic Leaflet imports
let L: typeof import('leaflet') | null = null;
let map: any = null;
let geoJsonLayer: any = null;

export default function InteractiveMap({
  counties,
  healthcareData,
  selectedMetric,
  onCountyClick,
  selectedCounty,
  className = '',
  showHospitals = false
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [hoveredCounty, setHoveredCounty] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Dynamic Leaflet loading
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        if (typeof window !== 'undefined') {
          const leafletModule = await import('leaflet');
          L = leafletModule.default;
          
          // Fix default marker icons
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          });

          setLeafletLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !L || !mapRef.current) return;

    try {
      // Initialize map
      map = L.map(mapRef.current, {
        center: NC_DEFAULT_VIEWPORT.center,
        zoom: NC_DEFAULT_VIEWPORT.zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      setIsLoading(false);

      return () => {
        if (map) {
          map.remove();
          map = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
    }
  }, [leafletLoaded]);

  // Update counties layer
  const updateCountiesLayer = useCallback(() => {
    if (!L || !map || !counties.length) return;

    try {
      // Remove existing layer
      if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
      }

      // Create GeoJSON features from counties
      const geoJsonData = {
        type: 'FeatureCollection',
        features: counties.map(county => ({
          type: 'Feature',
          properties: {
            ...county.properties,
            id: county.id,
            name: county.name,
            fips: county.fips
          },
          geometry: county.geometry
        }))
      };

      // Create new layer
      geoJsonLayer = L.geoJSON(geoJsonData, {
        style: (feature: any) => {
          const county = counties.find(c => c.id === feature.properties.id);
          if (!county) return { fillColor: '#e5e7eb', color: '#9ca3af', weight: 1, fillOpacity: 0.7 };
          
          const isSelected = selectedCounty?.id === county.id;
          const isHovered = hoveredCounty?.id === county.id;
          
          return getCountyStyle(county, healthcareData, selectedMetric, isSelected, isHovered);
        },
        onEachFeature: (feature: any, layer: any) => {
          const county = counties.find(c => c.id === feature.properties.id);
          if (!county) return;

          layer.on({
            mouseover: (e: any) => {
              setHoveredCounty(county);
              layer.setStyle({
                weight: 2,
                color: '#374151',
                fillOpacity: 0.8
              });
            },
            mouseout: (e: any) => {
              setHoveredCounty(null);
              const isSelected = selectedCounty?.id === county.id;
              layer.setStyle(getCountyStyle(county, healthcareData, selectedMetric, isSelected, false));
            },
            click: (e: any) => {
              onCountyClick(county);
              map.fitBounds(layer.getBounds());
            }
          });
        }
      }).addTo(map);

    } catch (error) {
      console.error('Error updating counties layer:', error);
    }
  }, [counties, healthcareData, selectedMetric, selectedCounty, hoveredCounty, onCountyClick]);

  // Update layer when dependencies change
  useEffect(() => {
    if (leafletLoaded && !isLoading) {
      updateCountiesLayer();
    }
  }, [updateCountiesLayer, leafletLoaded, isLoading]);

  // Handle mouse move for tooltip positioning
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  // Loading state
  if (isLoading || !leafletLoaded) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error fallback if Leaflet failed to load
  if (!L) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <p className="text-gray-600">Unable to load map. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const hoveredHealthcareData = hoveredCounty 
    ? healthcareData.find(d => d.countyId === hoveredCounty.id || d.fips_code === hoveredCounty.fips)
    : null;

  return (
    <div className={`relative h-full w-full ${className}`} onMouseMove={handleMouseMove}>
      {/* Map container */}
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Legend */}
      <MapLegend 
        selectedMetric={selectedMetric} 
        position="bottom-right"
        className="absolute z-[1000]"
      />

      {/* Hospital layer */}
      {showHospitals && (
        <HospitalLayer
          hospitals={hospitals}
          visible={showHospitals}
        />
      )}

      {/* County tooltip */}
      <CountyTooltip
        county={hoveredCounty}
        healthcareData={hoveredHealthcareData}
        selectedMetric={selectedMetric}
        position={mousePosition}
        visible={!!hoveredCounty}
      />
    </div>
  );
}