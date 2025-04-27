// app/_device.tsx
"use client";

import { useEffect } from 'react';
import { initDeviceDetection } from '@/lib/utils/device';

/**
 * Componente che inizializza il rilevamento del dispositivo
 * Viene incluso in layout.tsx per garantire che l'inizializzazione
 * avvenga su ogni pagina
 */
export default function DeviceDetectionInitializer() {
  useEffect(() => {
    // Inizializza il rilevamento del dispositivo
    initDeviceDetection();
    
    // Logica aggiuntiva per gestire il viewport su mobile
    const fixViewportForMobile = () => {
      // Previene problemi di overflow su iOS
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'auto';
      document.body.style.overscrollBehavior = 'none';
      
      // Risolve il problema del 100vh su mobile
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    fixViewportForMobile();
    window.addEventListener('resize', fixViewportForMobile);
    
    return () => {
      window.removeEventListener('resize', fixViewportForMobile);
    };
  }, []);
  
  // Componente invisibile, non renderizza nulla nell'UI
  return null;
}