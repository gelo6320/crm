// app/contacts/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Phone, MessageCircle, Globe, ChevronDown } from "lucide-react";
// AGGIORNATO: Nuovo import per Motion
import { animate, motion, AnimatePresence } from "motion/react";
import { SmoothCorners } from 'react-smooth-corners';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils/date";
import { toast } from "@/components/ui/toaster";

// METODO 1: Usando la moderna API scrollIntoView (RACCOMANDATO)
function smoothScrollToElement(element: HTMLElement, duration: number = 800) {
  console.log('Starting smooth scroll with scrollIntoView API');
  
  // Usa la moderna API scrollIntoView che è supportata da tutti i browser moderni
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center', // Centra l'elemento nel viewport
    inline: 'nearest'
  });
  
  console.log('Scroll completed using native scrollIntoView');
}

// METODO 2: Usando Motion con controllo personalizzato (se preferisci Motion)
function motionSmoothScrollToElement(element: HTMLElement, duration: number = 800) {
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.scrollY;
  const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
  
  console.log('Motion scroll animation started:', {
    elementRect,
    absoluteElementTop,
    middle,
    currentScroll: window.scrollY
  });
  
  // SISTEMATO: Usa il nuovo animate da motion/react con parametri corretti
  animate(window.scrollY, middle, {
    duration: duration / 1000, // Motion usa secondi, non millisecondi
    ease: "easeInOut", // Easing semplificato e più affidabile
    onUpdate: (value) => {
      window.scrollTo(0, value);
    },
    onComplete: () => {
      console.log('Motion scroll animation completed, final position:', window.scrollY);
    }
  });
}

// METODO 3: Implementazione personalizzata con requestAnimationFrame (controllo totale)
function customSmoothScrollToElement(element: HTMLElement, duration: number = 800) {
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.scrollY;
  const targetPosition = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  const startTime = performance.now();

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  function animation(currentTime: number) {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const ease = easeInOutCubic(progress);
    const currentPosition = startPosition + (distance * ease);
    
    window.scrollTo(0, currentPosition);
    
    if (progress < 1) {
      requestAnimationFrame(animation);
    } else {
      console.log('Custom scroll animation completed');
    }
  }
  
  console.log('Custom scroll animation started');
  requestAnimationFrame(animation);
}

// Definizione dell'interfaccia per i contatti unificati basata sul nuovo schema
interface Contact {
  _id: string;
  leadId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  source: string;
  formType: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  message?: string;
  service?: string;
  value?: number;
  extendedData?: {
    formData?: {
      message?: string;
      service?: string;
    },
    value?: number;
  };
}

// Interfaccia per i dettagli di un contatto
interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
}

// Funzione per ottenere la fonte in formato leggibile
function formatSource(source: string, formType: string): string {
  if (source === "facebook") return "Facebook";
  if (formType === "booking") return "Prenotazione";
  if (source) return source;
  if (formType === "form" || formType === "contact") return "Form di contatto";
  return "Sconosciuto";
}

// Componente modale aggiornato con frosted glass e superellipse
// Componente modale con FIX per il bug Webkit/Chrome
function ContactDetailModal({ contact, onClose }: ContactDetailModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(true);

  // Gestisci l'animazione di apertura
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpening(false);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleCall = () => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
    } else {
      toast("error", "Numero non disponibile", "Questo contatto non ha un numero di telefono.");
    }
  };

  const handleWhatsApp = () => {
    if (contact.phone) {
      const formattedPhone = contact.phone.replace(/\s+/g, '').replace(/[()-]/g, '');
      window.open(`https://wa.me/${formattedPhone.startsWith('+') ? formattedPhone.substring(1) : formattedPhone}`, '_blank');
    } else {
      toast("error", "Numero non disponibile", "Questo contatto non ha un numero di telefono.");
    }
  };

  // Chiudi la modale quando si preme ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const message = contact.extendedData?.formData?.message || contact.message || "";
  const service = contact.service || contact.extendedData?.formData?.service || "";
  const value = contact.value !== undefined ? contact.value : (contact.extendedData?.value || 0);

  return (
    // ✅ FIX WEBKIT BUG: Applica transizione e backdrop-blur allo STESSO elemento
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl transition-all duration-300 ${
        isClosing || isOpening ? 'opacity-0 backdrop-blur-none' : 'opacity-100 backdrop-blur-xl'
      }`}
      onClick={handleClose}
    >
      {/* Modal content */}
      <div 
        className={`relative z-10 w-full max-w-lg mx-6 transition-all duration-300 ${
          isClosing || isOpening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()} // Previeni chiusura quando si clicca sul contenuto
      >
        {/* SmoothCorners per i superellipse */}
        <SmoothCorners 
          corners="2.5"
          borderRadius="24"
        />
        
        {/* Modal frosted glass background */}
        <div className="relative bg-zinc-50/60 dark:bg-zinc-100/5 backdrop-blur-xl rounded-[24px] border border-white/30 dark:border-white/20 shadow-lg overflow-hidden">
          {/* Content */}
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/30 dark:border-white/20">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dettagli contatto</h3>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-white/30 dark:hover:bg-white/20 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header con nome e stato */}
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  {contact.source === "facebook" ? (
                    <div className="w-10 h-10 rounded-full bg-blue-100/90 dark:bg-blue-900/40 flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 287.56 191">
                        <path fill="#0081fb" d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z"/>
                        <path fill="#0064e1" d="M24.49,37.3C38.73,15.35,59.28,0,82.85,0c13.65,0,27.22,4,41.39,15.61,15.5,12.65,32,33.48,52.63,67.81l7.39,12.32c17.84,29.72,28,45,33.93,52.22,7.64,9.26,13,12,19.94,12,17.63,0,22-16.2,22-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191c-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71L146.08,93.6c-12.94-21.62-24.81-37.74-31.68-45C107,40.71,97.51,31.23,82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78Z"/>
                        <path fill="#0082fb" d="M82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78C38.61,71.62,31.06,99.34,31.06,126c0,11,2.41,19.41,5.56,24.51L10.14,167.91C3.34,156.6,0,141.76,0,124.85,0,94.1,8.44,62.05,24.49,37.3,38.73,15.35,59.28,0,82.85,0Z"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100/90 dark:bg-gray-800/90 flex items-center justify-center backdrop-blur-sm">
                      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatSource(contact.source, contact.formType)}</p>
                  </div>
                </div>
                <StatusBadge status={contact.status} />
              </div>
              
              {/* Info contatto */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-primary">{contact.email}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Telefono</p>
                  <p className="text-gray-900 dark:text-white">{contact.phone || "Non disponibile"}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data creazione</p>
                  <p className="text-gray-900 dark:text-white">{formatDate(contact.createdAt)}</p>
                </div>
                
                {service && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Servizio</p>
                    <p className="text-gray-900 dark:text-white">{service}</p>
                  </div>
                )}
                
                {value !== undefined && value > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valore</p>
                    <p className="text-lg font-semibold text-green-600">€{value.toLocaleString('it-IT')}</p>
                  </div>
                )}
              </div>
              
              {/* Messaggio */}
              {message && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messaggio</p>
                  <div className="p-4 bg-white/40 dark:bg-black/30 backdrop-blur-sm rounded-2xl text-sm text-gray-700 dark:text-gray-300 border border-white/30 dark:border-white/20">
                    {message}
                  </div>
                </div>
              )}
              
              {/* Pulsanti azione con frosted glass */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCall}
                  className="flex-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/40 dark:bg-white/20 hover:bg-white/60 dark:hover:bg-white/30 backdrop-blur-sm border border-white/40 dark:border-white/30 font-medium py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <Phone className="w-4 h-4" />
                  Chiama
                </button>
                
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/40 dark:bg-white/20 hover:bg-white/60 dark:hover:bg-white/30 backdrop-blur-sm border border-white/40 dark:border-white/30 font-medium py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [highlightedContactId, setHighlightedContactId] = useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Gestisci il click fuori dal dropdown per chiuderlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Carica i contatti all'avvio e quando cambiano i filtri
  useEffect(() => {
    loadContacts();
  }, [currentPage, selectedStatus]);

  // FUNZIONE SISTEMATA per gestire l'highlight e scroll del contatto
  const highlightAndScrollToContact = (contactId: string) => {
    console.log('highlightAndScrollToContact called with ID:', contactId);
    
    // Cerca il contatto nella lista corrente
    const targetContact = contacts.find(contact => 
      contact._id === contactId || contact.leadId === contactId
    );
    
    console.log('Target contact found:', targetContact);
    
    if (targetContact) {
      // Se il contatto è nella lista, evidenzialo
      setHighlightedContactId(contactId);
      
      // Schedule scroll con timing ottimizzato
      setTimeout(() => {
        let element = document.getElementById(`contact-${contactId}`);
        
        // Se non troviamo l'elemento con l'ID diretto, prova a cercarlo con leadId
        if (!element && targetContact.leadId) {
          element = document.getElementById(`contact-${targetContact.leadId}`);
        }
        
        // Se ancora non lo troviamo, prova a cercare per data-lead-id
        if (!element) {
          element = document.querySelector(`[data-lead-id="${contactId}"]`) as HTMLElement;
        }
        
        console.log('Element found for scroll:', element);
        if (element) {
          // SCELTA IL METODO PREFERITO:
          
          // Opzione 1: API nativa moderna (RACCOMANDATO - più semplice e performante)
          smoothScrollToElement(element, 1000);
          
          // Opzione 2: Motion per controllo avanzato (se preferisci Motion)
          // motionSmoothScrollToElement(element, 1000);
          
          // Opzione 3: Controllo totale personalizzato (se hai bisogni specifici)
          // customSmoothScrollToElement(element, 1000);
          
        } else {
          console.warn('Element not found for scroll animation');
        }
        
        // Remove the highlight after 1200ms e apri la modale
        setTimeout(() => {
          setHighlightedContactId(null);
          setSelectedContact(targetContact);
        }, 1200);
      }, 100); // Timing ridotto per migliori performance
    } else {
      console.log('Contact not found in current list');
    }
    
    // Clean up URL parameters after a delay
    setTimeout(() => {
      if (window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('id');
        url.searchParams.delete('t');
        window.history.replaceState({}, document.title, url.toString());
      }
    }, 500);
  };

  // Listener per l'evento custom dalla search bar
  useEffect(() => {
    const handleSearchResultSelected = (event: CustomEvent) => {
      console.log('Search result selected event received:', event.detail);
      const { id } = event.detail;
      if (id) {
        highlightAndScrollToContact(id);
      }
    };

    console.log('Adding search result listener');
    window.addEventListener('searchResultSelected', handleSearchResultSelected as EventListener);
    
    return () => {
      console.log('Removing search result listener');
      window.removeEventListener('searchResultSelected', handleSearchResultSelected as EventListener);
    };
  }, [contacts]);

  // Listener per i cambiamenti dell'URL (popstate)
  useEffect(() => {
    const handlePopState = () => {
      console.log('Pop state event received');
      const params = new URLSearchParams(window.location.search);
      const contactId = params.get('id');
      
      console.log('Contact ID from URL:', contactId);
      if (contactId && contacts.length > 0) {
        highlightAndScrollToContact(contactId);
      }
    };

    console.log('Adding popstate listener');
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      console.log('Removing popstate listener');
      window.removeEventListener('popstate', handlePopState);
    };
  }, [contacts]);

  // Gestisci l'highlight del contatto dalla URL
  useEffect(() => {
    if (!isLoading && contacts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const contactId = params.get('id');
      
      if (contactId) {
        highlightAndScrollToContact(contactId);
      }
    }
  }, [contacts, isLoading]);
  
  // Funzione per caricare i contatti
  const loadContacts = async () => {
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      if (selectedStatus) queryParams.append('status', selectedStatus);
      
      const response = await fetch(`${API_BASE_URL}/api/leads?${queryParams.toString()}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        const transformedContacts: Contact[] = result.data.map((lead: any) => ({
          _id: lead._id,
          leadId: lead.leadId,
          name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.name || "Contatto",
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email || "",
          phone: lead.phone || "",
          source: lead.source || "",
          formType: lead.formType || "form",
          status: lead.status || "new",
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          message: lead.message || lead.extendedData?.formData?.message || "",
          service: lead.service || lead.extendedData?.formData?.service || "",
          value: lead.value !== undefined ? lead.value : (lead.extendedData?.value || 0),
          extendedData: lead.extendedData
        }));
        
        setContacts(transformedContacts);
        setTotalPages(Math.ceil(result.pagination.total / result.pagination.limit) || 1);
      } else {
        toast("error", "Errore", "Impossibile caricare i contatti");
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setIsLoading(false);
      toast("error", "Errore", "Impossibile caricare i contatti");
    }
  };
  
  // Gestisce il click su un contatto
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
  };
  
  // Ottiene l'icona appropriata per il tipo di fonte
  const getSourceIcon = (contact: Contact) => {
    if (contact.source === 'facebook') {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 287.56 191">
            <path fill="#0081fb" d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z"/>
            <path fill="#0064e1" d="M24.49,37.3C38.73,15.35,59.28,0,82.85,0c13.65,0,27.22,4,41.39,15.61,15.5,12.65,32,33.48,52.63,67.81l7.39,12.32c17.84,29.72,28,45,33.93,52.22,7.64,9.26,13,12,19.94,12,17.63,0,22-16.2,22-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191c-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71L146.08,93.6c-12.94-21.62-24.81-37.74-31.68-45C107,40.71,97.51,31.23,82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78Z"/>
            <path fill="#0082fb" d="M82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78C38.61,71.62,31.06,99.34,31.06,126c0,11,2.41,19.41,5.56,24.51L10.14,167.91C3.34,156.6,0,141.76,0,124.85,0,94.1,8.44,62.05,24.49,37.3,38.73,15.35,59.28,0,82.85,0Z"/>
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Globe className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>
      );
    }
  };

  // Ottiene l'etichetta del filtro attivo
  const getActiveFilterLabel = () => {
    if (selectedStatus) {
      switch(selectedStatus) {
        case "new": return "Nuovi";
        case "contacted": return "Contattati";
        case "qualified": return "Qualificati";
        case "opportunity": return "Opportunità";
        case "customer": return "Clienti";
        case "lost": return "Persi";
        default: return selectedStatus;
      }
    }
    return "Tutti gli stati";
  };

  // Definizioni dei filtri
  const statusFilters = [
    { key: "", label: "Tutti" },
    { key: "new", label: "Nuovi" },
    { key: "contacted", label: "Contattati" },
    { key: "qualified", label: "Qualificati" },
    { key: "opportunity", label: "Opportunità" },
    { key: "customer", label: "Clienti" },
    { key: "lost", label: "Persi" }
  ];
  
  if (isLoading && contacts.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full">
        {/* Dropdown filtro stato mobile-first */}
        <div className="px-4 py-4 sm:px-6">
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="w-full sm:w-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-left flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <span className="text-sm font-medium text-zinc-900 dark:text-white">{getActiveFilterLabel()}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFilterDropdownOpen && (
              <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-64 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 animate-fade-in">
                <div className="p-2">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => {
                        setSelectedStatus(filter.key);
                        setCurrentPage(1);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedStatus === filter.key
                          ? 'bg-primary text-white'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista contatti - Mobile ottimizzato */}
        <div className="w-full">
          {contacts.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              {selectedStatus ? (
                <div className="space-y-4">
                  <p>Nessun contatto trovato con i filtri selezionati.</p>
                  <button 
                    onClick={() => {
                      setSelectedStatus("");
                    }}
                    className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancella filtri
                  </button>
                </div>
              ) : (
                <p>Nessun contatto disponibile.</p>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: Lista a card */}
              <div className="sm:hidden">
                <div className="space-y-2 px-1">
                  {contacts.map((contact) => (
                    <div 
                      key={contact._id} 
                      id={`contact-${contact._id}`}
                      className={`bg-white dark:bg-zinc-800 rounded-lg p-4 transition-all duration-500 cursor-pointer ${
                        (highlightedContactId === contact._id || highlightedContactId === contact.leadId) 
                          ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-300/40 shadow-md scale-[1.01]' 
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                      }`}
                      onClick={() => handleContactClick(contact)}
                    >
                      <div className="flex items-start space-x-3">
                        {getSourceIcon(contact)}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate transition-colors ${
                            (highlightedContactId === contact._id || highlightedContactId === contact.leadId) 
                              ? 'text-orange-800 dark:text-orange-200' 
                              : 'text-zinc-900 dark:text-white'
                          }`}>
                            {contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                          </h3>
                          <p className={`text-sm mt-1 transition-colors ${
                            (highlightedContactId === contact._id || highlightedContactId === contact.leadId) 
                              ? 'text-orange-600 dark:text-orange-300' 
                              : 'text-primary'
                          }`}>{contact.email}</p>
                          <p className="text-sm text-zinc-500 mt-1">{contact.phone}</p>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-zinc-400">{formatDate(contact.createdAt)}</p>
                            <StatusBadge status={contact.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Tabella vera e propria */}
              <div className="hidden sm:block overflow-x-auto mx-4 sm:mx-6">
                <div className="min-w-full bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
                  {/* Header della tabella */}
                  <div className="bg-zinc-50 dark:bg-zinc-700/50 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      <div className="col-span-3">Nome</div>
                      <div className="col-span-3">Email</div>
                      <div className="col-span-2">Telefono</div>
                      <div className="col-span-2">Fonte</div>
                      <div className="col-span-1">Data</div>
                      <div className="col-span-1">Stato</div>
                    </div>
                  </div>

                  {/* Righe della tabella */}
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {contacts.map((contact) => (
                      <div 
                        key={contact._id} 
                        id={`contact-${contact._id}`}
                        data-lead-id={contact.leadId}
                        className={`px-6 py-4 transition-all duration-500 cursor-pointer ${
                          (highlightedContactId === contact._id || highlightedContactId === contact.leadId)
                            ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-300/40 shadow-md scale-[1.002]' 
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                        }`}
                        onClick={() => handleContactClick(contact)}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Nome con icona */}
                          <div className="col-span-3 flex items-center space-x-3">
                            {getSourceIcon(contact)}
                            <div className="min-w-0 flex-1">
                              <h3 className={`font-semibold truncate transition-colors ${
                                (highlightedContactId === contact._id || highlightedContactId === contact.leadId) 
                                  ? 'text-orange-800 dark:text-orange-200' 
                                  : 'text-zinc-900 dark:text-white'
                              }`}>
                                {contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                              </h3>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="col-span-3">
                            <p className={`text-sm truncate transition-colors ${
                              (highlightedContactId === contact._id || highlightedContactId === contact.leadId) 
                                ? 'text-orange-600 dark:text-orange-300' 
                                : 'text-primary'
                            }`}>
                              {contact.email}
                            </p>
                          </div>

                          {/* Telefono */}
                          <div className="col-span-2">
                            <p className="text-sm text-zinc-900 dark:text-white truncate">
                              {contact.phone || "Non disponibile"}
                            </p>
                          </div>

                          {/* Fonte */}
                          <div className="col-span-2">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                              {formatSource(contact.source, contact.formType)}
                            </p>
                          </div>

                          {/* Data */}
                          <div className="col-span-1">
                            <p className="text-xs text-zinc-500 truncate">
                              {formatDate(contact.createdAt)}
                            </p>
                          </div>

                          {/* Stato */}
                          <div className="col-span-1 flex justify-end">
                            <StatusBadge status={contact.status} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Paginazione */}
          {contacts.length > 0 && totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Modale dettagli contatto */}
      {selectedContact && (
        <ContactDetailModal 
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
}