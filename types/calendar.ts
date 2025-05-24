// types/calendar.ts
export interface CalendarEvent {
  id: string;
  _id?: string;
  title: string;
  start: Date;
  end: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  eventType: 'appointment' | 'reminder';
  location?: string;
  description?: string;
  duration?: number;
}
  
  // Utils per definire i colori in base allo stato dell'evento
  export const getEventColor = (status: string, eventType: string = 'appointment'): string => {
    if (eventType === 'reminder') {
      return '#9333ea'; // Purple for reminders
    }
    
    switch (status) {
      case 'pending':
        return '#f59e0b'; // Amber
      case 'confirmed':
        return '#3b82f6'; // Blue
      case 'completed': 
        return '#10b981'; // Green
      case 'cancelled':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };