'use client';

import { useEffect, useRef, useState } from 'react';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { getLayerColor, getLayerValue } from '../../utils/dataLayers';
// GeoJSON moved to public/data/nc-counties.json
import MapLegend from './MapLegend';
import CountyPopup from './CountyPopup';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface RealLeafletMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  selectedMetric: DataLayer;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
}

export default function RealLeafletMap({ 
  counties, 
  healthcareData, 
  selectedMetric, 
  onCountyClick, 
  selectedCounty 
}: RealLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initMap = async () => {
      try {
        console.log('Starting map initialization...');
        
        // Wait for container to be available with better error handling
        const waitForContainer = async (): Promise<boolean> => {
          let attempts = 0;
          const maxAttempts = 20;
          
          while (attempts < maxAttempts) {
            if (mapContainerRef.current && mounted) {
              console.log('Map container found after', attempts, 'attempts');
              return true;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
          }
          
          console.error('Map container not found after', maxAttempts, 'attempts');
          return false;
        };

        const containerReady = await waitForContainer();
        if (!containerReady || !mounted) {
          throw new Error('Map container not available or component unmounted');
        }

        console.log('Loading Leaflet...');
        
        // Import Leaflet dynamically
        const L = (await import('leaflet')).default;
        
        // Add CSS if not already added
        if (!document.querySelector('#leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!mounted) return;

        console.log('Creating map...');
        
        // Double-check container is still available
        if (!mapContainerRef.current || !mounted) {
          throw new Error('Container became unavailable during initialization');
        }
        
        // Create map with additional error handling
        const map = L.map(mapContainerRef.current, {
          center: [35.7596, -79.0193],
          zoom: 7,
          zoomControl: true,
          attributionControl: false
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapRef.current = map;

        // Style function for counties
        const style = (feature: any) => {
          const countyId = feature.properties.id;
          const data = healthcareData.find(d => d.countyId === countyId);
          let fillColor = '#e5e7eb';
          
          if (data) {
            const value = getLayerValue(selectedMetric, data);
            fillColor = getLayerColor(selectedMetric, value);
          }

          return {
            fillColor,
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
          };
        };

        // Event handlers
        const onEachFeature = (feature: any, layer: any) => {
          layer.on({
            mouseover: (e: any) => {
              const layer = e.target;
              layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.9
              });
              layer.bringToFront();
            },
            mouseout: (e: any) => {
              geoJsonLayerRef.current.resetStyle(e.target);
            },
            click: (e: any) => {
              const countyData = feature.properties;
              const county: County = {
                id: countyData.id,
                name: countyData.name,
                fips: countyData.fips,
                geometry: feature.geometry,
                properties: {
                  name: countyData.name,
                  population: countyData.population,
                  area: countyData.area,
                  classification: countyData.classification
                }
              };
              onCountyClick(county);
              map.fitBounds(e.target.getBounds());
            }
          });

          // Add popup
          const countyData = feature.properties;
          const healthData = healthcareData.find(d => d.countyId === countyData.id);
          if (healthData) {
            layer.bindPopup(`
              <div class="p-2">
                <h3 class="font-bold">${countyData.name}</h3>
                <p>HCVI Score: ${healthData.hcvi.score !== null ? healthData.hcvi.score.toFixed(1) : 'No Data'}</p>
                <p>Population: ${countyData.population.toLocaleString()}</p>
                <p>Classification: ${countyData.classification}</p>
              </div>
            `);
          }
        };

        // Load and add GeoJSON layer
        const response = await fetch('/data/nc-counties.json');
        const ncCountiesGeoJSON = await response.json();
        const geoJsonLayer = L.geoJSON(ncCountiesGeoJSON, {
          style,
          onEachFeature
        }).addTo(map);

        geoJsonLayerRef.current = geoJsonLayer;

        // Fit map to show all counties
        map.fitBounds(geoJsonLayer.getBounds());

        console.log('Map loaded successfully');
        setIsLoading(false);

      } catch (error) {
        console.error('Failed to load map:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    // Start initialization with a small delay to ensure DOM is ready
    timeoutId = setTimeout(() => {
      initMap();
    }, 100);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        mapRef.current = null;
      }
    };
  }, []);

  // Update map when metric changes
  useEffect(() => {
    if (!mapRef.current || !geoJsonLayerRef.current) return;

    geoJsonLayerRef.current.eachLayer((layer: any) => {
      const feature = layer.feature;
      if (feature) {
        const countyId = feature.properties.id;
        const data = healthcareData.find(d => d.countyId === countyId);
        let fillColor = '#e5e7eb';
        
        if (data) {
          const value = getLayerValue(selectedMetric, data);
          fillColor = getLayerColor(selectedMetric, value);
        }

        layer.setStyle({
          fillColor,
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
        });
      }
    });
  }, [selectedMetric, healthcareData]);

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Failed to Load</h3>
          <p className="text-gray-600 mb-4">Error: {loadError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading North Carolina map...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching geographic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Legend */}
      <MapLegend selectedMetric={selectedMetric} />

      {/* County Detail Popup */}
      {selectedCounty && (
        <CountyPopup 
          county={selectedCounty}
          
          onClose={() => onCountyClick(null)}
        />
      )}
    </div>
  );
}