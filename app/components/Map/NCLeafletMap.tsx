'use client';

import React, { useEffect, useRef, useState } from 'react';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { getMedicaidDataByCounty } from '../../data/healthcareData';
import { useHealthcareStore } from '../../utils/store';
import MapLegend from './MapLegend';
import CountyPopup from './CountyPopup';
import HoverInfo from './HoverInfo';

// Dynamic import for Leaflet to avoid SSR issues
let L: any = null;

interface NCLeafletMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  medicaidEnabled: boolean;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
}

export default function NCLeafletMap({
  counties,
  healthcareData,
  medicaidEnabled,
  onCountyClick,
  selectedCounty
}: NCLeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [countyGeoData, setCountyGeoData] = useState<any>(null);

  const { 
    hoveredCounty, 
    hoverPosition, 
    setHoveredCounty, 
    setHoverPosition 
  } = useHealthcareStore();

  // Initialize Leaflet
  useEffect(() => {
    const initLeaflet = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const leaflet = await import('leaflet');
        L = leaflet.default;

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        });

        // Load county boundaries
        await loadCountyBoundaries();
        
        // Initialize map
        initializeMap();
      } catch (error) {
        console.error('Failed to initialize Leaflet:', error);
        setMapError('Failed to load map. Please refresh the page.');
      }
    };

    initLeaflet();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Load county boundaries from processed data
  const loadCountyBoundaries = async () => {
    try {
      // Import our processed GeoJSON data
      const { ncCountiesGeoJSON } = await import('../../data/ncCountiesGeoJSON');
      setCountyGeoData(ncCountiesGeoJSON);
    } catch (error) {
      console.error('Failed to load county boundaries:', error);
      setMapError('Failed to load county boundaries. Please check your connection.');
    }
  };

  // Initialize the map
  const initializeMap = () => {
    if (!mapContainer.current || !L || !countyGeoData) return;

    try {
      // Create map
      mapRef.current = L.map(mapContainer.current, {
        center: [35.7596, -79.0193], // North Carolina center
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true
      });

      // Add OpenStreetMap tiles (free)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(mapRef.current);

      // Add county data
      addCountyLayer();
      
      setMapLoaded(true);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map. Please try again.');
    }
  };

  // Add county GeoJSON layer
  const addCountyLayer = () => {
    if (!mapRef.current || !L || !countyGeoData) return;

    // Remove existing layer
    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    // Create GeoJSON layer
    geoJsonLayerRef.current = L.geoJSON(countyGeoData, {
      style: (feature: any) => getCountyStyle(feature),
      onEachFeature: (feature: any, layer: any) => {
        // Add popup and click handlers
        layer.on({
          mouseover: (e: any) => handleCountyHover(e, feature),
          mouseout: (e: any) => handleCountyMouseOut(e),
          click: (e: any) => handleCountyClick(e, feature)
        });

        // Bind popup
        const popupContent = createPopupContent(feature);
        layer.bindPopup(popupContent, {
          closeButton: true,
          maxWidth: 300
        });
      }
    }).addTo(mapRef.current);

    // Fit map to county bounds
    mapRef.current.fitBounds(geoJsonLayerRef.current.getBounds(), {
      padding: [20, 20]
    });
  };

  // Get style for each county based on HCVI data
  const getCountyStyle = (feature: any) => {
    // Use FIPS directly from our processed data
    const fips = feature.properties.FIPS || feature.properties.fips;
    
    const healthData = healthcareData.find(h => h.fips_code === fips);
    
    let fillColor = '#e5e7eb'; // Default gray
    let fillOpacity = 0.7;

    if (healthData) {
      // Use vulnerability color from data if available, otherwise calculate from score
      if (healthData.vulnerability_color) {
        fillColor = healthData.vulnerability_color;
        fillOpacity = 0.8;
      } else if (healthData.hcvi_composite) {
        // Color based on HCVI score
        if (healthData.hcvi_composite >= 8.5) {
          fillColor = '#DC143C'; // Extreme - Crimson
        } else if (healthData.hcvi_composite >= 6.5) {
          fillColor = '#FF6347'; // High - Tomato
        } else if (healthData.hcvi_composite >= 4.0) {
          fillColor = '#FFA500'; // Moderate - Orange
        } else {
          fillColor = '#2E8B57'; // Low - Sea Green
        }
        fillOpacity = 0.8;
      }

      // If Medicaid is enabled, adjust color based on Medicaid enrollment
      if (medicaidEnabled && healthData.medicaid_total_enrollment) {
        const enrollmentRate = healthData.medicaid_enrollment_rate || 0;
        // Darker colors for higher Medicaid dependency
        if (enrollmentRate > 30) {
          fillOpacity = Math.min(0.95, fillOpacity + 0.2);
        } else if (enrollmentRate > 20) {
          fillOpacity = Math.min(0.9, fillOpacity + 0.1);
        }
      }
    }

    return {
      fillColor: fillColor,
      weight: 1,
      opacity: 1,
      color: '#ffffff',
      fillOpacity: fillOpacity
    };
  };

  // Create popup content
  const createPopupContent = (feature: any) => {
    // Use properties from our processed data
    const countyName = feature.properties.NAME || feature.properties.name || feature.properties.COUNTY;
    const fips = feature.properties.FIPS || feature.properties.fips;
    
    // Get healthcare data for this county
    const healthData = healthcareData.find(h => h.fips_code === fips);
    
    // Get Medicaid data by county name
    const medicaidData = getMedicaidDataByCounty(countyName);

    return `
      <div class="p-3 min-w-64">
        <h3 class="font-bold text-lg text-gray-900 mb-3">${countyName}</h3>
        
        ${healthData ? `
        <div class="mb-3 p-2 bg-blue-50 rounded">
          <div class="text-sm font-medium text-blue-900">HCVI Score: ${healthData.hcvi_composite?.toFixed(1) || 'N/A'}</div>
          <div class="text-xs text-blue-700">Category: ${healthData.vulnerability_category || 'Unknown'}</div>
        </div>
        ` : ''}
        
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Total Medicaid Enrollment:</span>
            <span class="font-semibold text-blue-600">
              ${healthData?.medicaid_total_enrollment?.toLocaleString() || 'N/A'}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Medicaid Expansion:</span>
            <span class="font-medium">${healthData?.medicaid_expansion_enrollment?.toLocaleString() || 'N/A'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Enrollment Rate:</span>
            <span class="font-medium">${healthData?.medicaid_enrollment_rate?.toFixed(1) || 'N/A'}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Rural County:</span>
            <span class="font-medium">${healthData?.is_rural ? 'Yes' : 'No'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Healthcare Access Score:</span>
            <span class="font-medium">${healthData?.healthcare_access_score?.toFixed(1) || 'N/A'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Policy Risk Score:</span>
            <span class="font-medium">${healthData?.policy_risk_score?.toFixed(1) || 'N/A'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Economic Vulnerability:</span>
            <span class="font-medium">${healthData?.economic_vulnerability_score?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>
        <div class="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
          FIPS: ${fips || 'Unknown'} | Click for detailed breakdown
        </div>
      </div>
    `;
  };

  // Get color class for HCVI score
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 8.5) return 'text-red-700';
    if (score >= 6.5) return 'text-orange-600';
    if (score >= 4.0) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Handle county hover
  const handleCountyHover = (e: any, feature: any) => {
    const layer = e.target;
    layer.setStyle({
      weight: 3,
      color: '#000000',
      fillOpacity: 0.9
    });
    layer.bringToFront();

    // Update hover state
    const fips = feature.properties.FIPS || feature.properties.fips;
    const countyName = feature.properties.NAME || feature.properties.name || feature.properties.COUNTY;
    
    if (fips) {
      setHoveredCounty(fips);
      // Set hover position based on mouse event
      const rect = mapContainer.current?.getBoundingClientRect();
      if (rect && e.originalEvent) {
        setHoverPosition({
          x: e.originalEvent.clientX - rect.left,
          y: e.originalEvent.clientY - rect.top
        });
      }
    }
  };

  // Handle mouse out
  const handleCountyMouseOut = (e: any) => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.resetStyle(e.target);
    }
    // Clear hover state
    setHoveredCounty(null);
    setHoverPosition(null);
  };

  // Handle county click
  const handleCountyClick = (e: any, feature: any) => {
    // Use FIPS directly from our processed data
    const fips = feature.properties.FIPS || feature.properties.fips;
    const county = counties.find(c => c.fips === fips);
    
    if (county) {
      onCountyClick(county);
    }
  };

  // Update map when data changes
  useEffect(() => {
    if (mapLoaded && countyGeoData) {
      addCountyLayer();
    }
  }, [medicaidEnabled, healthcareData, mapLoaded, countyGeoData]);

  // Initialize map when county data is loaded
  useEffect(() => {
    if (countyGeoData && L && !mapRef.current) {
      initializeMap();
    }
  }, [countyGeoData]);

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
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Get hovered county data
  const hoveredCountyData = hoveredCounty ? healthcareData.find(h => h.fips_code === hoveredCounty) || null : null;
  const hoveredCountyInfo = hoveredCounty ? {
    name: counties.find(c => c.fips === hoveredCounty)?.name || 'Unknown County',
    fips: hoveredCounty
  } : null;

  return (
    <div className="w-full h-full relative overflow-hidden">
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
            <p className="text-sm text-gray-500 mt-2">Initializing Leaflet map with county boundaries...</p>
          </div>
        </div>
      )}

      {/* Map Legend */}
      {mapLoaded && <MapLegend selectedMetric="medicaid" />}

      {/* Hover Info */}
      <HoverInfo
        county={hoveredCountyInfo}
        healthcareData={hoveredCountyData}
        position={hoverPosition}
      />

      {/* County Detail Popup */}
      {selectedCounty && (
        <CountyPopup 
          county={selectedCounty}
          onClose={() => onCountyClick(null)}
        />
      )}

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}