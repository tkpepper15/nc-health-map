'use client';

import { County, HealthcareMetrics } from '../../types/healthcare';
// GeoJSON now loaded dynamically from public/data/nc-counties.json
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
  // This component is temporarily disabled due to GeoJSON loading changes
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Map Component</h3>
        <p className="text-gray-600">This component is being updated to work with the new data loading system.</p>
      </div>
    </div>
  );
}
