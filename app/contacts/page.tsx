// app/contacts/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Filter, Search, RefreshCw, ChevronDown, Phone, MessageCircle, Globe } from "lucide-react";

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
  formType: string; // Nuovo campo per il tipo di form ("form", "facebook", "booking", etc.)
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

// Tipo di filtro attivo
type FilterType = "source" | "status";

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
      // Formatta il numero rimuovendo eventuali spazi o caratteri speciali
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

  // Estrai il messaggio dalla struttura estesa o dal campo di primo livello
  const message = contact.extendedData?.formData?.message || contact.message || "";
  
  // Estrai il servizio dalla struttura estesa o dal campo di primo livello
  const service = contact.service || contact.extendedData?.formData?.service || "";
  
  // Estrai il valore dalla struttura estesa o dal campo di primo livello
  const value = contact.value !== undefined ? contact.value : (contact.extendedData?.value || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {/* Overlay per chiudere la modale cliccando fuori */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Contenuto della modale */}
      <div className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-lg mx-4 z-10 animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-900">
          <h3 className="text-lg font-medium">Dettagli contatto</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="p-5">
          {/* Intestazione con nome e stato */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center">
              {contact.source === "facebook" ? (
                <span className="inline-flex mr-2 text-blue-500" style={{ width: "24px", height: "24px" }}>
                  <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 287.56 191">
                    <path fill="#0081fb" d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z"/>
                    <path fill="#0064e1" d="M24.49,37.3C38.73,15.35,59.28,0,82.85,0c13.65,0,27.22,4,41.39,15.61,15.5,12.65,32,33.48,52.63,67.81l7.39,12.32c17.84,29.72,28,45,33.93,52.22,7.64,9.26,13,12,19.94,12,17.63,0,22-16.2,22-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191c-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71L146.08,93.6c-12.94-21.62-24.81-37.74-31.68-45C107,40.71,97.51,31.23,82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78Z"/>
                    <path fill="#0082fb" d="M82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78C38.61,71.62,31.06,99.34,31.06,126c0,11,2.41,19.41,5.56,24.51L10.14,167.91C3.34,156.6,0,141.76,0,124.85,0,94.1,8.44,62.05,24.49,37.3,38.73,15.35,59.28,0,82.85,0Z"/>
                  </svg>
                </span>
              ) : (
                <span className="inline-flex mr-2 text-gray-500" style={{ width: "24px", height: "24px" }}>
                  <svg fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 490">
                    <path d="M245,0C109.69,0,0,109.69,0,245s109.69,245,245,245s245-109.69,245-245S380.31,0,245,0z M31.401,260.313h52.542
                    c1.169,25.423,5.011,48.683,10.978,69.572H48.232C38.883,308.299,33.148,284.858,31.401,260.313z M320.58,229.688
                    c-1.152-24.613-4.07-47.927-8.02-69.572h50.192c6.681,20.544,11.267,43.71,12.65,69.572H320.58z M206.38,329.885
                    c-4.322-23.863-6.443-47.156-6.836-69.572h90.913c-0.392,22.416-2.514,45.709-6.837,69.572H206.38z M276.948,360.51
                    c-7.18,27.563-17.573,55.66-31.951,83.818c-14.376-28.158-24.767-56.255-31.946-83.818H276.948z M199.961,229.688
                    c1.213-24.754,4.343-48.08,8.499-69.572h73.08c4.157,21.492,7.286,44.818,8.5,69.572H199.961z M215.342,129.492
                    c9.57-37.359,21.394-66.835,29.656-84.983c8.263,18.148,20.088,47.624,29.66,84.983H215.342z M306.07,129.492
                    c-9.77-40.487-22.315-73.01-31.627-94.03c11.573,8.235,50.022,38.673,76.25,94.03H306.07z M215.553,35.46
                    c-9.312,21.02-21.855,53.544-31.624,94.032h-44.628C165.532,74.13,203.984,43.692,215.553,35.46z M177.44,160.117
                    c-3.95,21.645-6.867,44.959-8.019,69.572h-54.828c1.383-25.861,5.968-49.028,12.65-69.572H177.44z M83.976,229.688H31.401
                    c1.747-24.545,7.481-47.984,16.83-69.572h46.902C89.122,181.002,85.204,204.246,83.976,229.688z M114.577,260.313h54.424
                    c0.348,22.454,2.237,45.716,6.241,69.572h-47.983C120.521,309.288,115.92,286.115,114.577,260.313z M181.584,360.51
                    c7.512,31.183,18.67,63.054,34.744,95.053c-10.847-7.766-50.278-38.782-77.013-95.053H181.584z M273.635,455.632
                    c16.094-32.022,27.262-63.916,34.781-95.122h42.575C324.336,417.068,284.736,447.827,273.635,455.632z M314.759,329.885
                    c4.005-23.856,5.894-47.118,6.241-69.572h54.434c-1.317,25.849-5.844,49.016-12.483,69.572H314.759z M406.051,260.313h52.548
                    c-1.748,24.545-7.482,47.985-16.831,69.572h-46.694C401.041,308.996,404.882,285.736,406.051,260.313z M406.019,229.688
                    c-1.228-25.443-5.146-48.686-11.157-69.572h46.908c9.35,21.587,15.083,45.026,16.83,69.572H406.019z M425.309,129.492h-41.242
                    c-13.689-32.974-31.535-59.058-48.329-78.436C372.475,68.316,403.518,95.596,425.309,129.492z M154.252,51.06
                    c-16.792,19.378-34.636,45.461-48.324,78.432H64.691C86.48,95.598,117.52,68.321,154.252,51.06z M64.692,360.51h40.987
                    c13.482,32.637,31.076,58.634,47.752,78.034C117.059,421.262,86.318,394.148,64.692,360.51z M336.576,438.54
                    c16.672-19.398,34.263-45.395,47.742-78.03h40.99C403.684,394.146,372.945,421.258,336.576,438.54z"/>
                  </svg>
                </span>
              )}
              <h2 className="text-2xl font-bold">{contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}</h2>
            </div>
            <StatusBadge status={contact.status} />
          </div>
          
          {/* Sezione info contatto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-1">Email</h4>
                <p className="text-primary">{contact.email}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-1">Telefono</h4>
                <p>{contact.phone || "Non disponibile"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-1">Fonte</h4>
                <p>{formatSource(contact.source, contact.formType)}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-1">Data creazione</h4>
                <p>{formatDate(contact.createdAt)}</p>
              </div>
              
              {service && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-1">Servizio</h4>
                  <p>{service}</p>
                </div>
              )}
              
              {value !== undefined && value > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-1">Valore</h4>
                  <p className="text-primary font-medium">€{value.toLocaleString('it-IT')}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Messaggi o note */}
          {message && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-400 mb-1">Messaggio</h4>
              <p className="p-3 bg-zinc-900 rounded text-sm">{message}</p>
            </div>
          )}
          
          {/* Pulsanti azione */}
          <div className="flex gap-3">
            <button onClick={handleCall} className="flex-1 btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
              <Phone size={18} />
              <span>Chiama</span>
            </button>
            
            <button onClick={handleWhatsApp} className="flex-1 btn bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2">
              <MessageCircle size={18} />
              <span>WhatsApp</span>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<FilterType | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const router = useRouter();
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
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
  
  // Toggle del dropdown
  const toggleFilterDropdown = (e: React.MouseEvent, type: FilterType) => {
    e.stopPropagation(); // Previeni che l'evento raggiunga il document
    setIsFilterDropdownOpen(!isFilterDropdownOpen);
    setActiveFilterType(type);
  };

  useEffect(() => {
    if (!isLoading && contacts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const contactId = params.get('id');
      
      if (contactId) {
        // Cerca il contatto confrontando sia con _id che con leadId
        const targetContact = contacts.find(contact => 
          contact._id === contactId || contact.leadId === contactId
        );
        
        if (targetContact) {
          // Apri il popup con i dettagli del contatto
          setSelectedContact(targetContact);
          
          // Rimuovi il parametro dall'URL
          if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('id');
            window.history.replaceState({}, document.title, url.toString());
          }
        } else {
          // Se il contatto non è nella pagina corrente
          toast("info", "Ricerca contatto", "Sto cercando il contatto richiesto...");
          
          // Resetta i filtri
          setSourceFilter("");
          setSelectedStatus("");
          setSearchQuery(""); // Non usare l'ID come termine di ricerca, potrebbe essere troppo specifico
          
          // Carica i dati con un flag specifico per cercare il contatto per ID
          const fetchContactById = async () => {
            try {
              // Costruisci una query specifica per ottenere il lead
              const queryParams = new URLSearchParams();
              queryParams.append('leadId', contactId); // Prova con leadId
              
              const response = await fetch(`${API_BASE_URL}/api/leads?${queryParams.toString()}`, {
                credentials: 'include'
              });
              
              const result = await response.json();
              
              if (result.success && result.data.length > 0) {
                // Se trovi il contatto, selezionalo
                const transformedContact = {
                  _id: result.data[0]._id,
                  leadId: result.data[0].leadId,
                  name: [result.data[0].firstName, result.data[0].lastName].filter(Boolean).join(" ") || result.data[0].name || "Contatto",
                  firstName: result.data[0].firstName,
                  lastName: result.data[0].lastName,
                  email: result.data[0].email || "",
                  phone: result.data[0].phone || "",
                  source: result.data[0].source || "",
                  formType: result.data[0].formType || "form",
                  status: result.data[0].status || "new",
                  createdAt: result.data[0].createdAt,
                  updatedAt: result.data[0].updatedAt,
                  message: result.data[0].message || result.data[0].extendedData?.formData?.message || "",
                  service: result.data[0].service || result.data[0].extendedData?.formData?.service || "",
                  value: result.data[0].value !== undefined ? result.data[0].value : (result.data[0].extendedData?.value || 0),
                  extendedData: result.data[0].extendedData
                };
                
                setSelectedContact(transformedContact);
              } else {
                // Se non lo trovi nemmeno con la query diretta
                toast("error", "Contatto non trovato", "Il contatto richiesto non è stato trovato.");
                loadContacts(); // Carica comunque i contatti normali
              }
            } catch (error) {
              console.error("Error loading contact by ID:", error);
              toast("error", "Errore", "Impossibile trovare il contatto specificato.");
              loadContacts();
            }
          };
          
          fetchContactById();
        }
      }
    }
  }, [contacts, isLoading]);
  
  // Carica i contatti all'avvio e quando cambiano i filtri
  useEffect(() => {
    loadContacts();
  }, [currentPage, selectedStatus, sourceFilter]);
  
  // Funzione per caricare i contatti usando la nuova API unificata
  const loadContacts = async () => {
    try {
      setIsLoading(true);
      
      // Costruisci i parametri di query
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      if (selectedStatus) queryParams.append('status', selectedStatus);
      if (searchQuery) queryParams.append('search', searchQuery);
      if (sourceFilter) queryParams.append('source', sourceFilter);
      
      // Chiamata alla nuova API unificata
      const response = await fetch(`${API_BASE_URL}/api/leads?${queryParams.toString()}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        // Trasforma i dati dal nuovo schema al formato richiesto dall'interfaccia
        const transformedContacts: Contact[] = result.data.map((lead: any) => ({
          _id: lead._id,
          leadId: lead.leadId,
          name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.name || "Contatto",
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email || "",
          phone: lead.phone || "",
          source: lead.source || "",
          formType: lead.formType || "form", // Determina il tipo di fonte
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
        // Gestisci errore
        toast("error", "Errore", "Impossibile caricare i contatti");
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setIsLoading(false);
      toast("error", "Errore", "Impossibile caricare i contatti");
    }
  };
  
  // Gestisce il refresh della pagina
  const handleRefresh = () => {
    loadContacts();
  };
  
  // Gestisce il cambio di stato del filtro
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    setIsFilterDropdownOpen(false);
  };
  
  // Gestisce il cambio di filtro per source usando formType
  const handleSourceFilter = (source: string) => {
    setSourceFilter(source);
    setCurrentPage(1);
    setIsFilterDropdownOpen(false);
  };
  
  // Gestisce la ricerca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadContacts();
  };
  
  // Gestisce il click su un contatto
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
  };
  
      // Ottiene l'icona appropriata per il tipo di fonte
  const getSourceIcon = (sourceType: string) => {
    if (sourceType === 'facebook') {
      return (
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500/10 text-blue-500">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
          </svg>
        </span>
      );
    } else if (sourceType === 'booking') {
      return (
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-info/10 text-info">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
          <Globe className="h-3.5 w-3.5" />
        </span>
      );
    }
  };
  
  // Ottiene l'etichetta del filtro attivo
  const getActiveFilterLabel = () => {
    if (sourceFilter) {
      switch(sourceFilter) {
        case "form": return "Form di contatto";
        case "facebook": return "Lead Facebook";
        case "booking": return "Prenotazioni";
        default: return "";
      }
    }
    
    if (selectedStatus) {
      switch(selectedStatus) {
        case "new": return "Nuovi";
        case "contacted": return "Contattati";
        case "qualified": return "Qualificati";
        case "opportunity": return "Opportunità";
        case "customer": return "Clienti";
        case "lost": return "Persi";
        case "pending": return "In attesa";
        case "confirmed": return "Confermati";
        case "completed": return "Completati";
        default: return "";
      }
    }
    
    return "Filtra";
  };
  
  if (isLoading && contacts.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-end flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {/* Barra di ricerca */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca..."
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 pl-9 text-sm w-full focus:ring-primary focus:border-primary"
            />
            <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          </form>
          
          {/* Componente filtro unificato */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={(e) => toggleFilterDropdown(e, 'status')}
              className={`btn ${sourceFilter || selectedStatus ? 'btn-primary' : 'btn-outline'} flex items-center gap-2 py-1.5`}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">{getActiveFilterLabel()}</span>
              <ChevronDown size={14} />
            </button>
            
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1 w-52 rounded-md shadow-lg bg-zinc-800 border border-zinc-700 z-20 animate-fade-in">
                <div className="p-1">
                  {/* Tab selector per tipo di filtro */}
                  <div className="flex border-b border-zinc-700 mb-1">
                    <button
                      onClick={() => setActiveFilterType('status')}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium ${
                        activeFilterType === 'status' 
                          ? 'border-b-2 border-primary text-primary' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Stato
                    </button>
                    <button
                      onClick={() => setActiveFilterType('source')}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium ${
                        activeFilterType === 'source' 
                          ? 'border-b-2 border-primary text-primary' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Fonte
                    </button>
                  </div>
                  
                  {/* Opzioni filtro stato */}
                  {activeFilterType === 'status' && (
                    <div className="py-1">
                      <button
                        onClick={() => handleStatusFilter("")}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded ${
                          selectedStatus === "" 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-zinc-700"
                        }`}
                      >
                        Tutti gli stati
                      </button>
                      {["new", "contacted", "qualified", "opportunity", "customer", "lost"].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusFilter(status)}
                          className={`w-full text-left px-3 py-1.5 text-sm rounded ${
                            selectedStatus === status 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-zinc-700"
                          }`}
                        >
                          <StatusBadge status={status} />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Opzioni filtro fonte */}
                  {activeFilterType === 'source' && (
                    <div className="py-1">
                      <button
                        onClick={() => handleSourceFilter("")}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded ${
                          sourceFilter === "" 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-zinc-700"
                        }`}
                      >
                        Tutte le fonti
                      </button>
                      <button
                        onClick={() => handleSourceFilter("form")}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded flex items-center ${
                          sourceFilter === "form" 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-zinc-700"
                        }`}
                      >
                        {getSourceIcon('form')}
                        <span className="ml-2">Form di contatto</span>
                      </button>
                      <button
                        onClick={() => handleSourceFilter("facebook")}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded flex items-center ${
                          sourceFilter === "facebook" 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-zinc-700"
                        }`}
                      >
                        {getSourceIcon('facebook')}
                        <span className="ml-2">Lead Facebook</span>
                      </button>
                      <button
                        onClick={() => handleSourceFilter("booking")}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded flex items-center ${
                          sourceFilter === "booking" 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-zinc-700"
                        }`}
                      >
                        {getSourceIcon('booking')}
                        <span className="ml-2">Prenotazioni</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Refresh button */}
          <button 
            onClick={handleRefresh}
            className="btn btn-outline p-1.5"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      
      {/* Elenco contatti */}
      <div className="card overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            {sourceFilter || selectedStatus || searchQuery ? (
              <>
                <p>Nessun contatto trovato con i filtri selezionati.</p>
                <button 
                  onClick={() => {
                    setSourceFilter("");
                    setSelectedStatus("");
                    setSearchQuery("");
                  }}
                  className="btn btn-outline mt-4"
                >
                  Cancella filtri
                </button>
              </>
            ) : (
              <p>Nessun contatto disponibile.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-zinc-500 bg-zinc-900/50">
                <tr>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Contatti</th>
                  <th className="px-4 py-2 text-left">Fonte</th>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {contacts.map((contact) => (
                  <tr 
                    key={contact._id} 
                    className="hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    onClick={() => handleContactClick(contact)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {contact.source === "facebook" ? (
                          <span className="inline-flex mr-2 text-blue-500" style={{ width: "16px", height: "16px" }}>
                            <svg viewBox="0 0 287.56 191" xmlns="http://www.w3.org/2000/svg">
                              <path fill="#0081fb" d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z"/>
                              <path fill="#0064e1" d="M24.49,37.3C38.73,15.35,59.28,0,82.85,0c13.65,0,27.22,4,41.39,15.61,15.5,12.65,32,33.48,52.63,67.81l7.39,12.32c17.84,29.72,28,45,33.93,52.22,7.64,9.26,13,12,19.94,12,17.63,0,22-16.2,22-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191c-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71L146.08,93.6c-12.94-21.62-24.81-37.74-31.68-45C107,40.71,97.51,31.23,82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78Z"/>
                              <path fill="#0082fb" d="M82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78C38.61,71.62,31.06,99.34,31.06,126c0,11,2.41,19.41,5.56,24.51L10.14,167.91C3.34,156.6,0,141.76,0,124.85,0,94.1,8.44,62.05,24.49,37.3,38.73,15.35,59.28,0,82.85,0Z"/>
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex mr-2 text-gray-500">
                            <Globe size={16} />
                          </span>
                        )}
                        <span className="font-medium">{contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-primary">{contact.email}</span>
                        <span className="text-zinc-400">{contact.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span>{formatSource(contact.source, contact.formType)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={contact.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Paginazione */}
        {contacts.length > 0 && (
          <div className="p-4 border-t border-zinc-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
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