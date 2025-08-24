'use client';

import { useEffect, useRef } from 'react';

// Dynamic import for Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null;

interface HospitalData {
  id: number;
  facility_name: string;
  alt_name: string;
  county: string;
  city: string;
  facility_type: string;
  total_beds: number;
  general_beds: number;
  total_surgery_rooms: number;
  is_major_hospital: boolean;
  is_emergency_dept: boolean;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  licensee: string;
}

interface HospitalLayerProps {
  hospitals: HospitalData[];
  map: import('leaflet').Map; // Leaflet map instance
  visible: boolean;
}

export default function HospitalLayer({ hospitals, map, visible }: HospitalLayerProps) {
  const layerGroupRef = useRef<import('leaflet').LayerGroup | null>(null);

  useEffect(() => {
    if (!map || !hospitals.length) return;

    const initializeLayer = async () => {
      if (!L) {
        const leaflet = await import('leaflet');
        L = leaflet.default;
      }

      // Remove existing layer if it exists
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
      }

      // Create new layer group
      layerGroupRef.current = L.layerGroup();

      hospitals.forEach((hospital) => {
        // Determine marker style based on hospital type and size
        let markerColor = '#3b82f6'; // Default blue
        let markerSize = 8;
        let markerIcon = '🏥';

        if (hospital.is_emergency_dept) {
          markerColor = '#ef4444'; // Red for EDs
          markerSize = 6;
          markerIcon = '🚑';
        } else if (hospital.facility_type === 'S') {
          markerColor = '#8b5cf6'; // Purple for specialty
          markerIcon = '⚕️';
        } else if (hospital.facility_type === 'Rehab') {
          markerColor = '#10b981'; // Green for rehab
          markerIcon = '🏃';
        } else if (hospital.is_major_hospital) {
          markerColor = '#1e40af'; // Dark blue for major hospitals
          markerSize = 12;
          markerIcon = '🏥';
        }

        // Create custom marker
        if (!L) return;
        const marker = L.circleMarker([hospital.latitude, hospital.longitude], {
          radius: markerSize,
          fillColor: markerColor,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });

        // Create comprehensive popup
        const popupContent = `
          <div class="p-3 min-w-72 max-w-80">
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-bold text-lg text-gray-900 leading-tight pr-2">${hospital.facility_name}</h3>
              <span class="text-xl">${markerIcon}</span>
            </div>
            
            ${hospital.alt_name && hospital.alt_name !== hospital.facility_name ? 
              `<div class="text-sm text-gray-600 mb-2">${hospital.alt_name}</div>` : ''
            }
            
            <div class="mb-3 p-2 ${
              hospital.is_major_hospital ? 'bg-blue-50 border-l-4 border-blue-400' :
              hospital.is_emergency_dept ? 'bg-red-50 border-l-4 border-red-400' :
              'bg-gray-50 border-l-4 border-gray-400'
            } rounded">
              <div class="text-xs font-medium ${
                hospital.is_major_hospital ? 'text-blue-800' :
                hospital.is_emergency_dept ? 'text-red-800' :
                'text-gray-800'
              } mb-1">
                ${hospital.facility_type === 'Hospital' ? 'General Hospital' :
                  hospital.facility_type === 'ED' ? 'Emergency Department' :
                  hospital.facility_type === 'S' ? 'Specialty Facility' :
                  hospital.facility_type === 'LTAC' ? 'Long-Term Acute Care' :
                  hospital.facility_type === 'Rehab' ? 'Rehabilitation Hospital' :
                  hospital.facility_type}
              </div>
              
              ${hospital.total_beds > 0 ? `
                <div class="text-sm font-semibold ${
                  hospital.is_major_hospital ? 'text-blue-700' :
                  hospital.is_emergency_dept ? 'text-red-700' :
                  'text-gray-700'
                }">${hospital.total_beds} Licensed Beds</div>
              ` : '<div class="text-sm text-gray-600">Outpatient/Ambulatory</div>'}
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-2">
                ${hospital.general_beds > 0 ? `
                  <div class="bg-white p-2 rounded border">
                    <div class="text-xs text-gray-600">General Care</div>
                    <div class="font-semibold text-blue-700">${hospital.general_beds} beds</div>
                  </div>
                ` : ''}
                
                ${hospital.total_surgery_rooms > 0 ? `
                  <div class="bg-white p-2 rounded border">
                    <div class="text-xs text-gray-600">Surgery Suites</div>
                    <div class="font-semibold text-green-700">${hospital.total_surgery_rooms} rooms</div>
                  </div>
                ` : ''}
              </div>
              
              <div class="pt-2 border-t border-gray-200">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600">Location:</span>
                  <span class="font-medium">${hospital.city}, ${hospital.county} County</span>
                </div>
                <div class="flex justify-between items-center text-xs mt-1">
                  <span class="text-gray-600">Address:</span>
                  <span class="font-medium text-right">${hospital.address}</span>
                </div>
                ${hospital.phone && hospital.phone !== 'N/A' ? `
                  <div class="flex justify-between items-center text-xs mt-1">
                    <span class="text-gray-600">Phone:</span>
                    <span class="font-medium">${hospital.phone}</span>
                  </div>
                ` : ''}
              </div>
              
              ${hospital.licensee && hospital.licensee !== 'N/A' ? `
                <div class="pt-2 border-t border-gray-200">
                  <div class="text-xs text-gray-600">Licensee:</div>
                  <div class="text-xs font-medium text-gray-800">${hospital.licensee}</div>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: true,
          maxWidth: 320
        });

        // Add to layer group
        if (layerGroupRef.current) {
          layerGroupRef.current.addLayer(marker);
        }
      });

      // Add layer to map if visible
      if (visible) {
        map.addLayer(layerGroupRef.current);
      }
    };

    initializeLayer();

    return () => {
      if (layerGroupRef.current && map) {
        map.removeLayer(layerGroupRef.current);
      }
    };
  }, [hospitals, map, visible]);

  // Handle visibility changes
  useEffect(() => {
    if (!map || !layerGroupRef.current) return;

    if (visible) {
      map.addLayer(layerGroupRef.current);
    } else {
      map.removeLayer(layerGroupRef.current);
    }
  }, [visible, map]);

  return null; // This component doesn't render anything directly
}