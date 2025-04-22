// app/contacts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Users, Filter, Search, RefreshCw, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils/date";
import { Lead, Booking } from "@/types";
import { fetchForms } from "@/lib/api/forms";
import { fetchFacebookLeads } from "@/lib/api/facebook-leads";
import { fetchBookings } from "@/lib/api/bookings";

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
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const router = useRouter();
  
  // Carica i contatti all'avvio e quando cambiano i filtri
  useEffect(() => {
    loadContacts();
  }, [currentPage, selectedStatus, searchQuery, sourceFilter]);
  
  // Funzione per caricare i contatti da tutte le fonti
  const loadContacts = async () => {
    try {
      setIsLoading(true);
      
      // Chiamate parallele alle API esistenti
      const [formsResponse, facebookResponse, bookingsResponse] = await Promise.all([
        // Carica i form solo se non c'è un filtro su un'altra fonte
        sourceFilter === "" || sourceFilter === "form" 
          ? fetchForms(1, selectedStatus, searchQuery)
          : Promise.resolve({ data: [], pagination: { total: 0, pages: 0 } }),
          
        // Carica i lead Facebook solo se non c'è un filtro su un'altra fonte
        sourceFilter === "" || sourceFilter === "facebook" 
          ? fetchFacebookLeads(1, selectedStatus, searchQuery)
          : Promise.resolve({ data: [], pagination: { total: 0, pages: 0 } }),
          
        // Carica le prenotazioni solo se non c'è un filtro su un'altra fonte
        sourceFilter === "" || sourceFilter === "booking" 
          ? fetchBookings(1, selectedStatus, searchQuery)
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
  };
  
  // Gestisce il cambio di filtro per source
  const handleSourceFilter = (source: string) => {
    setSourceFilter(source);
    setCurrentPage(1);
  };
  
  // Gestisce la ricerca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadContacts();
  };
  
  // Gestisce il click su un contatto
  const handleContactClick = (contact: Contact) => {
    // In base al tipo di contatto, reindirizzare alla pagina di dettaglio appropriata
    switch (contact.sourceType) {
      case 'form':
        router.push(`/forms/${contact._id}`);
        break;
      case 'facebook':
        router.push(`/facebook-leads/${contact._id}`);
        break;
      case 'booking':
        router.push(`/bookings/${contact._id}`);
        break;
      default:
        break;
    }
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
  
  // Funzione per ottenere l'etichetta del filtro fonte
  const getSourceFilterLabel = () => {
    switch(sourceFilter) {
      case "form": return "Form di contatto";
      case "facebook": return "Lead Facebook";
      case "booking": return "Prenotazioni";
      default: return "Tutte le fonti";
    }
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
        
        <div className="flex items-center space-x-2">
          {/* Filtro per fonte */}
          <div className="relative">
            <button
              onClick={() => setSourceFilter("")}
              className={`btn ${sourceFilter ? 'btn-primary' : 'btn-outline'} flex items-center space-x-1 p-1.5`}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Fonte</span>
              <ChevronDown size={14} />
            </button>
            
            <div className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-zinc-800 border border-zinc-700 z-10">
              <div className="py-1">
                <button
                  onClick={() => handleSourceFilter("")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sourceFilter === "" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Tutte le fonti
                </button>
                <button
                  onClick={() => handleSourceFilter("form")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sourceFilter === "form" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Form di Contatto
                </button>
                <button
                  onClick={() => handleSourceFilter("facebook")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sourceFilter === "facebook" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Lead Facebook
                </button>
                <button
                  onClick={() => handleSourceFilter("booking")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    sourceFilter === "booking" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Prenotazioni
                </button>
              </div>
            </div>
          </div>
          
          {/* Filtro per stato */}
          <div className="relative">
            <button
              onClick={() => setSelectedStatus("")}
              className={`btn ${selectedStatus ? 'btn-primary' : 'btn-outline'} flex items-center space-x-1 p-1.5`}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Stato</span>
              <ChevronDown size={14} />
            </button>
            
            <div className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-zinc-800 border border-zinc-700 z-10">
              <div className="py-1">
                <button
                  onClick={() => handleStatusFilter("")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === "" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Tutti gli stati
                </button>
                <button
                  onClick={() => handleStatusFilter("new")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === "new" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Nuovi
                </button>
                <button
                  onClick={() => handleStatusFilter("contacted")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === "contacted" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Contattati
                </button>
                <button
                  onClick={() => handleStatusFilter("qualified")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === "qualified" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Qualificati
                </button>
                <button
                  onClick={() => handleStatusFilter("opportunity")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === "opportunity" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Opportunità
                </button>
                <button
                  onClick={() => handleStatusFilter("customer")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === "customer" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Clienti
                </button>
                <button
                  onClick={() => handleStatusFilter("lost")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedStatus === "lost" ? "bg-primary/10 text-primary" : "hover:bg-zinc-700"
                  }`}
                >
                  Persi
                </button>
              </div>
            </div>
          </div>
          
          {/* Ricerca */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca..."
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 pl-9 text-sm w-full md:w-auto focus:ring-primary focus:border-primary"
            />
            <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          </form>
          
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
    </div>
  );
}