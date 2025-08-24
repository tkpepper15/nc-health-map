import { create } from 'zustand';
import { AppState } from '../types/healthcare';

interface HealthcareAppState extends AppState {
  // Hover state
  hoveredCounty: string | null;
  hoverPosition: { x: number; y: number } | null;
  
  // Actions
  setSelectedMetric: (metric: string) => void;
  setSelectedCounty: (countyId: string | null) => void;
  setHoveredCounty: (countyId: string | null) => void;
  setHoverPosition: (position: { x: number; y: number } | null) => void;
  setActiveLayer: (layer: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMapView: (center: [number, number], zoom: number) => void;
  setFilters: (filters: Partial<AppState['filters']>) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  classification: ['urban', 'rural', 'frontier'],
  hcviRange: [1, 10] as [number, number],
  riskLevel: ['low', 'moderate', 'high', 'extreme']
};

export const useHealthcareStore = create<HealthcareAppState>((set) => ({
  // State
  selectedMetric: 'hcvi',
  selectedCounty: null,
  hoveredCounty: null,
  hoverPosition: null,
  activeLayer: 'hcvi',
  sidebarOpen: true,
  mapView: {
    center: [-79.0193, 35.7596], // North Carolina center
    zoom: 7
  },
  filters: defaultFilters,

  // Actions
  setSelectedMetric: (metric: string) => {
    set({ selectedMetric: metric, activeLayer: metric });
  },

  setSelectedCounty: (countyId: string | null) => {
    set({ selectedCounty: countyId });
  },

  setHoveredCounty: (countyId: string | null) => {
    set({ hoveredCounty: countyId });
  },

  setHoverPosition: (position: { x: number; y: number } | null) => {
    set({ hoverPosition: position });
  },

  setActiveLayer: (layer: string) => {
    set({ activeLayer: layer });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setMapView: (center: [number, number], zoom: number) => {
    set({ mapView: { center, zoom } });
  },

  setFilters: (newFilters: Partial<AppState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  }
}));

// Selector hooks for commonly used state
export const useSelectedMetric = () => useHealthcareStore((state) => state.selectedMetric);
export const useSelectedCounty = () => useHealthcareStore((state) => state.selectedCounty);
export const useHoveredCounty = () => useHealthcareStore((state) => state.hoveredCounty);
export const useHoverPosition = () => useHealthcareStore((state) => state.hoverPosition);
export const useActiveLayer = () => useHealthcareStore((state) => state.activeLayer);
export const useSidebarOpen = () => useHealthcareStore((state) => state.sidebarOpen);
export const useMapView = () => useHealthcareStore((state) => state.mapView);
export const useFilters = () => useHealthcareStore((state) => state.filters);