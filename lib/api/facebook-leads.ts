// lib/api/facebook-leads.ts
import { Lead } from "@/types";

// Mock data for demo purposes
export async function fetchFacebookLeads(
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
  const mockLeads: Lead[] = Array.from({ length: 20 }, (_, i) => ({
    _id: `fb-${i + 1}`,
    name: `Lead FB ${i + 1}`,
    email: `lead${i + 1}@example.com`,
    phone: `+39 3${i.toString().padStart(2, '0')}0 1234567`,
    status: (i % 6 === 0) ? "new" : 
           (i % 6 === 1) ? "contacted" : 
           (i % 6 === 2) ? "qualified" : 
           (i % 6 === 3) ? "opportunity" : 
           (i % 6 === 4) ? "customer" : "lost",
    source: "Facebook",
    createdAt: new Date(2025, 0, 1 + i).toISOString(),
    formId: `form-${5000 + i}`,
    fbclid: `fb.1.${Date.now()}.${i}`,
    crmEvents: [],
  }));
  
  // Filter by status if provided
  let filteredLeads = mockLeads;
  if (status) {
    filteredLeads = mockLeads.filter(lead => lead.status === status);
  }
  
  // Filter by search query if provided
  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredLeads = filteredLeads.filter(lead => 
      lead.name.toLowerCase().includes(lowerSearch) ||
      lead.email.toLowerCase().includes(lowerSearch) ||
      lead.phone.toLowerCase().includes(lowerSearch)
    );
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredLeads.length / 10);
  const paginatedLeads = filteredLeads.slice((page - 1) * 10, page * 10);
  
  return {
    data: paginatedLeads,
    pagination: {
      total: filteredLeads.length,
      page,
      limit: 10,
      pages: totalPages,
    },
  };
}