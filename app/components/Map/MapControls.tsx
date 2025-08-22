'use client';

import React from 'react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut }: MapControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-1000 flex flex-col space-y-1">
      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        className="w-8 h-8 map-control-button rounded-sm flex items-center justify-center text-gray-700"
        title="Zoom in"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        className="w-8 h-8 map-control-button rounded-sm flex items-center justify-center text-gray-700"
        title="Zoom out"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
    </div>
  );
}