// lib/api/calendar.ts
import { CalendarEvent } from "@/types";

// Mock data for demo purposes
export async function fetchAppointments(): Promise<CalendarEvent[]> {
  // In a real application, this would fetch from your API
  
  // Current date for reference
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Generate some mock data
  const mockAppointments: CalendarEvent[] = [
    {
      id: "1",
      title: "Consulenza Sig. Rossi",
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
      status: "confirmed",
      description: "Consulenza per ristrutturazione casa",
      clientId: "1",
      location: "office"
    },
    {
      id: "2",
      title: "Sopralluogo Bianchi",
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
      status: "pending",
      description: "Sopralluogo per preventivo",
      clientId: "2",
      location: "client"
    },
    {
      id: "3",
      title: "Meeting fornitori",
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 12, 30),
      status: "confirmed",
      description: "Incontro con fornitori materiali"
    },
    {
      id: "4",
      title: "Telefonata Sig.ra Verdi",
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9, 30),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 10, 0),
      status: "completed",
      description: "Follow-up dopo sopralluogo",
      clientId: "3"
    },
    {
      id: "5",
      title: "Visita cantiere",
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 17, 0),
      status: "confirmed",
      description: "Controllo avanzamento lavori",
      location: "site"
    },
    {
      id: "6",
      title: "Videochiamata team design",
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 14, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 15, 0),
      status: "pending",
      description: "Revisione progetti interni",
      location: "remote"
    },
    {
      id: "7",
      title: "Preventivo Belli",
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 16, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 17, 0),
      status: "cancelled",
      description: "Preventivo ristrutturazione bagno"
    }
  ];
  
  // Add some more appointments for the current month
  for (let i = 4; i <= 28; i += 2) {
    if (i !== today.getDate() && i !== today.getDate() + 1 && i !== today.getDate() - 1) {
      mockAppointments.push({
        id: `random-${i}`,
        title: `Appuntamento ${i}`,
        start: new Date(today.getFullYear(), today.getMonth(), i, 10 + (i % 8), 0),
        end: new Date(today.getFullYear(), today.getMonth(), i, 11 + (i % 8), 0),
        status: ["confirmed", "pending", "completed", "cancelled"][i % 4] as any,
        description: i % 3 === 0 ? `Descrizione appuntamento ${i}` : "",
      });
    }
  }
  
  return mockAppointments;
}