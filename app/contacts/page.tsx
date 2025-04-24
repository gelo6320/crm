// app/contacts/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Filter, Search, RefreshCw, ChevronDown, Phone, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils/date";
import { Lead, Booking } from "@/types";
import { fetchForms } from "@/lib/api/forms";
import { fetchFacebookLeads } from "@/lib/api/facebook-leads";
import { fetchBookings } from "@/lib/api/bookings";
import { toast } from "@/components/ui/toaster";

// Definizione dell'interfaccia per i contatti unificati
interface Contact {
  _id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  sourceType: "form" | "facebook" | "booking";
  status: string;
  createdAt: string;
  updatedAt?: string;
  message?: string;
  service?: string;
  value?: number;
}

// Tipo di filtro attivo
type FilterType = "source" | "status";

// Interfaccia per i dettagli di un contatto
interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
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
            <h2 className="text-2xl font-bold">{contact.name}</h2>
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
                <p>{contact.source}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-1">Data creazione</h4>
                <p>{formatDate(contact.createdAt)}</p>
              </div>
              
              {contact.service && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-1">Servizio</h4>
                  <p>{contact.service}</p>
                </div>
              )}
              
              {contact.value !== undefined && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-1">Valore</h4>
                  <p className="text-primary font-medium">€{contact.value.toLocaleString('it-IT')}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Messaggi o note */}
          {contact.message && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-400 mb-1">Messaggio</h4>
              <p className="p-3 bg-zinc-900 rounded text-sm">{contact.message}</p>
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
  
  // Carica i contatti all'avvio e quando cambiano i filtri
  useEffect(() => {
    loadContacts();
  }, [currentPage, selectedStatus, sourceFilter]);
  
  // Funzione per caricare i contatti da tutte le fonti
  const loadContacts = async () => {
    try {
      setIsLoading(true);
      
      // Chiamate parallele alle API esistenti
      const [formsResponse, facebookResponse, bookingsResponse] = await Promise.all([
        // Carica i form solo se non c'è un filtro su un'altra fonte o il filtro è form
        sourceFilter === "" || sourceFilter === "form" 
          ? fetchForms(1, selectedStatus, searchQuery) // Usa sempre pagina 1 per garantire consistenza
          : Promise.resolve({ data: [], pagination: { total: 0, pages: 0 } }),
          
        // Carica i lead Facebook solo se non c'è un filtro su un'altra fonte o il filtro è facebook
        sourceFilter === "" || sourceFilter === "facebook" 
          ? fetchFacebookLeads(1, selectedStatus, searchQuery) // Usa sempre pagina 1 per garantire consistenza
          : Promise.resolve({ data: [], pagination: { total: 0, pages: 0 } }),
          
        // Carica le prenotazioni solo se non c'è un filtro su un'altra fonte o il filtro è booking
        sourceFilter === "" || sourceFilter === "booking" 
          ? fetchBookings(1, selectedStatus, searchQuery) // Usa sempre pagina 1 per garantire consistenza
          : Promise.resolve({ data: [], pagination: { total: 0, pages: 0 } })
      ]);
      
      // Trasforma i dati per includere il tipo di fonte
      const formContacts: Contact[] = formsResponse.data.map(form => ({
        ...form,
        sourceType: "form",
        source: form.source || "Form di contatto"
      }));
      
      const facebookContacts: Contact[] = facebookResponse.data.map(lead => ({
        ...lead,
        sourceType: "facebook",
        source: "Facebook Lead"
      }));
      
      const bookingContacts: Contact[] = bookingsResponse.data.map(booking => ({
        ...booking,
        sourceType: "booking",
        source: "Prenotazione"
      }));
      
      // Combina tutti i contatti
      let allContacts: Contact[] = [
        ...formContacts,
        ...facebookContacts,
        ...bookingContacts
      ];
      
      // Ordina i contatti per data di creazione (più recenti prima)
      allContacts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Calcola la paginazione
      const limit = 10;
      const totalItems = allContacts.length;
      const calculatedTotalPages = Math.ceil(totalItems / limit);
      
      // Assicurati che la pagina corrente sia valida
      const validCurrentPage = Math.min(currentPage, calculatedTotalPages || 1);
      
      // Calcola gli indici per la paginazione
      const startIndex = (validCurrentPage - 1) * limit;
      const endIndex = startIndex + limit;
      
      // Ottieni i contatti per la pagina corrente
      const paginatedContacts = allContacts.slice(startIndex, endIndex);
      
      setContacts(paginatedContacts);
      setTotalPages(calculatedTotalPages || 1);
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
  
  // Gestisce il cambio di filtro per source
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
    switch (sourceType) {
      case 'form':
        return (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 2H3a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-1 18H4V4h16v16zM7 15h10v2H7zm0-4h10v2H7zm0-4h10v2H7z"/>
            </svg>
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500/10 text-blue-500">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
            </svg>
          </span>
        );
      case 'booking':
        return (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-info/10 text-info">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </span>
        );
      default:
        return null;
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-lg font-medium flex items-center">
          <Users className="mr-2" size={20} />
          Tutti i Contatti
        </h1>
        
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
                    <td className="px-4 py-3 font-medium">
                      {contact.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-primary">{contact.email}</span>
                        <span className="text-zinc-400">{contact.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {getSourceIcon(contact.sourceType)}
                        <span className="ml-2">{contact.source}</span>
                      </div>
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