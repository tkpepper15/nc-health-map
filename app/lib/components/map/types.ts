/**
 * Map component types and interfaces
 */

import { County, HealthcareMetrics } from '../../../types/healthcare';
import { DataLayer } from '../../../components/DataLayers/DataLayerSelector';

export interface MapProps {
  counties: County[];
  healthcareData: HealthcareMetrics[];
  selectedMetric: DataLayer;
  onCountyClick: (county: County | null) => void;
  selectedCounty: County | null;
  className?: string;
  showHospitals?: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
  bounds?: MapBounds;
}

export interface CountyTooltipProps {
  county: County;
  healthcareData: HealthcareMetrics | null;
  selectedMetric: DataLayer;
  position: { x: number; y: number };
  visible: boolean;
}

export interface MapLegendProps {
  selectedMetric: DataLayer;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export interface HospitalLayerProps {
  hospitals: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    county: string;
    facilityType: string;
    totalBeds?: number;
  }>;
  visible: boolean;
  onHospitalClick?: (hospital: any) => void;
}