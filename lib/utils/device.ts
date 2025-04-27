// lib/utils/device.ts

/**
 * Verifica se il dispositivo corrente è un dispositivo touch
 * Questa funzione usa una combinazione di verifica di API e feature detection
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Verifica le caratteristiche specifiche di touch dei browser
  const hasTouchScreen = (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - Supporto per IE e vecchie versioni
    (navigator.msMaxTouchPoints !== undefined && navigator.msMaxTouchPoints > 0)
  );
  
  if (hasTouchScreen) {
    return true;
  }
  
  // Fallback per user agent se necessario
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
  
  return isMobile;
}

/**
 * Rileva il tipo di dispositivo e aggiunge opportune classi CSS
 * Utile per applicare stili specifici per dispositivi touch
 */
export function setupDeviceDetection(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  // Aggiungi classi CSS in base al tipo di dispositivo
  if (isTouchDevice()) {
    document.documentElement.classList.add('has-touch');
    document.body.classList.add('touch-device');
  } else {
    document.documentElement.classList.add('no-touch');
    document.body.classList.add('mouse-device');
  }
  
  // Rileva iOS per gestire comportamenti specifici
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  if (isIOS) {
    document.documentElement.classList.add('ios');
  }
  
  // Rileva Android
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isAndroid) {
    document.documentElement.classList.add('android');
  }
}

/**
 * Inizializza il rilevamento dei dispositivi quando il documento è pronto
 */
export function initDeviceDetection(): void {
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupDeviceDetection);
    } else {
      setupDeviceDetection();
    }
  }
}