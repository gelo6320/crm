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
    start: Date | string; // Data di inizio
    end: Date | string;   // Data di fine
    status: "pending" | "confirmed" | "completed" | "cancelled";
    eventType?: "appointment" | "reminder"; // Nuovo tipo per distinguere appuntamenti da promemoria
    location?: string;  // Luogo dell'appuntamento
    clientId?: string;  // ID cliente associato (opzionale)
    description?: string; // Descrizione o note
    color?: string;     // Colore personalizzato (opzionale)
  }
  
  export interface CalendarUser {
    id: string;
    name: string;
    email: string;
    role?: string;
  }
  
  export interface FunnelItem extends Lead {
    type: 'form' | 'booking' | 'facebook';
    leadId: string;
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

  export interface SiteMetrics {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    firstContentfulPaint?: number;
    speedIndex?: number;
    largestContentfulPaint?: number;
    timeToInteractive?: number;
    totalBlockingTime?: number;
    cumulativeLayoutShift?: number;
  }
  
  export interface Site {
    _id: string;
    url: string;
    domain: string;
    screenshotUrl: string;
    metrics: SiteMetrics;
    lastScan: string;
    createdAt: string;
    updatedAt: string;
  }

  // types/index.ts (aggiornamento per i progetti)
// Aggiungi questo alla fine del file

export interface ProjectDocument {
  _id?: string;
  name: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
}

export interface ProjectImage {
  _id?: string;
  name: string;
  imageUrl: string;
  caption: string;
  uploadDate: string;
}

export interface ProjectTask {
  _id?: string;
  name: string;
  description: string;
  status: 'da iniziare' | 'in corso' | 'completato';
  dueDate: string;
}

export interface ProjectNote {
  _id?: string;
  text: string;
  createdAt: string;
  createdBy: string;
}

export interface ProjectContactPerson {
  name: string;
  phone: string;
  email: string;
}

export interface Project {
  _id: string;
  name: string;
  client: string;
  address: string;
  description: string;
  startDate: string;
  estimatedEndDate: string;
  status: 'pianificazione' | 'in corso' | 'in pausa' | 'completato' | 'cancellato';
  budget: number;
  progress: number;
  documents: ProjectDocument[];
  images: ProjectImage[];
  notes: ProjectNote[];
  tasks: ProjectTask[];
  contactPerson: ProjectContactPerson;
  createdAt: string;
  updatedAt: string;
}