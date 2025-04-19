// lib/api/bookings.ts
import { Booking } from "@/types";

// Mock data for demo purposes
export async function fetchBookings(
  page = 1,
  status = "",
  search = ""
): Promise<{
  data: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  // In a real application, this would fetch from your API
  
  // Generate some mock data
  const mockBookings: Booking[] = Array.from({ length: 20 }, (_, i) => {
    const bookingDate = new Date(2025, 0, 1 + i);
    const hours = 9 + (i % 8);
    const minutes = (i % 2) * 30;
    
    return {
      _id: `booking-${i + 1}`,
      name: `Cliente ${i + 1}`,
      email: `cliente${i + 1}@example.com`,
      phone: `+39 3${i.toString().padStart(2, '0')}0 1234567`,
      status: (i % 8 === 0) ? "pending" : 
            (i % 8 === 1) ? "confirmed" : 
            (i % 8 === 2) ? "completed" : 
            (i % 8 === 3) ? "cancelled" : 
            (i % 8 === 4) ? "qualified" : 
            (i % 8 === 5) ? "opportunity" : 
            (i % 8 === 6) ? "customer" : "lost",
      source: "Website",
      createdAt: new Date(2025, 0, 1 + i).toISOString(),
      bookingDate: bookingDate.toLocaleDateString('it-IT'),
      bookingTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      bookingTimestamp: bookingDate.toISOString(),
      crmEvents: [],
    };
  });
  
  // Filter by status if provided
  let filteredBookings = mockBookings;
  if (status) {
    filteredBookings = mockBookings.filter(booking => booking.status === status);
  }
  
  // Filter by search query if provided
  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredBookings = filteredBookings.filter(booking => 
      booking.name.toLowerCase().includes(lowerSearch) ||
      booking.email.toLowerCase().includes(lowerSearch) ||
      booking.phone.toLowerCase().includes(lowerSearch)
    );
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredBookings.length / 10);
  const paginatedBookings = filteredBookings.slice((page - 1) * 10, page * 10);
  
  return {
    data: paginatedBookings,
    pagination: {
      total: filteredBookings.length,
      page,
      limit: 10,
      pages: totalPages,
    },
  };
}