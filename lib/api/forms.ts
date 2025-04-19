// lib/api/forms.ts
import { Lead } from "@/types";

// Mock data for demo purposes
export async function fetchForms(
  page = 1,
  status = "",
  search = ""
): Promise<{
  data: Lead[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  // In a real application, this would fetch from your API
  
  // Generate some mock data
  const mockForms: Lead[] = Array.from({ length: 20 }, (_, i) => ({
    _id: `form-${i + 1}`,
    name: `Cliente ${i + 1}`,
    email: `cliente${i + 1}@example.com`,
    phone: `+39 3${i.toString().padStart(2, '0')}0 1234567`,
    status: (i % 6 === 0) ? "new" : 
           (i % 6 === 1) ? "contacted" : 
           (i % 6 === 2) ? "qualified" : 
           (i % 6 === 3) ? "opportunity" : 
           (i % 6 === 4) ? "customer" : "lost",
    source: (i % 3 === 0) ? "Website" : (i % 3 === 1) ? "Facebook" : "Google",
    createdAt: new Date(2025, 0, 1 + i).toISOString(),
    crmEvents: [],
  }));
  
  // Filter by status if provided
  let filteredForms = mockForms;
  if (status) {
    filteredForms = mockForms.filter(form => form.status === status);
  }
  
  // Filter by search query if provided
  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredForms = filteredForms.filter(form => 
      form.name.toLowerCase().includes(lowerSearch) ||
      form.email.toLowerCase().includes(lowerSearch) ||
      form.phone.toLowerCase().includes(lowerSearch)
    );
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredForms.length / 10);
  const paginatedForms = filteredForms.slice((page - 1) * 10, page * 10);
  
  return {
    data: paginatedForms,
    pagination: {
      total: filteredForms.length,
      page,
      limit: 10,
      pages: totalPages,
    },
  };
}
