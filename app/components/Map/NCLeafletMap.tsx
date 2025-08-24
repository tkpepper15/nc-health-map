'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { useHealthcareStore } from '../../utils/store';
import MapLegend from './MapLegend';
import UnifiedCountyTile from './UnifiedCountyTile';
import MapControls from './MapControls';
import { DataLayer } from '../DataLayers/DataLayerSelector';
import styles from './NCMap.module.css';

// Dynamic import for Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null;

interface NCLeafletMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  medicaidEnabled: boolean;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
  currentLayer: DataLayer;
  onHospitalClick?: (hospital: Hospital | null) => void;
  selectedHospital?: Hospital | null;
}

interface Hospital {
  id: string | number;
  facility_name: string;
  alt_name?: string;
  licensee?: string;
  license_number?: string;
  facility_type?: string;
  service_type?: string;
  
  // Location data
  county?: string;
  city?: string;
  state?: string;
  zip?: string;
  address?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  
  // Capacity data
  general_beds?: number;
  rehab_beds?: number;
  psych_beds?: number;
  substance_abuse_beds?: number;
  nursing_facility_beds?: number;
  total_beds?: number;
  
  // Operating room data
  cardiac_surgery_rooms?: number;
  cesarean_rooms?: number;
  ambulatory_surgery_rooms?: number;
  shared_rooms?: number;
  endoscopy_rooms?: number;
  other_surgery_rooms?: number;
  total_surgery_rooms?: number;
  
  // Classification flags
  is_major_hospital?: boolean;
  is_specialty?: boolean;
  is_emergency_dept?: boolean;
  is_ltac?: boolean;
  is_rehab?: boolean;
}

export default function NCLeafletMap({
  counties,
  healthcareData,
  medicaidEnabled,
  onCountyClick,
  selectedCounty,
  currentLayer,
  onHospitalClick,
  selectedHospital
}: NCLeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const geoJsonLayerRef = useRef<import('leaflet').GeoJSON | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [countyGeoData, setCountyGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [hospitalClickPosition, setHospitalClickPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    hoveredCounty, 
    hoverPosition, 
    setHoveredCounty, 
    setHoverPosition 
  } = useHealthcareStore();

  // Memoize healthcare data lookup for better performance - MUST BE FIRST
  const healthcareDataMap = useMemo(() => {
    const map = new Map<string, HealthcareMetrics>();
    healthcareData.forEach(data => {
      map.set(data.fips_code, data);
    });
    return map;
  }, [healthcareData]);

  // Memoize county data lookup
  const countyMap = useMemo(() => {
    const map = new Map<string, County>();
    counties.forEach(county => {
      map.set(county.fips, county);
    });
    return map;
  }, [counties]);

  // Initialize Leaflet - only run once on mount
  useEffect(() => {
    const initLeaflet = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const leaflet = await import('leaflet');
        L = leaflet.default;

        // Create custom hospital icons
        if (L?.divIcon) {
          // Small hospital icon (< 50 beds)
          (window as unknown as Record<string, unknown>).smallHospitalIcon = L.divIcon({
            className: 'hospital-marker hospital-small',
            html: '<div class="hospital-dot">🏥</div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          // Medium hospital icon (50-99 beds)
          (window as unknown as Record<string, unknown>).mediumHospitalIcon = L.divIcon({
            className: 'hospital-marker hospital-medium',
            html: '<div class="hospital-dot">🏥</div>',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
          });
          
          // Large hospital icon (100+ beds)
          (window as unknown as Record<string, unknown>).largeHospitalIcon = L.divIcon({
            className: 'hospital-marker hospital-large',
            html: '<div class="hospital-dot">🏥</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          
          // Emergency department icon
          (window as unknown as Record<string, unknown>).emergencyIcon = L.divIcon({
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
      // Cleanup hover timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      // Cleanup map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      // Cleanup hospital markers
      if ((window as unknown as Record<string, unknown>).hospitalMarkersLayer) {
        (window as unknown as Record<string, unknown>).hospitalMarkersLayer = null;
      }
    };
  }, []);

  // Load county boundaries from processed data
  const loadCountyBoundaries = async () => {
    try {
      // Load our processed GeoJSON data
      const response = await fetch('/data/nc-counties.json');
      const ncCountiesGeoJSON = await response.json();
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

  // Get style for each county based on selected data layer - optimized with Map lookup
  const getCountyStyle = useCallback((feature: GeoJSON.Feature) => {
    // Convert county FIPS to full NC FIPS code for matching
    const properties = feature.properties || {};
    const countyFips = properties.FIPS || properties.fips;
    const fullFips = countyFips ? `37${countyFips.padStart(3, '0')}` : '';
    
    // Use Map lookup for O(1) performance instead of array.find O(n)
    const healthData = healthcareDataMap.get(fullFips);
    
    let fillColor = '#e5e7eb'; // Default gray
    let fillOpacity = 0.7;

    if (healthData) {
      switch (currentLayer) {
        case 'medicaid':
          fillColor = getMedicaidColor(healthData.medicaid_enrollment_rate);
          fillOpacity = medicaidEnabled ? 0.9 : 0.7;
          break;
        case 'svi':
          fillColor = getSVIColor(healthData.svi_data?.svi_overall_percentile);
          fillOpacity = 0.8;
          break;
        case 'hospitals':
          // For hospital layer, use subtle background with very low opacity
          fillColor = '#f9fafb';
          fillOpacity = 0.2;
          break;
        default:
          fillColor = getMedicaidColor(healthData.medicaid_enrollment_rate);
          fillOpacity = 0.8;
      }
    }

    return {
      fillColor: fillColor,
      weight: currentLayer === 'hospitals' ? 0.5 : 1,
      opacity: currentLayer === 'hospitals' ? 0.3 : 1,
      color: currentLayer === 'hospitals' ? '#e5e7eb' : '#ffffff',
      fillOpacity: fillOpacity
    };
  }, [healthcareDataMap, currentLayer, medicaidEnabled]);

  // Handle county hover with throttling to reduce performance impact
  const handleCountyHover = useCallback((e: import('leaflet').LeafletMouseEvent, feature: GeoJSON.Feature) => {
    const layer = e.target;
    layer.setStyle({
      weight: 3,
      color: '#000000',
      fillOpacity: 0.9
    });
    layer.bringToFront();

    // Clear existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Throttle hover state updates to every 50ms
    hoverTimeoutRef.current = setTimeout(() => {
      const properties = feature.properties || {};
      const countyFips = properties.FIPS || properties.fips;
      const fullFips = countyFips ? `37${countyFips.padStart(3, '0')}` : '';
      
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
    }, 50);
  }, [setHoveredCounty, setHoverPosition]);

  // Handle mouse out
  const handleCountyMouseOut = useCallback((e: import('leaflet').LeafletMouseEvent) => {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.resetStyle(e.target);
    }
    // Clear hover state
    setHoveredCounty(null);
    setHoverPosition(null);
  }, [setHoveredCounty, setHoverPosition]);

  // Handle county click - optimized with Map lookup
  const handleCountyClick = useCallback((e: import('leaflet').LeafletMouseEvent, feature: GeoJSON.Feature) => {
    // Convert county FIPS to full NC FIPS code for matching
    const properties = feature.properties || {};
    const countyFips = properties.FIPS || properties.fips;
    const fullFips = countyFips ? `37${countyFips.padStart(3, '0')}` : '';
    const county = countyMap.get(fullFips);
    
    if (county) {
      // Capture click position for fixed tile placement
      const rect = mapContainer.current?.getBoundingClientRect();
      if (rect && e.originalEvent) {
        setClickPosition({
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY
        });
      }
      onCountyClick(county);
    }
  }, [countyMap, onCountyClick]);

  // Add county GeoJSON layer
  const addCountyLayer = useCallback(() => {
    if (!mapRef.current || !L || !countyGeoData) return;

    // Remove existing layer
    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    // Create GeoJSON layer
    geoJsonLayerRef.current = L!.geoJSON(countyGeoData, {
      style: (feature) => feature ? getCountyStyle(feature) : {},
      onEachFeature: (feature: GeoJSON.Feature, layer: import('leaflet').Layer) => {
        // Only add hover and click handlers if not on hospital layer
        if (currentLayer !== 'hospitals') {
          layer.on({
            mouseover: (e: import('leaflet').LeafletMouseEvent) => handleCountyHover(e, feature),
            mouseout: (e: import('leaflet').LeafletMouseEvent) => handleCountyMouseOut(e),
            click: (e: import('leaflet').LeafletMouseEvent) => handleCountyClick(e, feature)
          });
        }
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
  }, [countyGeoData, getCountyStyle, currentLayer, handleCountyHover, handleCountyMouseOut, handleCountyClick]);

  // Add hospital markers to the map
  const addHospitalMarkers = useCallback(() => {
    if (!mapRef.current || !L) {
      return;
    }

    // Always clear existing hospital markers first
    if ((window as unknown as Record<string, unknown>).hospitalMarkersLayer) {
      mapRef.current.removeLayer((window as unknown as Record<string, unknown>).hospitalMarkersLayer as import('leaflet').Layer);
      (window as unknown as Record<string, unknown>).hospitalMarkersLayer = null;
    }

    // Only add markers if we're on the hospital layer and have hospital data
    if (!hospitals.length || currentLayer !== 'hospitals') {
      return;
    }

    // Create a layer group for hospital markers
    const hospitalMarkersLayer = L!.layerGroup();

    hospitals.forEach((hospital: Hospital) => {
      if (hospital.latitude && hospital.longitude) {
        // Determine icon based on hospital type and size
        let icon = (window as unknown as Record<string, unknown>).smallHospitalIcon as import('leaflet').DivIcon;
        if (hospital.is_emergency_dept) {
          icon = (window as unknown as Record<string, unknown>).emergencyIcon as import('leaflet').DivIcon;
        } else if (hospital.is_major_hospital || (hospital.total_beds && hospital.total_beds >= 100)) {
          icon = (window as unknown as Record<string, unknown>).largeHospitalIcon as import('leaflet').DivIcon;
        } else if (hospital.total_beds && hospital.total_beds >= 50) {
          icon = (window as unknown as Record<string, unknown>).mediumHospitalIcon as import('leaflet').DivIcon;
        }

        // Create marker
        const marker = L!.marker([hospital.latitude, hospital.longitude], { icon });
        
        // Add click handler for hospital selection
        marker.on('click', (e: import('leaflet').LeafletMouseEvent) => {
          e.originalEvent.stopPropagation(); // Prevent county click
          if (onHospitalClick) {
            // Capture hospital click position
            setHospitalClickPosition({
              x: e.originalEvent.clientX,
              y: e.originalEvent.clientY
            });
            onHospitalClick(hospital);
          }
        });

        hospitalMarkersLayer.addLayer(marker);
      }
    });

    // Add to map and store reference
    hospitalMarkersLayer.addTo(mapRef.current);
    (window as unknown as Record<string, unknown>).hospitalMarkersLayer = hospitalMarkersLayer;
  }, [hospitals, currentLayer, onHospitalClick]);

  // Initialize the map
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !L || !countyGeoData) return;

    try {
      // Create map with NC-focused settings
      mapRef.current = L!.map(mapContainer.current, {
        center: [35.7596, -79.0193], // North Carolina center
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        zoomControl: false, // We'll add custom zoom controls
        scrollWheelZoom: true,
        attributionControl: true,
        maxBounds: [
          [28.0, -95.0], // Southwest corner (much wider for background)
          [42.0, -65.0]  // Northeast corner (much wider for background)
        ],
        maxBoundsViscosity: 0.3 // Allow more movement for background visibility
      });

      // Add OpenStreetMap tiles with reduced opacity
      L!.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 12,
        opacity: 0.4, // Reduce opacity for subtle background
        bounds: [
          [33.0, -85.0], // Southwest
          [37.5, -75.0]  // Northeast  
        ]
      }).addTo(mapRef.current);
      
      // Add seamless background overlay that covers entire visible area
      const backgroundOverlay = L!.rectangle([
        [20.0, -100.0], // Much wider bounds to ensure full coverage
        [50.0, -60.0]   
      ], {
        color: '#cbd5e1',
        weight: 0,
        fillColor: '#cbd5e1',
        fillOpacity: 1,
        interactive: false
      }).addTo(mapRef.current);
      
      backgroundOverlay.bringToBack();

      // Add county data and hospitals
      addCountyLayer();
      addHospitalMarkers();
      
      setMapLoaded(true);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map. Please try again.');
    }
  }, [countyGeoData, addCountyLayer, addHospitalMarkers]);

  // Color functions for different data layers

  const getMedicaidColor = (rate?: number | null) => {
    if (!rate) return '#e5e7eb';
    if (rate >= 50) return '#1e40af'; // Very High
    if (rate >= 30) return '#3b82f6'; // High
    if (rate >= 15) return '#60a5fa'; // Moderate
    if (rate >= 5) return '#93c5fd'; // Low
    return '#dbeafe'; // Very Low
  };




  const getSVIColor = (percentile?: number | null) => {
    if (!percentile) return '#e5e7eb';
    if (percentile >= 0.75) return '#dc2626'; // High Vulnerability
    if (percentile >= 0.50) return '#f97316'; // Moderate-High
    if (percentile >= 0.25) return '#fbbf24'; // Moderate-Low
    return '#22c55e'; // Low Vulnerability
  };


  // Update map when data or layer changes - optimized dependencies
  useEffect(() => {
    if (mapLoaded && countyGeoData) {
      addCountyLayer();
      addHospitalMarkers();
    }
  }, [mapLoaded, countyGeoData, currentLayer, addCountyLayer, addHospitalMarkers]);

  // Load hospital data when needed - optimized to prevent frequent calls
  useEffect(() => {
    let isActive = true;
    if (currentLayer === 'hospitals' && hospitals.length === 0 && !hospitalsLoading) {
      loadHospitalData().then(() => {
        // Only update if component is still mounted
        if (isActive && mapRef.current) {
          addHospitalMarkers();
        }
      });
    }
    return () => { isActive = false; };
  }, [currentLayer, hospitals.length, hospitalsLoading, addHospitalMarkers]);

  // Initialize map when county data is loaded - prevent re-initialization
  useEffect(() => {
    if (countyGeoData && L && !mapRef.current) {
      initializeMap();
    }
  }, [countyGeoData, initializeMap]);

  // Zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

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

  // Get hovered county data - optimized with Map lookup
  const hoveredCountyData = hoveredCounty ? healthcareDataMap.get(hoveredCounty) || null : null;
  
  // Get selected county data - optimized with Map lookup
  const selectedCountyData = selectedCounty ? healthcareDataMap.get(selectedCounty.fips) || null : null;

  return (
    <div className={`w-full h-full relative overflow-hidden bg-slate-100 ${styles.mapContainer}`}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full bg-slate-100"
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

      {/* Map Controls */}
      {mapLoaded && (
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      )}

      {/* Map Legend */}
      {mapLoaded && <MapLegend selectedMetric={currentLayer} />}

      {/* Hover Info - Unified County Tile (follows cursor) */}
      {!selectedCounty && !selectedHospital && currentLayer !== 'hospitals' && (
        <UnifiedCountyTile
          county={hoveredCountyData}
          currentLayer={currentLayer}
          position={hoverPosition}
          isFixed={false}
        />
      )}
      
      {/* Selected County Tile (fixed position, pinned) */}
      {selectedCounty && selectedCountyData && !selectedHospital && (
        <UnifiedCountyTile
          county={selectedCountyData}
          currentLayer={currentLayer}
          position={clickPosition}
          isFixed={true}
          onClose={() => {
            onCountyClick(null);
            setClickPosition(null);
          }}
        />
      )}
      
      {/* Selected Hospital Tile (fixed position, pinned) */}
      {selectedHospital && onHospitalClick && (
        <UnifiedCountyTile
          hospital={selectedHospital}
          currentLayer={currentLayer}
          position={hospitalClickPosition}
          isFixed={true}
          onClose={() => {
            onHospitalClick(null);
            setHospitalClickPosition(null);
          }}
        />
      )}


      {/* Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}