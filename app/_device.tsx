"use client";

// app/_device.tsx
import { useEffect } from "react";
import { setupDeviceDetection } from "@/lib/utils/device";

/**
 * Componente per l'inizializzazione del rilevamento del dispositivo
 * Utile per ottimizzazioni responsive e touch
 */
export default function DeviceDetectionInitializer() {
  useEffect(() => {
    // Inizializza il rilevamento del dispositivo quando il componente è montato
    setupDeviceDetection();
  }, []);

  // Questo componente non renderizza nulla nell'UI
  return null;
}