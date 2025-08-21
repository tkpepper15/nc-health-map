'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { useHealthcareStore } from '../../utils/store';
import MapLegend from './MapLegend';
import HoverInfo from './HoverInfo';
import HospitalLayer from './HospitalLayer';
import { DataLayer } from '../DataLayers/DataLayerSelector';
import styles from './NCMap.module.css';

// Dynamic import for Leaflet to avoid SSR issues
let L: any = null;

// Helper function to format values consistently
function formatValue(value: any, type: 'number' | 'percent' | 'decimal' = 'number'): string {
  if (value === null || value === undefined || value === '') {
    return '<span class="text-gray-400">No Data</span>';
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return '<span class="text-gray-400">No Data</span>';
  }
  
  switch (type) {
    case 'percent':
      return `${num.toFixed(1)}%`;
    case 'decimal':
      return num.toFixed(2);
    case 'number':
    default:
      return num.toLocaleString();
  }
}

interface NCLeafletMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  hospitals?: any[];
  currentLayer?: DataLayer;
  medicaidEnabled: boolean;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
}

export default function NCLeafletMapFixed({
  counties,
  healthcareData,
  hospitals = [],
  currentLayer = 'hcvi',
  medicaidEnabled,
  onCountyClick,
  selectedCounty
}: NCLeafletMapProps) {
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const { 
    hoveredCounty, 
    hoverPosition, 
    setHoveredCounty, 
    setHoverPosition 
  } = useHealthcareStore();

  // Memoize healthcare data lookup for performance
  const healthcareDataMap = useMemo(() => {
    const map = new Map();
    healthcareData.forEach(data => {
      map.set(data.fips_code, data);
    });
    return map;
  }, [healthcareData]);

  // Memoize county lookup
  const countyMap = useMemo(() => {
    const map = new Map();
    counties.forEach(county => {
      map.set(county.fips, county);
    });
    return map;
  }, [counties]);

  // Memoized style calculation
  const getCountyStyle = useCallback((feature: any) => {
    const fips = feature.properties.fips || feature.properties.FIPS;
    const healthData = healthcareDataMap.get(fips);
    
    let fillColor = '#e5e7eb'; // Default gray
    let fillOpacity = 0.7;

    if (healthData) {
      if (currentLayer === 'medicaid') {
        // Color by Medicaid enrollment rate (actual data-driven)
        const enrollmentRate = healthData.medicaid_enrollment_rate || 0;
        
        // Color scale based on Medicaid enrollment rate
        if (enrollmentRate >= 50) {
          fillColor = '#1e40af';      // High enrollment - Deep Blue
          fillOpacity = 0.8;
        } else if (enrollmentRate >= 30) {
          fillColor = '#3b82f6';      // Moderate-High - Blue  
          fillOpacity = 0.75;
        } else if (enrollmentRate >= 15) {
          fillColor = '#60a5fa';      // Moderate - Light Blue
          fillOpacity = 0.7;
        } else if (enrollmentRate >= 5) {
          fillColor = '#93c5fd';      // Low-Moderate - Very Light Blue
          fillOpacity = 0.65;
        } else {
          fillColor = '#dbeafe';      // Very Low - Pale Blue
          fillOpacity = 0.6;
        }

        // SVI overlay option (if medicaidEnabled is used for SVI instead)
        if (medicaidEnabled && healthData.svi_data?.svi_overall_percentile) {
          const sviPercentile = healthData.svi_data.svi_overall_percentile * 100;
          // Overlay red tint for high vulnerability
          if (sviPercentile >= 75) {
            fillColor = '#dc2626';  // High SVI - Red
            fillOpacity = 0.8;
          } else if (sviPercentile >= 50) {
            fillColor = '#f97316';  // Moderate-High SVI - Orange
            fillOpacity = 0.75;
          }
        }
      } else if (currentLayer === 'hcvi') {
        // Color by Overall HCVI Composite Score
        const hcviScore = healthData.hcvi_composite;
        if (hcviScore !== null && hcviScore !== undefined) {
          if (hcviScore >= 7.5) {
            fillColor = '#dc2626';  // Extreme - Dark Red
            fillOpacity = 0.9;
          } else if (hcviScore >= 5.5) {
            fillColor = '#ef4444';  // High - Red
            fillOpacity = 0.8;
          } else if (hcviScore >= 3.5) {
            fillColor = '#f59e0b';  // Moderate - Amber
            fillOpacity = 0.7;
          } else {
            fillColor = '#22c55e';  // Low - Green
            fillOpacity = 0.6;
          }
        }
      } else if (currentLayer === 'healthcare-access') {
        // Color by Healthcare Access Score
        const accessScore = healthData.healthcare_access_score;
        if (accessScore !== null && accessScore !== undefined) {
          if (accessScore >= 7) {
            fillColor = '#dc2626';  // Poor access - Red
            fillOpacity = 0.8;
          } else if (accessScore >= 5) {
            fillColor = '#f97316';  // Limited access - Orange
            fillOpacity = 0.75;
          } else if (accessScore >= 3) {
            fillColor = '#fbbf24';  // Moderate access - Yellow
            fillOpacity = 0.7;
          } else {
            fillColor = '#22c55e';  // Good access - Green
            fillOpacity = 0.65;
          }
        }
      } else if (currentLayer === 'policy-risk') {
        // Color by Policy Risk Score
        const policyRisk = healthData.policy_risk_score;
        if (policyRisk !== null && policyRisk !== undefined) {
          if (policyRisk >= 7) {
            fillColor = '#dc2626';  // High risk - Red
            fillOpacity = 0.8;
          } else if (policyRisk >= 5) {
            fillColor = '#f97316';  // Moderate-High risk - Orange
            fillOpacity = 0.75;
          } else if (policyRisk >= 3) {
            fillColor = '#fbbf24';  // Moderate risk - Yellow
            fillOpacity = 0.7;
          } else {
            fillColor = '#22c55e';  // Low risk - Green
            fillOpacity = 0.65;
          }
        }
      } else if (currentLayer === 'economic-vulnerability') {
        // Color by Economic Vulnerability Score
        const economicScore = healthData.economic_vulnerability_score;
        if (economicScore !== null && economicScore !== undefined) {
          if (economicScore >= 7) {
            fillColor = '#dc2626';  // High vulnerability - Red
            fillOpacity = 0.8;
          } else if (economicScore >= 5) {
            fillColor = '#f97316';  // Moderate-High vulnerability - Orange
            fillOpacity = 0.75;
          } else if (economicScore >= 3) {
            fillColor = '#fbbf24';  // Moderate vulnerability - Yellow
            fillOpacity = 0.7;
          } else {
            fillColor = '#22c55e';  // Low vulnerability - Green
            fillOpacity = 0.65;
          }
        }
      } else if (currentLayer === 'svi') {
        // Color by SVI percentile
        if (healthData.svi_data?.svi_overall_percentile) {
          const sviPercentile = healthData.svi_data.svi_overall_percentile * 100;
          if (sviPercentile >= 75) {
            fillColor = '#dc2626';  // High vulnerability - Red
            fillOpacity = 0.8;
          } else if (sviPercentile >= 50) {
            fillColor = '#f97316';  // Moderate-High - Orange
            fillOpacity = 0.75;
          } else if (sviPercentile >= 25) {
            fillColor = '#fbbf24';  // Moderate-Low - Yellow
            fillOpacity = 0.7;
          } else {
            fillColor = '#22c55e';  // Low vulnerability - Green
            fillOpacity = 0.65;
          }
        }
      } else if (currentLayer === 'hospitals') {
        // Minimal county styling for hospital view
        fillColor = '#f3f4f6';  // Very light gray
        fillOpacity = 0.3;
      }
    }

    return {
      fillColor,
      weight: 1.5, // Slightly thicker borders
      opacity: 1,
      color: '#ffffff', // White county borders
      fillOpacity,
      className: 'county-boundary' // Custom class for styling
    };
  }, [healthcareDataMap, medicaidEnabled, currentLayer]);

  // Track component mount status
  const mountedRef = useRef(true);

  // Initialize map only once
  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Dynamic import Leaflet
        const leaflet = await import('leaflet');
        L = leaflet.default;

        // Fix for default markers (not needed for this map, but good practice)
        try {
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAFgUlEQVR4Aa1XA5BjWRTN2oW17d3YaZtr2962HUzbXNfN1+3951TXXVBBENfrLFriEwAYQAoAX3O/AACAG3xGAAAoACfwAAAoAAHrAQAAOAAAUAAAOwACABZmAwDAOgACdAA80ADhIAB0AUC8ADAA3NWKAACAPQC8Hd7I',
            iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAFgUlEQVR4Aa1XA5BjWRTN2oW17d3YaZtr2962HUzbXNfN1+3951TXXVBBENfrLFriEwAYQAoAX3O/AACAG3xGAAAoACfwAAAoAAHrAQAAOAAAUAAAOwACABZmAwDAOgACdAA80ADhIAB0AUC8ADAA3NWKAACAPQC8Hd7I',
            shadowUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAQAAAACach9AAACMUlEQVR4Ae3ShY7jQBCF4deScrEqpKihjGxjG2O7yPYytrExsrGxsbGxsrGxsY2NjWzMObeFH6jXX5'
          });
        } catch (e) {
          // Ignore marker icon errors since we don't use markers
        }

        // Load county boundaries
        const { ncCountiesGeoJSON } = await import('../../data/ncCountiesGeoJSON');
        
        if (!mountedRef.current) return;

        // Create map only once
        if (!mapRef.current && mapContainer.current) {
          mapRef.current = L.map(mapContainer.current, {
            center: [35.5, -79.4], // Optimally centered on NC
            zoom: 7,
            minZoom: 6,
            maxZoom: 11,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            attributionControl: false,
            zoomAnimation: true,
            fadeAnimation: true,
            preferCanvas: true // Better performance for lots of polygons
          });

          // Add optimized base layer for areas outside NC
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 11, // Match map max zoom
            minZoom: 6,  // Match map min zoom
            opacity: 0.2, // Very muted for background
            className: 'grayscale-map',
            keepBuffer: 2, // Reduce tile buffer for performance
            maxNativeZoom: 11, // Prevent loading unnecessary high-zoom tiles
            updateWhenIdle: true, // Only update when user stops interacting
            updateWhenZooming: false, // Don't update during zoom animation
            bounds: [
              [33.0, -85.0], // Southwest corner (roughly NC area)
              [37.0, -75.0]  // Northeast corner
            ]
          }).addTo(mapRef.current);

          // CSS styling is now handled by the CSS module

          // Create county layer
          geoJsonLayerRef.current = L.geoJSON(ncCountiesGeoJSON, {
            style: getCountyStyle,
            onEachFeature: (feature: any, layer: any) => {
              const fips = feature.properties.fips || feature.properties.FIPS;
              const countyName = feature.properties.NAME || feature.properties.name;
              const healthData = healthcareDataMap.get(fips);
              
              // Add accessibility attributes
              layer.options.role = 'button';
              layer.options.tabindex = 0;
              layer.options['aria-label'] = `${countyName} County. ${
                healthData?.hcvi_composite ? 
                `Healthcare vulnerability score: ${healthData.hcvi_composite.toFixed(1)}` : 
                'No healthcare data available'
              }. Click to view details.`;
              
              layer.on({
                mouseover: (e: any) => {
                  setHoveredCounty(fips);
                  setHoverPosition({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                },
                mouseout: () => {
                  setHoveredCounty(null);
                  setHoverPosition(null);
                },
                click: () => {
                  const county = countyMap.get(fips);
                  onCountyClick(county || null);
                },
                keydown: (e: any) => {
                  if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
                    e.originalEvent.preventDefault();
                    const county = countyMap.get(fips);
                    onCountyClick(county || null);
                  }
                }
              });

              // Enhanced popup with real data  
              const sviData = healthData?.svi_data;
              
              // Data available for popup display
              
              // Create comprehensive popup with actual raw data
              const popupContent = `
                <div class="p-4 min-w-80 max-w-96">
                  <h3 class="font-bold text-lg mb-3 text-gray-900">${countyName}</h3>
                  
                  <!-- Medicaid Enrollment Data -->
                  <div class="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div class="text-sm font-semibold text-green-800 mb-2">📊 Medicaid Enrollment (June 2025)</div>
                    <div class="space-y-1 text-sm">
                      <div class="flex justify-between">
                        <span class="text-gray-700">Total Enrolled:</span>
                        <span class="font-bold text-green-700">${formatValue(healthData?.medicaid_total_enrollment, 'number')}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-700">Expansion Enrollment:</span>
                        <span class="font-medium text-green-600">${formatValue(healthData?.medicaid_expansion_enrollment, 'number')}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-700">Traditional Medicaid:</span>
                        <span class="font-medium text-green-600">${formatValue(healthData?.medicaid_traditional_enrollment, 'number')}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-700">Enrollment Rate:</span>
                        <span class="font-medium text-green-600">${formatValue(healthData?.medicaid_enrollment_rate, 'percent')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Social Vulnerability Index (SVI) Data -->
                  ${sviData && sviData.svi_overall_percentile !== null ? `
                  <div class="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div class="text-sm font-semibold text-orange-800 mb-2">🏘️ Social Vulnerability Index (SVI 2022)</div>
                    <div class="space-y-2 text-xs">
                      <!-- Overall SVI -->
                      <div class="bg-white p-2 rounded border">
                        <div class="font-medium text-gray-900 mb-1">Overall SVI Ranking</div>
                        <div class="text-lg font-bold text-orange-700">${formatValue(sviData.svi_overall_percentile ? sviData.svi_overall_percentile * 100 : null, 'decimal')}th percentile</div>
                        <div class="text-xs text-gray-600">Higher = more vulnerable</div>
                      </div>
                      
                      <!-- Four Themes -->
                      <div class="grid grid-cols-2 gap-1">
                        <div class="bg-white p-2 rounded">
                          <div class="font-medium text-gray-800">Theme 1: Socioeconomic</div>
                          <div class="font-bold text-blue-600">${formatValue(sviData.socioeconomic_percentile ? sviData.socioeconomic_percentile * 100 : null, 'decimal')}%</div>
                        </div>
                        <div class="bg-white p-2 rounded">
                          <div class="font-medium text-gray-800">Theme 2: Household Comp.</div>
                          <div class="font-bold text-purple-600">${formatValue(sviData.household_composition_percentile ? sviData.household_composition_percentile * 100 : null, 'decimal')}%</div>
                        </div>
                        <div class="bg-white p-2 rounded">
                          <div class="font-medium text-gray-800">Theme 3: Racial/Ethnic Minority</div>
                          <div class="font-bold text-indigo-600">${formatValue(sviData.racial_minority_percentile ? sviData.racial_minority_percentile * 100 : null, 'decimal')}%</div>
                        </div>
                        <div class="bg-white p-2 rounded">
                          <div class="font-medium text-gray-800">Theme 4: Housing/Transport</div>
                          <div class="font-bold text-teal-600">${formatValue(sviData.housing_transport_percentile ? sviData.housing_transport_percentile * 100 : null, 'decimal')}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  ` : `
                  <div class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="text-sm font-medium text-gray-600">⚠️ SVI Data Not Available</div>
                  </div>
                  `}
                  
                  <!-- Basic Demographics -->
                  <div class="mb-3 p-2 bg-gray-50 rounded border">
                    <div class="text-xs font-medium text-gray-700 mb-1">Demographics</div>
                    <div class="text-xs text-gray-600">
                      Population: ${formatValue(healthData?.population_2020, 'number')} (2020)
                    </div>
                  </div>
                  
                  <div class="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    💡 Click county for detailed breakdown
                  </div>
                </div>
              `;
              
              layer.bindPopup(popupContent, {
                closeButton: true,
                maxWidth: 300
              });
            }
          }).addTo(mapRef.current);

          // Fit bounds to North Carolina with optimal padding
          mapRef.current.fitBounds(geoJsonLayerRef.current.getBounds(), {
            padding: [30, 30], // More padding for better framing
            maxZoom: 8 // Don't zoom in too much initially
          });

          // Add prominent North Carolina state boundary
          const stateOutline = L.geoJSON(ncCountiesGeoJSON, {
            style: {
              fillColor: 'transparent',
              color: '#1f2937', // Dark border to define NC
              weight: 4,
              opacity: 1,
              fillOpacity: 0,
              dashArray: '0', // Solid line
              lineCap: 'round',
              lineJoin: 'round'
            },
            interactive: false
          }).addTo(mapRef.current);

          // Restrict map to North Carolina area
          const bounds = geoJsonLayerRef.current.getBounds();
          const restrictedBounds = bounds.pad(0.05); // Minimal padding
          mapRef.current.setMaxBounds(restrictedBounds);
          
          // Set zoom constraints specifically for NC
          mapRef.current.setMinZoom(6);
          mapRef.current.setMaxZoom(11);

          setMapLoaded(true);
        }
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setMapError('Failed to load map. Please refresh the page.');
      }
    };

    initializeMap();

    return () => {
      mountedRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Only run once!

  // Update styles when data changes (without recreating layer)
  useEffect(() => {
    if (geoJsonLayerRef.current && mapLoaded) {
      // Just update styles without recreating the entire layer
      geoJsonLayerRef.current.eachLayer((layer: any) => {
        const feature = layer.feature;
        layer.setStyle(getCountyStyle(feature));
      });
    }
  }, [medicaidEnabled, currentLayer, getCountyStyle, mapLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (mapRef.current) {
        // Clean up all layers and event listeners
        mapRef.current.eachLayer((layer: any) => {
          if (layer.off) {
            layer.off();
          }
          mapRef.current?.removeLayer(layer);
        });
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current = null;
      }
    };
  }, []);

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <div className="text-red-500 text-lg mb-2">Map Loading Error</div>
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

  const hoveredCountyData = hoveredCounty ? healthcareDataMap.get(hoveredCounty) || null : null;
  const hoveredCountyInfo = hoveredCounty ? {
    name: countyMap.get(hoveredCounty)?.name || 'Unknown County',
    fips: hoveredCounty
  } : null;

  return (
    <div className="w-full h-full relative">
      {/* Map Container - Optimized for North Carolina */}
      <div 
        ref={mapContainer} 
        className={styles.mapContainer}
        role="application"
        aria-label="Interactive map of North Carolina showing healthcare vulnerability data by county"
        tabIndex={0}
      />

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading North Carolina map...</p>
          </div>
        </div>
      )}

      {/* Hospital Layer */}
      {mapLoaded && currentLayer === 'hospitals' && (
        <HospitalLayer
          hospitals={hospitals}
          map={mapRef.current}
          visible={true}
        />
      )}

      {/* Map Legend */}
      {mapLoaded && <MapLegend selectedMetric={currentLayer} />}

      {/* Hover Info */}
      <HoverInfo
        county={hoveredCountyInfo}
        healthcareData={hoveredCountyData}
        position={hoverPosition}
      />
    </div>
  );
}