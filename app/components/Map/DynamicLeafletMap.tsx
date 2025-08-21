'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { County, HealthcareMetrics } from '../../types/healthcare';
import { DataLayer } from '../DataLayers/DataLayerSelector';

interface DynamicLeafletMapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  selectedMetric: DataLayer;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
}

// Dynamically import the real Leaflet map to avoid SSR issues
const RealLeafletMap = dynamic(() => import('./RealLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading interactive map...</p>
        <p className="text-sm text-gray-500 mt-2">Initializing Leaflet with North Carolina data...</p>
      </div>
    </div>
  )
});

// Fallback to the working LeafletMap if RealLeafletMap fails
const LeafletMapFallback = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading fallback map...</p>
      </div>
    </div>
  )
});

export default function DynamicLeafletMap(props: DynamicLeafletMapProps) {
  const [mapError, setMapError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reset error state when props change (e.g., metric selection)
  useEffect(() => {
    if (mapError && retryCount < 2) {
      const timer = setTimeout(() => {
        setMapError(false);
        setRetryCount(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [mapError, retryCount]);

  if (mapError && retryCount >= 2) {
    console.log('RealLeafletMap failed, using fallback LeafletMap');
    return <LeafletMapFallback {...props} />;
  }

  return (
    <div className="h-full">
      <RealLeafletMap {...props} />
    </div>
  );
}