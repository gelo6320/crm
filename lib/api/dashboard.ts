// lib/api/dashboard.ts
import { Stat, Event } from "@/types";

// Mock data for demo purposes
export async function fetchDashboardStats(): Promise<{
  forms: Stat;
  bookings: Stat;
  events: Stat;
}> {
  // In a real application, this would fetch from your API
  return {
    forms: {
      total: 152,
      converted: 34,
      conversionRate: 22,
    },
    bookings: {
      total: 87,
      converted: 42,
      conversionRate: 48,
    },
    events: {
      total: 235,
      success: 218,
      successRate: 93,
    },
  };
}

export async function fetchRecentEvents(): Promise<Event[]> {
  // In a real application, this would fetch from your API
  return [
    {
      _id: "1",
      eventName: "QualifiedLead",
      createdAt: "2025-03-15T14:52:31.000Z",
      leadType: "form",
      success: true,
    },
    {
      _id: "2",
      eventName: "Meeting",
      createdAt: "2025-03-14T10:23:15.000Z",
      leadType: "booking",
      success: true,
    },
    {
      _id: "3",
      eventName: "Purchase",
      createdAt: "2025-03-12T16:41:09.000Z",
      leadType: "form",
      success: false,
      error: "Invalid pixel ID",
    },
    {
      _id: "4",
      eventName: "Opportunity",
      createdAt: "2025-03-10T09:12:55.000Z",
      leadType: "form",
      success: true,
    },
    {
      _id: "5",
      eventName: "ProposalSent",
      createdAt: "2025-03-08T11:34:22.000Z",
      leadType: "booking",
      success: true,
    },
  ];
}