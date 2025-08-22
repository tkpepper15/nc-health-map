'use client';

import React, { useEffect, useRef, useState } from 'react';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { useHealthcareStore } from '../../utils/store';
import MapLegend from './MapLegend';
import HoverInfo from './HoverInfo';
import { DataLayer } from '../DataLayers/DataLayerSelector';
import styles from './NCMap.module.css';

// Dynamic import for Leaflet to avoid SSR issues
let L: any = null;

interface NCLeafletMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  medicaidEnabled: boolean;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
  currentLayer: DataLayer;
}

interface Hospital {
  id: string | number;
  facility_name: string;
  latitude: number;
  longitude: number;
  total_beds?: number;
  facility_type?: string;
  is_major_hospital?: boolean;
  is_emergency_dept?: boolean;
  city?: string;
  county?: string;
}

export default function NCLeafletMap({
  counties,
  healthcareData,
  medicaidEnabled,
  onCountyClick,
  selectedCounty,
  currentLayer
}: NCLeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [countyGeoData, setCountyGeoData] = useState<any>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);

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

        // Create custom hospital icons
        if (L.divIcon) {
          // Small hospital icon (< 50 beds)
          (window as any).smallHospitalIcon = L.divIcon({
            className: 'hospital-marker hospital-small',
            html: '<div class="hospital-dot">🏥</div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          // Medium hospital icon (50-99 beds)
          (window as any).mediumHospitalIcon = L.divIcon({
            className: 'hospital-marker hospital-medium',
            html: '<div class="hospital-dot">🏥</div>',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
          });
          
          // Large hospital icon (100+ beds)
          (window as any).largeHospitalIcon = L.divIcon({
            className: 'hospital-marker hospital-large',
            html: '<div class="hospital-dot">🏥</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          
          // Emergency department icon
          (window as any).emergencyIcon = L.divIcon({
            className: 'hospital-marker hospital-emergency',
            html: '<div class="hospital-dot">🚑</div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
        }

        // Load county boundaries and hospital data
        await loadCountyBoundaries();
        await loadHospitalData();
        
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

  // Load hospital data from API
  const loadHospitalData = async () => {
    try {
      setHospitalsLoading(true);
      const response = await fetch('/api/hospitals-data');
      if (response.ok) {
        const result = await response.json();
        setHospitals(result.data || []);
        console.log('✅ Loaded', result.data?.length || 0, 'hospitals');
      } else {
        console.error('Failed to load hospital data:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading hospital data:', error);
    } finally {
      setHospitalsLoading(false);
    }
  };

  // Initialize the map
  const initializeMap = () => {
    if (!mapContainer.current || !L || !countyGeoData) return;

    try {
      // Create map with NC-focused settings
      mapRef.current = L.map(mapContainer.current, {
        center: [35.7596, -79.0193], // North Carolina center
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
        maxBounds: [
          [33.0, -85.0], // Southwest corner (extended for comfortable viewing)
          [37.5, -75.0]  // Northeast corner (extended for comfortable viewing)
        ],
        maxBoundsViscosity: 0.8 // Smooth boundary enforcement
      });

      // Add OpenStreetMap tiles optimized for North Carolina viewing
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 12, // Limit max zoom for performance and focus
        bounds: [
          [33.0, -85.0], // Southwest
          [37.5, -75.0]  // Northeast  
        ]
      }).addTo(mapRef.current);

      // Add county data and hospitals
      addCountyLayer();
      addHospitalMarkers();
      
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

    // Fit map to NC county bounds with proper padding
    const bounds = geoJsonLayerRef.current.getBounds();
    mapRef.current.fitBounds(bounds, {
      padding: [20, 20],
      maxZoom: 10 // Prevent zooming too close when fitting bounds
    });
    
    // Set NC-specific bounds after fitting
    mapRef.current.setMaxBounds([
      [33.0, -85.0], // Southwest
      [37.5, -75.0]  // Northeast
    ]);
  };

  // Get style for each county based on selected data layer
  const getCountyStyle = (feature: any) => {
    // Convert county FIPS to full NC FIPS code for matching
    const countyFips = feature.properties.FIPS || feature.properties.fips;
    const fullFips = countyFips ? `37${countyFips.padStart(3, '0')}` : '';
    
    const healthData = healthcareData.find(h => h.fips_code === fullFips);
    
    let fillColor = '#e5e7eb'; // Default gray
    let fillOpacity = 0.7;

    if (healthData) {
      switch (currentLayer) {
        case 'hcvi':
          fillColor = getHCVIColor(healthData.hcvi_composite);
          fillOpacity = 0.8;
          break;
        case 'medicaid':
          fillColor = getMedicaidColor(healthData.medicaid_enrollment_rate);
          fillOpacity = medicaidEnabled ? 0.9 : 0.7;
          break;
        case 'healthcare-access':
          fillColor = getHealthcareAccessColor(healthData.healthcare_access_score);
          fillOpacity = 0.8;
          break;
        case 'policy-risk':
          fillColor = getPolicyRiskColor(healthData.policy_risk_score);
          fillOpacity = 0.8;
          break;
        case 'economic-vulnerability':
          fillColor = getEconomicVulnerabilityColor(healthData.economic_vulnerability_score);
          fillOpacity = 0.8;
          break;
        case 'svi':
          fillColor = getSVIColor(healthData.svi_data?.svi_overall_percentile);
          fillOpacity = 0.8;
          break;
        case 'hospitals':
          // For hospital layer, use base color with low opacity
          fillColor = '#f3f4f6';
          fillOpacity = 0.3;
          break;
        default:
          fillColor = getHCVIColor(healthData.hcvi_composite);
          fillOpacity = 0.8;
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

  // Color functions for different data layers
  const getHCVIColor = (score?: number | null) => {
    if (!score) return '#e5e7eb';
    if (score >= 7.5) return '#dc2626'; // Extreme
    if (score >= 5.5) return '#ef4444'; // High
    if (score >= 3.5) return '#f59e0b'; // Moderate
    return '#22c55e'; // Low
  };

  const getMedicaidColor = (rate?: number | null) => {
    if (!rate) return '#e5e7eb';
    if (rate >= 50) return '#1e40af'; // Very High
    if (rate >= 30) return '#3b82f6'; // High
    if (rate >= 15) return '#60a5fa'; // Moderate
    if (rate >= 5) return '#93c5fd'; // Low
    return '#dbeafe'; // Very Low
  };

  const getHealthcareAccessColor = (score?: number | null) => {
    if (!score) return '#e5e7eb';
    if (score >= 7.0) return '#dc2626'; // Poor
    if (score >= 5.0) return '#f97316'; // Limited
    if (score >= 3.0) return '#fbbf24'; // Moderate
    return '#22c55e'; // Good
  };

  const getPolicyRiskColor = (score?: number | null) => {
    if (!score) return '#e5e7eb';
    if (score >= 7.0) return '#dc2626'; // High Risk
    if (score >= 5.0) return '#f97316'; // Moderate-High
    if (score >= 3.0) return '#fbbf24'; // Moderate
    return '#22c55e'; // Low Risk
  };

  const getEconomicVulnerabilityColor = (score?: number | null) => {
    if (!score) return '#e5e7eb';
    if (score >= 7.0) return '#dc2626'; // High
    if (score >= 5.0) return '#f97316'; // Moderate-High
    if (score >= 3.0) return '#fbbf24'; // Moderate
    return '#22c55e'; // Low
  };

  const getSVIColor = (percentile?: number | null) => {
    if (!percentile) return '#e5e7eb';
    if (percentile >= 0.75) return '#dc2626'; // High Vulnerability
    if (percentile >= 0.50) return '#f97316'; // Moderate-High
    if (percentile >= 0.25) return '#fbbf24'; // Moderate-Low
    return '#22c55e'; // Low Vulnerability
  };

  // Create popup content based on current layer
  const createPopupContent = (feature: any) => {
    // Use properties from our processed data
    const countyName = feature.properties.NAME || feature.properties.name || feature.properties.COUNTY;
    const countyFips = feature.properties.FIPS || feature.properties.fips;
    const fullFips = countyFips ? `37${countyFips.padStart(3, '0')}` : '';
    
    // Get healthcare data for this county
    const healthData = healthcareData.find(h => h.fips_code === fullFips);
    
    if (!healthData) {
      return `
        <div class="p-3 min-w-48">
          <h3 class="font-bold text-lg text-gray-900 mb-2">${countyName}</h3>
          <p class="text-sm text-gray-500">No data available</p>
        </div>
      `;
    }

    // Get layer-specific content
    const layerContent = getLayerSpecificContent(healthData, currentLayer);

    return `
      <div class="p-3 min-w-48">
        <h3 class="font-bold text-lg text-gray-900 mb-3">${countyName}</h3>
        ${layerContent}
        <div class="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
          Click for full county details
        </div>
      </div>
    `;
  };

  // Get content specific to the current data layer
  const getLayerSpecificContent = (healthData: HealthcareMetrics, layer: DataLayer) => {
    switch (layer) {
      case 'hcvi':
        return `
          <div class="p-2 bg-blue-50 rounded mb-2">
            <div class="text-sm font-medium text-blue-900">HCVI Score: ${healthData.hcvi_composite?.toFixed(1) || 'N/A'}/10</div>
            <div class="text-xs text-blue-700">Risk Level: ${healthData.vulnerability_category || 'Unknown'}</div>
          </div>
        `;
      case 'medicaid':
        return `
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Enrollment Rate:</span>
              <span class="font-semibold">${healthData.medicaid_enrollment_rate?.toFixed(1) || 'N/A'}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Total Enrolled:</span>
              <span class="font-medium">${healthData.medicaid_total_enrollment?.toLocaleString() || 'N/A'}</span>
            </div>
          </div>
        `;
      case 'healthcare-access':
        return `
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Access Score:</span>
              <span class="font-semibold">${healthData.healthcare_access_score ? healthData.healthcare_access_score.toFixed(1) + '/10' : '--'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Provider Density:</span>
              <span class="font-medium">${healthData.healthcareAccess?.providerDensity ? healthData.healthcareAccess.providerDensity.toFixed(1) + ' per 10k' : '--'}</span>
            </div>
          </div>
        `;
      case 'policy-risk':
        return `
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Policy Risk Score:</span>
              <span class="font-semibold">${healthData.policy_risk_score ? healthData.policy_risk_score.toFixed(1) + '/10' : '--'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Medicaid Dependency:</span>
              <span class="font-medium">${healthData.medicaid_dependency_ratio ? healthData.medicaid_dependency_ratio.toFixed(3) : '--'}</span>
            </div>
          </div>
        `;
      case 'economic-vulnerability':
        return `
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Economic Risk:</span>
              <span class="font-semibold">${healthData.economic_vulnerability_score ? healthData.economic_vulnerability_score.toFixed(1) + '/10' : '--'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Healthcare Employment:</span>
              <span class="font-medium">${healthData.economicVulnerability?.healthcareEmployment ? healthData.economicVulnerability.healthcareEmployment.toFixed(1) + '%' : '--'}</span>
            </div>
          </div>
        `;
      case 'svi':
        return `
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">SVI Percentile:</span>
              <span class="font-semibold">${healthData.svi_data?.svi_overall_percentile ? (healthData.svi_data.svi_overall_percentile * 100).toFixed(0) + '%' : '--'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Poverty Rate (150%):</span>
              <span class="font-medium">${healthData.svi_data?.poverty_150_pct ? healthData.svi_data.poverty_150_pct.toFixed(1) + '%' : '--'}</span>
            </div>
          </div>
        `;
      case 'hospitals':
        return `
          <div class="text-sm text-gray-600">
            <div class="mb-1">Population: ${healthData.population_2020?.toLocaleString() || 'N/A'}</div>
            <div>Classification: ${healthData.is_rural ? 'Rural' : 'Urban'}</div>
          </div>
        `;
      default:
        return '';
    }
  };

  // Add hospital markers to the map
  const addHospitalMarkers = () => {
    if (!mapRef.current || !L) {
      return;
    }

    // Always clear existing hospital markers first
    if ((window as any).hospitalMarkersLayer) {
      mapRef.current.removeLayer((window as any).hospitalMarkersLayer);
      (window as any).hospitalMarkersLayer = null;
    }

    // Only add markers if we're on the hospital layer and have hospital data
    if (!hospitals.length || currentLayer !== 'hospitals') {
      return;
    }

    // Create a layer group for hospital markers
    const hospitalMarkersLayer = L.layerGroup();

    hospitals.forEach((hospital: Hospital) => {
      if (hospital.latitude && hospital.longitude) {
        // Determine icon based on hospital type and size
        let icon = (window as any).smallHospitalIcon;
        if (hospital.is_emergency_dept) {
          icon = (window as any).emergencyIcon;
        } else if (hospital.is_major_hospital || (hospital.total_beds && hospital.total_beds >= 100)) {
          icon = (window as any).largeHospitalIcon;
        } else if (hospital.total_beds && hospital.total_beds >= 50) {
          icon = (window as any).mediumHospitalIcon;
        }

        // Create marker
        const marker = L.marker([hospital.latitude, hospital.longitude], { icon });
        
        // Add popup with hospital information
        const popupContent = `
          <div class="hospital-popup p-3">
            <h4 class="font-bold text-gray-900 mb-2">${hospital.facility_name}</h4>
            <div class="text-sm space-y-1">
              <div><span class="text-gray-600">Location:</span> ${hospital.city || 'N/A'}, ${hospital.county || 'NC'}</div>
              <div><span class="text-gray-600">Type:</span> ${hospital.facility_type || 'Hospital'}</div>
              ${hospital.total_beds ? `<div><span class="text-gray-600">Total Beds:</span> ${hospital.total_beds}</div>` : ''}
              ${hospital.is_emergency_dept ? '<div class="text-red-600 font-medium">Emergency Department</div>' : ''}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          closeButton: true,
          maxWidth: 250
        });

        hospitalMarkersLayer.addLayer(marker);
      }
    });

    // Add to map and store reference
    hospitalMarkersLayer.addTo(mapRef.current);
    (window as any).hospitalMarkersLayer = hospitalMarkersLayer;
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
    const countyFips = feature.properties.FIPS || feature.properties.fips;
    const fullFips = countyFips ? `37${countyFips.padStart(3, '0')}` : '';
    const countyName = feature.properties.NAME || feature.properties.name || feature.properties.COUNTY;
    
    if (fullFips) {
      setHoveredCounty(fullFips);
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
    // Convert county FIPS to full NC FIPS code for matching
    const countyFips = feature.properties.FIPS || feature.properties.fips;
    const fullFips = countyFips ? `37${countyFips.padStart(3, '0')}` : '';
    const county = counties.find(c => c.fips === fullFips);
    
    if (county) {
      onCountyClick(county);
    }
  };

  // Update map when data or layer changes
  useEffect(() => {
    if (mapLoaded && countyGeoData) {
      addCountyLayer();
      addHospitalMarkers();
    }
  }, [medicaidEnabled, healthcareData, mapLoaded, countyGeoData, currentLayer, hospitals]);

  // Load hospital data when needed
  useEffect(() => {
    if (currentLayer === 'hospitals' && hospitals.length === 0 && !hospitalsLoading) {
      loadHospitalData();
    }
  }, [currentLayer, hospitals.length, hospitalsLoading]);

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
    <div className={`w-full h-full relative overflow-hidden ${styles.mapContainer}`}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading overlay */}
      {(!mapLoaded || (currentLayer === 'hospitals' && hospitalsLoading)) && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {!mapLoaded ? 'Loading North Carolina map...' : 'Loading hospital data...'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {!mapLoaded ? 'Initializing Leaflet map with county boundaries...' : `Loading ${hospitals.length} hospital facilities...`}
            </p>
          </div>
        </div>
      )}

      {/* Map Legend */}
      {mapLoaded && <MapLegend selectedMetric={currentLayer} />}

      {/* Hover Info */}
      <HoverInfo
        county={hoveredCountyInfo}
        healthcareData={hoveredCountyData}
        position={hoverPosition}
      />


      {/* Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}