// app/contacts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Users, Phone, MessageCircle, Globe } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils/date";
import { toast } from "@/components/ui/toaster";

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

// Componente modale per i dettagli di un contatto
function ContactDetailModal({ contact, onClose }: ContactDetailModalProps) {
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
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const message = contact.extendedData?.formData?.message || contact.message || "";
  const service = contact.service || contact.extendedData?.formData?.service || "";
  const value = contact.value !== undefined ? contact.value : (contact.extendedData?.value || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg mx-6 z-10 animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Dettagli contatto</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
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
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                </h2>
                <p className="text-sm text-zinc-500">{formatSource(contact.source, contact.formType)}</p>
              </div>
            </div>
            <StatusBadge status={contact.status} />
          </div>
          
          {/* Info contatto */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500">Email</p>
              <p className="text-blue-600 dark:text-blue-400">{contact.email}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500">Telefono</p>
              <p className="text-zinc-900 dark:text-white">{contact.phone || "Non disponibile"}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500">Data creazione</p>
              <p className="text-zinc-900 dark:text-white">{formatDate(contact.createdAt)}</p>
            </div>
            
            {service && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-500">Servizio</p>
                <p className="text-zinc-900 dark:text-white">{service}</p>
              </div>
            )}
            
            {value !== undefined && value > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-500">Valore</p>
                <p className="text-lg font-semibold text-green-600">€{value.toLocaleString('it-IT')}</p>
              </div>
            )}
          </div>
          
          {/* Messaggio */}
          {message && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-500">Messaggio</p>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300">
                {message}
              </div>
            </div>
          )}
          
          {/* Pulsanti azione */}
          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleCall} 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Chiama
            </button>
            
            <button 
              onClick={handleWhatsApp} 
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
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
  const [sourceFilter, setSourceFilter] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [highlightedContactId, setHighlightedContactId] = useState<string | null>(null);
  const router = useRouter();

  // Carica i contatti all'avvio e quando cambiano i filtri
  useEffect(() => {
    loadContacts();
  }, [currentPage, selectedStatus, sourceFilter]);

  useEffect(() => {
    if (!isLoading && contacts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const contactId = params.get('id');
      
      if (contactId) {
        const targetContact = contacts.find(contact => 
          contact._id === contactId || contact.leadId === contactId
        );
        
        if (targetContact) {
          setSelectedContact(targetContact);
          
          if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('id');
            window.history.replaceState({}, document.title, url.toString());
          }
        }
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
      if (sourceFilter) queryParams.append('source', sourceFilter);
      
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
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
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

  const sourceFilters = [
    { key: "", label: "Tutte" },
    { key: "facebook", label: "Facebook" },
    { key: "direct", label: "Diretto" },
    { key: "google", label: "Google" },
    { key: "other", label: "Altro" }
  ];
  
  if (isLoading && contacts.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Contatti</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Gestisci i tuoi lead e contatti</p>
        </div>

        {/* Filtri semplificati */}
        <div className="mb-8 space-y-6">
          {/* Filtri stato */}
          <div>
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Stato</h3>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => {
                    setSelectedStatus(filter.key);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtri fonte */}
          <div>
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Fonte</h3>
            <div className="flex flex-wrap gap-2">
              {sourceFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => {
                    setSourceFilter(filter.key);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    sourceFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Lista contatti */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {contacts.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              {sourceFilter || selectedStatus ? (
                <div className="space-y-4">
                  <p>Nessun contatto trovato con i filtri selezionati.</p>
                  <button 
                    onClick={() => {
                      setSourceFilter("");
                      setSelectedStatus("");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancella filtri
                  </button>
                </div>
              ) : (
                <p>Nessun contatto disponibile.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {contacts.map((contact) => (
                <div 
                  key={contact._id} 
                  className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                  onClick={() => handleContactClick(contact)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getSourceIcon(contact)}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">
                          {contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                        </h3>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-blue-600 dark:text-blue-400">{contact.email}</p>
                          <p className="text-sm text-zinc-500">{contact.phone}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-zinc-500">{formatSource(contact.source, contact.formType)}</p>
                        <p className="text-sm text-zinc-400">{formatDate(contact.createdAt)}</p>
                      </div>
                      <StatusBadge status={contact.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Paginazione */}
          {contacts.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700">
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