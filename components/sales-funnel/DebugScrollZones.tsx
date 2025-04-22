import React, { useState, useEffect } from 'react';

const DebugScrollZones = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calcolo delle zone come nel FunnelColumn.tsx
  const leftZoneWidth = dimensions.width * 0.3;
  const rightZoneStart = dimensions.width * 0.7;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Zona sinistra - scrolling negativo */}
      <div 
        className="absolute top-0 bottom-0 left-0 bg-red-500/20"
        style={{ width: `${leftZoneWidth}px` }}
      >
        <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-xs">
          Scroll Left Zone
        </div>
      </div>

      {/* Zona centrale - nessun scrolling */}
      <div 
        className="absolute top-0 bottom-0 bg-green-500/10"
        style={{ 
          left: `${leftZoneWidth}px`, 
          width: `${rightZoneStart - leftZoneWidth}px` 
        }}
      >
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs">
          No Scroll Zone
        </div>
      </div>

      {/* Zona destra - scrolling positivo */}
      <div 
        className="absolute top-0 bottom-0 right-0 bg-blue-500/20"
        style={{ left: `${rightZoneStart}px` }}
      >
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          Scroll Right Zone
        </div>
      </div>
    </div>
  );
};

export default DebugScrollZones;