'use client';

import { useState, useCallback } from 'react';
import CountyDetailPanel from './components/County/CountyDetailPanel';
import dynamic from 'next/dynamic';
import { DataLayer } from './components/DataLayers/DataLayerSelector';
import { useHealthcareStore } from './utils/store';
import { useOptimizedHealthcareData } from './hooks/useOptimizedHealthcareData';
import { County, Hospital } from './types/healthcare';

const NCLeafletMap = dynamic(() => import('./components/Map/NCLeafletMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg"></div>,
});
const DescriptionLegendTile = dynamic(() => import('./components/Map/DescriptionLegendTile'), {
  ssr: false,
});
const Sidebar = dynamic(() => import('./components/Sidebar/Sidebar'), { ssr: false });
import DataLayerSelector from './components/DataLayers/DataLayerSelector';

export default function ClientApp() {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [currentLayer, setCurrentLayer] = useState<DataLayer>('hcvi_composite');

  const { selectedCounty, setSelectedCounty } = useHealthcareStore();
  const { healthcareData, counties } = useOptimizedHealthcareData();

  const handleHospitalClick = useCallback((hospital: Hospital | null) => {
    setSelectedHospital(hospital);
  }, []);

  const handleLayerChange = useCallback((layer: DataLayer) => {
    setCurrentLayer(layer);
    if (layer.includes('hospital') || layer === 'private_equity') {
      setSelectedCounty(null);
    } else {
      setSelectedHospital(null);
    }
  }, [setSelectedCounty]);

  const handleCountyClick = useCallback((county: County | null) => {
    if (county) {
      setSelectedCounty(county.fips);
      setSelectedHospital(null);
    } else {
      setSelectedCounty(null);
    }
  }, [setSelectedCounty]);

  return (
    <div className="grid grid-cols-[340px_1fr] grid-rows-1 h-screen w-full bg-gray-50">
      {/* Left sidebar: county detail + legend + layer picker */}
      <aside className="h-full w-[340px] min-w-[320px] max-w-[380px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white">
          {selectedCounty && (
            <CountyDetailPanel
              county={healthcareData.find(c => c.fips_code === selectedCounty) || null}
              onClose={() => setSelectedCounty(null)}
              currentLayer={currentLayer}
            />
          )}
        </div>
        <div className="flex flex-col gap-4 mt-2">
          <DescriptionLegendTile currentLayer={currentLayer} />
          <DataLayerSelector currentLayer={currentLayer} onLayerChange={handleLayerChange} />
        </div>
      </aside>

      {/* Main area: map (top) + news / chat panel (bottom) */}
      <div className="grid grid-rows-[1fr_300px] h-full w-full">
        <div className="relative w-full h-full">
          <NCLeafletMap
            counties={counties}
            healthcareData={healthcareData}
            medicaidEnabled={currentLayer.includes('medicaid')}
            onCountyClick={handleCountyClick}
            selectedCounty={counties.find(c => c.fips === selectedCounty) || null}
            currentLayer={currentLayer}
            onHospitalClick={handleHospitalClick}
            selectedHospital={selectedHospital}
          />
        </div>
        <div className="w-full h-full bg-white border-t border-gray-200">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
