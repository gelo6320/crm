// lib/utils/date.ts

/**
 * Formatta una data in formato italiano
 * @param dateString - La data da formattare (string o Date)
 * @param options - Opzioni di formattazione (default: giorno, mese, anno)
 * @returns La data formattata
 */

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
): string {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  
  // Verifica che la data sia valida
  if (isNaN(date.getTime())) {
    return 'Data non valida';
  }
  
  return new Intl.DateTimeFormat('it-IT', options).format(date);
}

/**
 * Formatta una data e ora in formato italiano
 * @param dateString - La data da formattare
 * @returns La data e ora formattata
 */
export function formatDateTime(dateString: string | Date): string {
  return formatDate(dateString, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Formatta una data in formato relativo (es. "2 giorni fa")
 * @param dateString - La data da formattare
 * @returns La data in formato relativo
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  const now = new Date();
  
  // Verifica che la data sia valida
  if (isNaN(date.getTime())) {
    return 'Data non valida';
  }
  
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSecs < 60) {
    return 'adesso';
  } else if (diffInMins < 60) {
    return `${diffInMins} ${diffInMins === 1 ? 'minuto' : 'minuti'} fa`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'ora' : 'ore'} fa`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'giorno' : 'giorni'} fa`;
  } else {
    return formatDate(date);
  }
}

/**
 * Calcola la differenza in giorni tra due date
 * @param dateA - Prima data
 * @param dateB - Seconda data (default: oggi)
 * @returns Il numero di giorni di differenza
 */
export function getDaysDifference(
  dateA: string | Date,
  dateB: string | Date = new Date()
): number {
  const a = dateA instanceof Date ? dateA : new Date(dateA);
  const b = dateB instanceof Date ? dateB : new Date(dateB);
  
  // Rimuovi il tempo per contare solo i giorni
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  
  // 86400000 = millisecondi in un giorno
  return Math.floor((utcB - utcA) / 86400000);
}

/**
 * Restituisce il nome del mese in italiano
 * @param monthIndex - L'indice del mese (0-11)
 * @param shortName - Se restituire il nome abbreviato
 * @returns Il nome del mese
 */
export function getMonthName(monthIndex: number, shortName = false): string {
  const months = [
    { short: 'Gen', full: 'Gennaio' },
    { short: 'Feb', full: 'Febbraio' },
    { short: 'Mar', full: 'Marzo' },
    { short: 'Apr', full: 'Aprile' },
    { short: 'Mag', full: 'Maggio' },
    { short: 'Giu', full: 'Giugno' },
    { short: 'Lug', full: 'Luglio' },
    { short: 'Ago', full: 'Agosto' },
    { short: 'Set', full: 'Settembre' },
    { short: 'Ott', full: 'Ottobre' },
    { short: 'Nov', full: 'Novembre' },
    { short: 'Dic', full: 'Dicembre' },
  ];
  
  // Assicurati che l'indice sia valido
  if (monthIndex >= 0 && monthIndex < 12) {
    return shortName ? months[monthIndex].short : months[monthIndex].full;
  }
  
  return '';
}

/**
 * Restituisce il nome del giorno della settimana in italiano
 * @param dayIndex - L'indice del giorno (0-6, dove 0 è Domenica)
 * @param shortName - Se restituire il nome abbreviato
 * @returns Il nome del giorno
 */
export function getDayName(dayIndex: number, shortName = false): string {
  const days = [
    { short: 'Dom', full: 'Domenica' },
    { short: 'Lun', full: 'Lunedì' },
    { short: 'Mar', full: 'Martedì' },
    { short: 'Mer', full: 'Mercoledì' },
    { short: 'Gio', full: 'Giovedì' },
    { short: 'Ven', full: 'Venerdì' },
    { short: 'Sab', full: 'Sabato' },
  ];
  
  // Assicurati che l'indice sia valido
  if (dayIndex >= 0 && dayIndex < 7) {
    return shortName ? days[dayIndex].short : days[dayIndex].full;
  }
  
  return '';
}