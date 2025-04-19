// lib/utils/calendar.ts
export function getEventColor(status: string, darker = false): string {
    switch (status) {
      case "confirmed":
        return darker ? "#FF5500" : "#FF6B00";
      case "pending":
        return darker ? "#d35400" : "#e67e22";
      case "completed":
        return darker ? "#1e8449" : "#27ae60";
      case "cancelled":
        return darker ? "#c0392b" : "#e74c3c";
      default:
        return darker ? "#58595b" : "#71717a";
    }
  }