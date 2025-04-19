// lib/utils/date.ts
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }
  
  export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
  
  export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }