import React, { useState, useEffect } from 'react';

const DebugScrollZones = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [containerInfo, setContainerInfo] = useState({
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
    maxScroll: 0
  });

  // Calcola le zone basate sulla viewport
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const leftZone = viewportWidth * 0.1;    // 10% sinistra
  const rightZone = viewportWidth * 0.9;   // 90% (10% destra)

  useEffect(() => {
    // Funzione per aggiornare le informazioni sul container
    const updateContainerInfo = () => {
      const container = document.getElementById('funnel-board-container');
      if (container) {
        setContainerInfo({
          scrollLeft: container.scrollLeft,
          scrollWidth: container.scrollWidth,
          clientWidth: container.clientWidth,
          maxScroll: container.scrollWidth - container.clientWidth
        });
      }
    };

    // Aggiorna le informazioni all'avvio
    updateContainerInfo();
    
    // Traccia la posizione del mouse
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Impostare un intervallo per aggiornare le informazioni del container
    const interval = setInterval(updateContainerInfo, 100);
    
    // Aggiungi listener per il movimento del mouse
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Zona sinistra - scrolling negativo */}
      <div 
        className="absolute top-0 bottom-0 left-0 bg-red-500/20"
        style={{ width: `${leftZone}px` }}
      >
        <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          Scroll LEFT Zone (10%)
        </div>
      </div>

      {/* Zona centrale - nessun scrolling */}
      <div 
        className="absolute top-0 bottom-0 bg-green-500/10"
        style={{ 
          left: `${leftZone}px`, 
          width: `${rightZone - leftZone}px` 
        }}
      >
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          No Scroll Zone (80%)
        </div>
      </div>

      {/* Zona destra - scrolling positivo */}
      <div 
        className="absolute top-0 bottom-0 right-0 bg-blue-500/20"
        style={{ width: `${viewportWidth - rightZone}px` }}
      >
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          Scroll RIGHT Zone (10%)
        </div>
      </div>
      
      {/* Pannello di debug in basso con info */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div>Mouse X:</div>
          <div>{mousePosition.x}px</div>
          
          <div>Viewport width:</div>
          <div>{viewportWidth}px</div>
          
          <div>Container scroll:</div>
          <div>{containerInfo.scrollLeft}/{containerInfo.maxScroll}px</div>
          
          <div>Zona attiva:</div>
          <div>
            {mousePosition.x < leftZone ? (
              <span className="text-red-400">LEFT</span>
            ) : mousePosition.x > rightZone ? (
              <span className="text-blue-400">RIGHT</span>
            ) : (
              <span className="text-green-400">CENTRO</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Indicatore posizione mouse */}
      <div 
        className="absolute w-1 h-screen bg-yellow-500/50" 
        style={{ left: `${mousePosition.x}px` }}
      />
    </div>
  );
};

export default DebugScrollZones;