// lib/utils/calendar.ts
import { CalendarEvent } from "@/types";

/**
 * Restituisce il colore corrispondente allo stato di un evento
 */
export function getEventColor(status?: string, eventType?: string, darker = false): string {
  // Priorità al tipo di evento se fornito
  if (eventType === 'reminder') {
    return darker ? '#7e22ce' : '#9333ea'; // Viola per i promemoria
  }
  
  // Altrimenti usa lo stato
  switch (status) {
    case "confirmed":
      return darker ? "#FF5500" : "#FF6B00"; // Arancione (colore primario)
    case "pending":
      return darker ? "#2563eb" : "#3b82f6"; // Blu
    case "completed":
      return darker ? "#0f9d58" : "#10b981"; // Verde
    case "cancelled":
      return darker ? "#c0392b" : "#ef4444"; // Rosso
    default:
      return darker ? "#4b5563" : "#6b7280"; // Grigio
  }
}

/**
 * Restituisce l'icona corrispondente al tipo di evento
 */
export function getEventTypeIcon(eventType?: string): string {
  switch (eventType) {
    case 'reminder':
      return 'Clock';
    case 'appointment':
      return 'Bookmark';
    default:
      return 'Calendar';
  }
}

/**
 * Verifica se due date sono lo stesso giorno
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Raggruppa gli eventi per data
 */
export function groupEventsByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};
  
  events.forEach(event => {
    const date = new Date(event.start).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(event);
  });
  
  return grouped;
}

/**
 * Filtra gli eventi per un determinato giorno
 */
export function filterEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  return events.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate >= targetDate && eventDate < nextDay;
  });
}

/**
 * Genera intervalli di tempo per la vista giornaliera
 */
export function generateTimeSlots(startHour: number = 8, endHour: number = 20, intervalMinutes: number = 30): string[] {
  const slots: string[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  
  return slots;
}

/**
 * Migliora la renderizzazione su mobile definendo le dimensioni appropriate
 */
export function getMobileDimensions() {
  return {
    cellHeight: 40,     // Altezza delle celle per mobile
    headerHeight: 50,   // Altezza dell'header per mobile
    eventMinHeight: 30, // Altezza minima degli eventi per mobile
  };
}

/**
 * Migliora la gestione del trascinamento su dispositivi touch
 */
export function getTouchOptions() {
  return {
    delay: 300,          // Ritardo prima dell'inizio del trascinamento
    delayTouchStart: 200, // Ritardo specifico per touch
    touchSlop: 20,        // Distanza minima per considerare un trascinamento
  };
}