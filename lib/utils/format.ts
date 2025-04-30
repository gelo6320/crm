// lib/utils/format.ts

/**
 * Formatta un valore numerico come denaro in formato italiano
 * @param value - Il valore numerico da formattare
 * @returns La stringa formattata
 */
export function formatMoney(value: number): string {
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

/**
 * Formatta i byte in una rappresentazione leggibile 
 * @param bytes - I byte da formattare
 * @param decimals - Il numero di decimali da mostrare
 * @returns La stringa formattata (es. "1.5 MB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formatta un numero di telefono in formato italiano
 * @param phone - Il numero di telefono da formattare
 * @returns La stringa formattata
 */
export function formatPhoneNumber(phone: string): string {
  // Rimuove tutti i caratteri non numerici
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  // Verifica la lunghezza
  const isItalianMobile = cleaned.length === 10 && cleaned.startsWith('3');
  const isItalianLandline = cleaned.length === 10 && !cleaned.startsWith('3');
  
  if (isItalianMobile) {
    // Formato italiano mobile: 333 1234567
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2$3');
  } else if (isItalianLandline) {
    // Formato italiano fisso: 02 12345678
    const prefixLength = 2; // La maggior parte dei prefissi è di 2-4 cifre
    const prefix = cleaned.substring(0, prefixLength);
    const rest = cleaned.substring(prefixLength);
    return `${prefix} ${rest}`;
  }
  
  // Se non corrisponde a nessun formato, restituisce il numero pulito
  return cleaned;
}

/**
 * Tronca un testo a una lunghezza massima
 * @param text - Il testo da troncare
 * @param length - La lunghezza massima
 * @param suffix - Il suffisso da aggiungere
 * @returns Il testo troncato
 */
export function truncateText(text: string, length = 100, suffix = '...'): string {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return text.substring(0, length).trim() + suffix;
}

/**
 * Formatta un valore percentuale
 * @param value - Il valore da formattare (0-100 o 0-1)
 * @param decimals - Il numero di decimali
 * @returns La stringa formattata con simbolo %
 */
export function formatPercentage(value: number, decimals = 1): string {
  // Se il valore è tra 0 e 1, moltiplica per 100
  if (value >= 0 && value <= 1) {
    value = value * 100;
  }
  
  return value.toFixed(decimals) + '%';
}

/**
 * Formatta il tempo in minuti in una rappresentazione ore/minuti
 * @param minutes - I minuti da formattare
 * @returns La stringa formattata (es. "1:30" per 90 minuti)
 */
export function formatTime(minutes: number): string {
  if (minutes < 1) {
    // Per durate inferiori a 1 minuto
    return `<1`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    // Solo minuti
    return `${remainingMinutes}`;
  } else {
    // Ore e minuti
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
  }
}