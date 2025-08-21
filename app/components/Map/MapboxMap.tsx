'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { getLayerColor, getLayerValue } from '../../utils/dataLayers';
import MapLegend from './MapLegend';
import CountyPopup from './CountyPopup';
import { DataLayer } from '../DataLayers/DataLayerSelector';

// Mapbox access token (should be in environment variables)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoidGVzdC11c2VyIiwiYSI6ImNrZXhwZXh4eDAwMDAycW1zZWNkdjBkbGUifQ.placeholder';

interface MapboxMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  selectedMetric: DataLayer;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
}

export default function MapboxMap({
  counties,
  healthcareData,
  selectedMetric,
  onCountyClick,
  selectedCounty
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-79.0193, 35.7596], // North Carolina center
        zoom: 6.5,
        maxBounds: [[-85.0, 33.0], [-74.0, 37.5]], // Constrain to NC region
        maxZoom: 12,
        minZoom: 5
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Map load event
      map.current.on('load', () => {
        setMapLoaded(true);
        loadCountyData();
      });

      // Error handling
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Map loading failed. Please check your internet connection.');
      });

    } catch (error) {
      console.error('Failed to initialize Mapbox:', error);
      setMapError('Failed to initialize map. Please try again.');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Load county data and create map layers
  const loadCountyData = () => {
    if (!map.current || !mapLoaded) return;

    try {
      // Create GeoJSON data from counties
      const geoJsonData = createGeoJsonFromCounties();

      // Add county data source
      map.current.addSource('nc-counties', {
        type: 'geojson',
        data: geoJsonData as any
      });

      // Add county fill layer
      map.current.addLayer({
        id: 'counties-fill',
        type: 'fill',
        source: 'nc-counties',
        paint: {
          'fill-color': getCountyFillExpression(),
          'fill-opacity': 0.8,
          'fill-outline-color': 'transparent'
        }
      });

      // Add county border layer
      map.current.addLayer({
        id: 'counties-border',
        type: 'line',
        source: 'nc-counties',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1,
          'line-opacity': 0.8
        }
      });

      // Add hover effect layer
      map.current.addLayer({
        id: 'counties-hover',
        type: 'line',
        source: 'nc-counties',
        paint: {
          'line-color': '#000000',
          'line-width': 3,
          'line-opacity': 1
        },
        filter: ['==', 'fips', '']
      });

      // Add selected county highlight layer
      map.current.addLayer({
        id: 'counties-selected',
        type: 'line',
        source: 'nc-counties',
        paint: {
          'line-color': '#2563eb',
          'line-width': 4,
          'line-opacity': 1
        },
        filter: ['==', 'fips', selectedCounty?.fips || '']
      });

      // Add interaction handlers
      addMapInteractions();

    } catch (error) {
      console.error('Failed to load county data:', error);
      setMapError('Failed to load county data.');
    }
  };

  // Create GeoJSON from county data
  const createGeoJsonFromCounties = () => {
    const features = counties.map(county => {
      const healthData = healthcareData.find(h => h.countyId === county.id);
      const metricValue = healthData ? getLayerValue(selectedMetric, healthData) : null;
      const color = metricValue !== null ? getLayerColor(selectedMetric, metricValue) : '#e5e7eb';

      return {
        type: 'Feature' as const,
        properties: {
          fips: county.fips,
          name: county.name,
          id: county.id,
          metricValue: metricValue,
          color: color,
          population: county.properties.population,
          classification: county.properties.classification,
          hcviScore: healthData?.hcvi.score || null
        },
        geometry: county.geometry.coordinates.length > 0 
          ? county.geometry 
          : createFallbackGeometry(county)
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features: features
    };
  };

  // Create fallback geometry for counties without real boundaries
  const createFallbackGeometry = (county: County) => {
    // Create a simple rectangular approximation based on county ID
    // In production, this would use real GeoJSON boundaries
    const baseCoords = getCountyApproximateCoords(county.id);
    const size = 0.3; // Approximate size in degrees

    return {
      type: 'Polygon',
      coordinates: [[
        [baseCoords[0] - size/2, baseCoords[1] - size/2],
        [baseCoords[0] + size/2, baseCoords[1] - size/2],
        [baseCoords[0] + size/2, baseCoords[1] + size/2],
        [baseCoords[0] - size/2, baseCoords[1] + size/2],
        [baseCoords[0] - size/2, baseCoords[1] - size/2]
      ]]
    };
  };

  // Get approximate coordinates for counties (fallback)
  const getCountyApproximateCoords = (countyId: string): [number, number] => {
    const coords: { [key: string]: [number, number] } = {
      'wake': [-78.6382, 35.7796],
      'mecklenburg': [-80.8431, 35.2271],
      'durham': [-78.8986, 35.9940],
      'orange': [-79.1003, 35.9132],
      'columbus': [-78.7364, 34.2343],
      'robeson': [-79.0264, 34.6226],
      'swain': [-83.4896, 35.4012],
      'person': [-78.9767, 36.3959]
    };
    
    return coords[countyId] || [-79.0193, 35.7596]; // Default to NC center
  };

  // Get color expression for map styling
  const getCountyFillExpression = (): mapboxgl.Expression => {
    // This creates a data-driven style expression
    return [
      'case',
      ['has', 'color'],
      ['get', 'color'],
      '#e5e7eb' // Default gray color
    ];
  };

  // Add map interactions
  const addMapInteractions = () => {
    if (!map.current) return;

    // Hover effects
    map.current.on('mouseenter', 'counties-fill', (e) => {
      if (!map.current || !e.features || e.features.length === 0) return;

      const feature = e.features[0];
      map.current.getCanvas().style.cursor = 'pointer';

      // Update hover layer
      map.current.setFilter('counties-hover', ['==', 'fips', feature.properties?.fips]);

      // Show popup
      showHoverPopup(e, feature);
    });

    map.current.on('mouseleave', 'counties-fill', () => {
      if (!map.current) return;

      map.current.getCanvas().style.cursor = '';
      map.current.setFilter('counties-hover', ['==', 'fips', '']);

      // Hide popup
      if (popup.current) {
        popup.current.remove();
        popup.current = null;
      }
    });

    // Click handler
    map.current.on('click', 'counties-fill', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const countyId = feature.properties?.id;
      const county = counties.find(c => c.id === countyId);

      if (county) {
        onCountyClick(county);
      }
    });
  };

  // Show hover popup
  const showHoverPopup = (e: mapboxgl.MapMouseEvent, feature: any) => {
    if (!map.current) return;

    const properties = feature.properties;
    const healthData = healthcareData.find(h => h.countyId === properties.id);

    if (popup.current) {
      popup.current.remove();
    }

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      anchor: 'bottom',
      offset: [0, -10]
    })
      .setLngLat(e.lngLat)
      .setHTML(`
        <div class="p-3 min-w-48">
          <h3 class="font-semibold text-gray-900 mb-2">${properties.name}</h3>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">HCVI Score:</span>
              <span class="font-medium">${healthData?.hcvi.score.toFixed(1) || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Population:</span>
              <span class="font-medium">${properties.population?.toLocaleString() || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Classification:</span>
              <span class="font-medium capitalize">${properties.classification || 'N/A'}</span>
            </div>
          </div>
          <div class="mt-2 text-xs text-gray-500">
            Click for detailed information
          </div>
        </div>
      `)
      .addTo(map.current);
  };

  // Update map when selectedMetric changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Update the data source with new colors
    const source = map.current.getSource('nc-counties') as mapboxgl.GeoJSONSource;
    if (source) {
      const updatedData = createGeoJsonFromCounties();
      source.setData(updatedData as any);
    }
  }, [selectedMetric, healthcareData]);

  // Update selected county highlight
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const fips = selectedCounty?.fips || '';
    map.current.setFilter('counties-selected', ['==', 'fips', fips]);
  }, [selectedCounty, mapLoaded]);

  // Error state
  if (mapError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <div className="text-red-500 text-lg mb-2">Map Error</div>
          <p className="text-gray-600 mb-4">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null);
              // Trigger map re-initialization
              if (map.current) {
                map.current.remove();
                map.current = null;
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading North Carolina map...</p>
            <p className="text-sm text-gray-500 mt-2">Initializing Mapbox GL JS...</p>
          </div>
        </div>
      )}

      {/* Map Legend */}
      {mapLoaded && <MapLegend selectedMetric={selectedMetric} />}

      {/* County Detail Popup */}
      {selectedCounty && (
        <CountyPopup 
          county={selectedCounty}
          onClose={() => onCountyClick(null)}
        />
      )}

      {/* Mapbox Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}