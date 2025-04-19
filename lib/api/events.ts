// lib/api/events.ts
import { Event } from "@/types";

// Mock data for demo purposes
export async function fetchEvents(
  page = 1,
  success = "",
  search = ""
): Promise<{
  data: Event[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  // In a real application, this would fetch from your API
  
  // Generate some mock data
  const mockEvents: Event[] = Array.from({ length: 50 }, (_, i) => ({
    _id: `event-${i + 1}`,
    eventName: ["QualifiedLead", "Meeting", "Opportunity", "ProposalSent", "Purchase", "Lost"][i % 6],
    createdAt: new Date(2025, 0, 1 + i).toISOString(),
    leadType: i % 2 === 0 ? "form" : "booking",
    success: i % 10 !== 9, // 90% success rate
    error: i % 10 === 9 ? "API connection timeout" : undefined,
    eventId: i % 10 !== 9 ? `event_id_${Date.now() + i}` : undefined,
    userData: {
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `+39 3${i.toString().padStart(2, '0')}0 1234567`,
    },
    customData: {
      value: i * 100,
      service: ["Ristrutturazione", "Impianti", "Tetto", "Pavimenti"][i % 4],
      source: i % 3 === 0 ? "Website" : "Facebook",
    },
  }));
  
  // Filter by success if provided
  let filteredEvents = mockEvents;
  if (success === "true") {
    filteredEvents = mockEvents.filter(event => event.success);
  } else if (success === "false") {
    filteredEvents = mockEvents.filter(event => !event.success);
  }
  
  // Filter by search query if provided
  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredEvents = filteredEvents.filter(event => 
      event.eventName.toLowerCase().includes(lowerSearch) ||
      event.leadType.toLowerCase().includes(lowerSearch)
    );
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredEvents.length / 10);
  const paginatedEvents = filteredEvents.slice((page - 1) * 10, page * 10);
  
  return {
    data: paginatedEvents,
    pagination: {
      total: filteredEvents.length,
      page,
      limit: 10,
      pages: totalPages,
    },
  };
}