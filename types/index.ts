// types/index.ts
export interface Stat {
    total: number;
    converted?: number;
    conversionRate: number;
    success?: number;
    successRate?: number;
  }
  
  export interface Event {
    _id: string;
    eventName: string;
    createdAt: string;
    leadType: string;
    success: boolean;
    error?: string;
    userData?: Record<string, any>;
    customData?: Record<string, any>;
    eventId?: string; // Aggiungi questa proprietà
  }
  
  export interface Lead {
    _id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    source?: string;
    createdAt: string;
    fbclid?: string;
    formId?: string;
    value?: number;
    service?: string;
    crmEvents?: Event[];
  }
  
  export interface Booking extends Lead {
    bookingDate: string;
    bookingTime: string;
    bookingTimestamp: string;
  }
  
  export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    status: string;
    clientId?: string;
    description?: string;
    location?: string; // Aggiungi questa proprietà
  }
  
  export interface FunnelItem extends Lead {
    type: 'form' | 'booking' | 'facebook';
  }
  
  export interface FunnelData {
    new: FunnelItem[];
    contacted: FunnelItem[];
    qualified: FunnelItem[];
    opportunity: FunnelItem[];
    proposal: FunnelItem[];
    customer: FunnelItem[];
    lost: FunnelItem[];
  }
  
  export interface FunnelStats {
    totalLeads: number;
    conversionRate: number;
    potentialValue: number;
    realizedValue: number;
    lostValue: number;
    serviceDistribution: Record<string, number>;
  }