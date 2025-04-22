import React, { useState, useEffect } from 'react';

const DebugScrollZones = () => {
  const [containerRect, setContainerRect] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  });

  useEffect(() => {
    // Funzione per calcolare e aggiornare le dimensioni del contenitore
    const updateContainerDimensions = () => {
      const container = document.getElementById('funnel-board-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setContainerRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    };

    // Esegui immediatamente e ad ogni resize
    updateContainerDimensions();
    window.addEventListener('resize', updateContainerDimensions);
    
    // Set up un intervallo per aggiornare periodicamente le dimensioni
    // Utile quando l'UI può cambiare senza un evento resize
    const interval = setInterval(updateContainerDimensions, 2000);

    return () => {
      window.removeEventListener('resize', updateContainerDimensions);
      clearInterval(interval);
    };
  }, []);

  // Calcolo delle zone rispetto al contenitore
  const leftZoneWidth = containerRect.width * 0.15;
  const rightZoneStart = containerRect.width * 0.85;

  if (containerRect.width === 0) {
    return null; // Non renderizzare nulla finché non abbiamo le dimensioni
  }

  return (
    <div className="fixed pointer-events-none z-40" style={{
      left: `${containerRect.left}px`,
      top: `${containerRect.top}px`,
      width: `${containerRect.width}px`,
      height: `${containerRect.height}px`
    }}>
      {/* Zona sinistra - scrolling negativo */}
      <div 
        className="absolute top-0 bottom-0 left-0 bg-red-500/20"
        style={{ width: `${leftZoneWidth}px` }}
      >
        <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-xs">
          Scroll Left Zone (15%)
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
          No Scroll Zone (70%)
        </div>
      </div>

      {/* Zona destra - scrolling positivo */}
      <div 
        className="absolute top-0 bottom-0 right-0 bg-blue-500/20"
        style={{ width: `${containerRect.width - rightZoneStart}px` }}
      >
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          Scroll Right Zone (15%)
        </div>
      </div>
      
      {/* Indicatore di mouse tracking */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white px-2 py-1 rounded text-xs">
        Container: {Math.round(containerRect.width)}×{Math.round(containerRect.height)}
      </div>
    </div>
  );
};

export default DebugScrollZones;