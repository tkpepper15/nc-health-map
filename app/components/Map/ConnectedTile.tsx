'use client';

import React from 'react';
import UnifiedCountyTile from './UnifiedCountyTile';

interface ConnectedTileProps {
  county: any;
  currentLayer: import('../DataLayers/DataLayerSelector').DataLayer,
  onClose: () => void;
  sourcePoint: { x: number; y: number } | null;
}

export default function ConnectedTile({
  county,
  currentLayer,
  onClose,
  sourcePoint
}: ConnectedTileProps) {
  const tileRef = React.useRef<HTMLDivElement>(null);
  const [tilePos, setTilePos] = React.useState({ x: 0, y: 0, anchorY: 0 });

  React.useEffect(() => {
    if (!sourcePoint) return;
    
    // Position the tile relative to the viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tileHeight = tileRef.current?.offsetHeight || 0;
    const tileWidth = tileRef.current?.offsetWidth || 300;

    // Prefer placing the tile below the source point; if there's not enough space, place it above
    let yPos: number;
    if (sourcePoint.y + 20 + tileHeight > viewportHeight - 20) {
      // place above
      yPos = Math.max(20, sourcePoint.y - tileHeight - 20);
    } else {
      // place below
      yPos = sourcePoint.y + 20;
    }

    // Clamp x so the tile remains fully inside the viewport
    const halfTile = Math.max(150, tileWidth / 2);
    let xPos = sourcePoint.x;
    xPos = Math.max(halfTile + 10, xPos);
    xPos = Math.min(viewportWidth - halfTile - 10, xPos);

    // Determine anchor Y on the tile (where the connector should point). If tile is above the source,
    // anchor at the bottom of the tile; otherwise anchor at the top.
    const anchorY = yPos < sourcePoint.y ? yPos + tileHeight : yPos;

    setTilePos({
      x: xPos,
      y: yPos,
      anchorY
    });
  }, [sourcePoint]);

  if (!sourcePoint) return null;

  return (
    <>
      {/* Connecting line */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 999
        }}
      >
        <line
          x1={sourcePoint.x}
          y1={sourcePoint.y}
          x2={tilePos.x}
          y2={tilePos.anchorY}
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeDasharray="4"
        />
      </svg>
      
      {/* County details tile */}
      <div ref={tileRef} style={{ position: 'absolute', left: tilePos.x, top: tilePos.y, transform: 'translateX(-50%)', zIndex: 1000 }}>
        <UnifiedCountyTile
          county={county}
          currentLayer={currentLayer}
          position={null}
          isFixed={true}
          onClose={onClose}
        />
      </div>
    </>
  );
}