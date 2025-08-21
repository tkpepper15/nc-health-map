'use client';

import { useEffect, useRef, useState } from 'react';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { getLayerColor, getLayerValue } from '../../utils/dataLayers';
import { ncCountiesGeoJSON } from '../../data/ncCountiesGeoJSON';
import MapLegend from './MapLegend';
import CountyPopup from './CountyPopup';
import FallbackMap from './FallbackMap';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface LeafletMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  selectedMetric: DataLayer;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
}

export default function LeafletMap({ 
  counties, 
  healthcareData, 
  selectedMetric, 
  onCountyClick, 
  selectedCounty 
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const countyLayersRef = useRef<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [L, setL] = useState<any>(null);

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        console.log('🗺️ Starting map initialization...');
        
        // Check if container exists
        if (!mapRef.current) {
          console.error('❌ Map container not found');
          setHasError(true);
          setIsLoading(false);
          return;
        }

        console.log('📦 Importing Leaflet...');
        const leaflet = await import('leaflet');
        console.log('✅ Leaflet imported successfully');
        
        // Add Leaflet CSS dynamically
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          console.log('🎨 Adding Leaflet CSS...');
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
          
          // Wait for CSS to load
          await new Promise((resolve) => {
            link.onload = resolve;
            setTimeout(resolve, 1000); // Fallback timeout
          });
          console.log('✅ Leaflet CSS loaded');
        }
        
        if (!isMounted || !mapRef.current || mapInstanceRef.current) {
          console.log('⚠️ Component unmounted or map already exists');
          return;
        }

        console.log('🌍 Creating map instance...');
        setL(leaflet.default);

        // Fix default marker icons
        const DefaultIcon = leaflet.default.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        leaflet.default.Marker.prototype.options.icon = DefaultIcon;

        // Create map instance
        console.log('📍 Creating Leaflet map...');
        const map = leaflet.default.map(mapRef.current, {
          center: [35.7596, -79.0193], // North Carolina center
          zoom: 7,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          dragging: true,
          keyboard: true,
          attributionControl: false
        });
        console.log('✅ Map instance created');

        // Add base tile layer (light gray for better data visibility)
        console.log('🗺️ Adding tile layer...');
        leaflet.default.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);
        console.log('✅ Tile layer added');

        mapInstanceRef.current = map;
        console.log('🎉 Map initialization complete!');
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error initializing map:', error);
        console.error('Error details:', {
          message: (error as Error).message,
          stack: (error as Error).stack,
          mapRef: !!mapRef.current,
          isMounted
        });
        setHasError(true);
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Get county color based on selected metric
  const getCountyColor = (countyId: string): string => {
    const data = healthcareData.find(d => d.countyId === countyId);
    if (!data) return '#e5e7eb';
    
    const value = getLayerValue(selectedMetric, data);
    return getLayerColor(selectedMetric, value);
  };

  // Get county style for Leaflet
  const getCountyStyle = (countyId: string) => ({
    fillColor: getCountyColor(countyId),
    weight: 2,
    opacity: 1,
    color: '#374151',
    dashArray: '',
    fillOpacity: 0.8
  });

  // Highlight style for hover
  const highlightStyle = {
    weight: 3,
    color: '#1f2937',
    dashArray: '',
    fillOpacity: 0.9
  };

  // Add county layers to map
  useEffect(() => {
    if (!mapInstanceRef.current || isLoading || !L) return;

    const map = mapInstanceRef.current;

    // Clear existing county layers
    Object.values(countyLayersRef.current).forEach(layer => {
      map.removeLayer(layer);
    });
    countyLayersRef.current = {};

    // Add GeoJSON layers for each county
    ncCountiesGeoJSON.features.forEach(feature => {
      if (!feature.properties) return;
      const countyId = feature.properties.fips as string;
      
      const geoJsonLayer = L.geoJSON(feature, {
        style: () => getCountyStyle(countyId),
        onEachFeature: (feature: any, layer: any) => {
          if (!feature.properties) return;
          const countyName = feature.properties.name as string;
          const healthData = healthcareData.find(d => d.countyId === countyId);
          
          // Add hover effects
          layer.on({
            mouseover: (e: any) => {
              const layer = e.target;
              layer.setStyle(highlightStyle);
              layer.bringToFront();

              // Show tooltip
              if (healthData) {
                const value = getLayerValue(selectedMetric, healthData);
                layer.bindTooltip(
                  `<strong>${countyName}</strong><br/>
                   HCVI Score: ${healthData.hcvi.score.toFixed(1)}<br/>
                   Selected Metric: ${value.toFixed(1)}`,
                  { 
                    permanent: false,
                    direction: 'top',
                    className: 'county-tooltip'
                  }
                ).openTooltip();
              }
            },
            mouseout: (e: any) => {
              const layer = e.target;
              layer.setStyle(getCountyStyle(countyId));
              layer.closeTooltip();
            },
            click: (e: any) => {
              // Find corresponding county data
              const county = counties.find(c => c.id === countyId);
              if (county) {
                onCountyClick(county);
              }
              
              // Zoom to county
              if ('getBounds' in layer) {
                map.fitBounds((layer as any).getBounds(), { 
                  padding: [20, 20],
                  maxZoom: 10 
                });
              }
            }
          });
        }
      }).addTo(map);

      countyLayersRef.current[countyId] = geoJsonLayer;
    });

    // Fit map to show all counties
    const allFeatures = L.geoJSON(ncCountiesGeoJSON);
    map.fitBounds(allFeatures.getBounds(), { padding: [20, 20] });

  }, [isLoading, selectedMetric, healthcareData, counties, onCountyClick, L]);

  // Update county colors when metric changes
  useEffect(() => {
    if (!mapInstanceRef.current || isLoading || !L) return;

    Object.entries(countyLayersRef.current).forEach(([countyId, layer]) => {
      layer.setStyle(getCountyStyle(countyId));
    });
  }, [selectedMetric, healthcareData, isLoading, L]);

  // Highlight selected county
  useEffect(() => {
    if (!mapInstanceRef.current || isLoading || !L) return;

    // Reset all county styles
    Object.entries(countyLayersRef.current).forEach(([countyId, layer]) => {
      layer.setStyle(getCountyStyle(countyId));
    });

    // Highlight selected county
    if (selectedCounty && countyLayersRef.current[selectedCounty.id]) {
      const selectedLayer = countyLayersRef.current[selectedCounty.id];
      selectedLayer.setStyle({
        ...getCountyStyle(selectedCounty.id),
        weight: 4,
        color: '#1f2937'
      });
      selectedLayer.bringToFront();
    }
  }, [selectedCounty, selectedMetric, healthcareData, isLoading, L]);

  // Show fallback map if there's an error loading Leaflet
  if (hasError) {
    return (
      <FallbackMap
        counties={counties}
        healthcareData={healthcareData}
        selectedMetric={selectedMetric}
        onCountyClick={onCountyClick}
        selectedCounty={selectedCounty}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interactive map...</p>
          <p className="text-xs text-gray-500 mt-2">Initializing Leaflet mapping library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-gray-50">
      {/* Leaflet Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-full"
        style={{ background: '#f8fafc' }}
      />

      {/* Legend */}
      <MapLegend selectedMetric={selectedMetric} />

      {/* County Detail Popup */}
      {selectedCounty && (
        <CountyPopup 
          county={selectedCounty}
          
          onClose={() => onCountyClick(null)}
        />
      )}

      {/* Custom CSS for tooltips */}
      <style jsx global>{`
        .county-tooltip {
          background: white !important;
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          color: #374151 !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
          padding: 8px !important;
        }
        
        .county-tooltip::before {
          border-top-color: white !important;
        }
        
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
        }
        
        .leaflet-control-zoom a {
          background-color: white !important;
          border: 1px solid #d1d5db !important;
          color: #374151 !important;
          font-weight: bold !important;
        }
        
        .leaflet-control-zoom a:hover {
          background-color: #f3f4f6 !important;
          border-color: #9ca3af !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
        }
        
        .leaflet-popup-tip {
          box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
}