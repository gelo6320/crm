// app/banca-dati/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Download, Database, Users, RefreshCw, Search, BarChart2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { formatDateTime } from "@/lib/utils/date";
import axios from "axios";

// Definiamo l'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Definizione delle interfacce per i tipi di dati
interface Visit {
  _id: string;
  sessionId: string;
  timestamp: string;
  url: string;
  path: string;
  title: string;
  referrer: string;
  ip: string;
  userAgent: string;
  deviceInfo: any;
  cookieConsent: boolean;
  utmParams: any;
  isNewVisitor: boolean;
  isEntryPoint: boolean;
  isExitPoint: boolean;
  timeOnPage: number;
  scrollDepth: number;
}

interface Client {
  _id: string;
  leadId: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fullName: string;
  value: number;
  service: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  convertedAt: string;
  leadSource: string;
  originalSource: string;
  consent: {
    marketing: boolean;
    analytics: boolean;
    thirdParty: boolean;
  };
}

interface FacebookAudience {
  _id: string;
  userId: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  fbclid: string;
  hashedEmail: string;
  hashedPhone: string;
  country: string;
  city: string;
  language: string;
  source: string;
  medium: string;
  campaign: string;
  adOptimizationConsent: string;
  firstSeen: string;
  lastSeen: string;
  lastUpdated: string;
  syncedToFacebook: boolean;
}

// Tipo di tabella attiva
type ActiveTab = "visits" | "clients" | "audiences";

export default function BancaDatiPage() {
  // Stato per il tab attivo
  const [activeTab, setActiveTab] = useState<ActiveTab>("visits");
  
  // Stati per i dati
  const [visits, setVisits] = useState<Visit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [audiences, setAudiences] = useState<FacebookAudience[]>([]);
  
  // Stati per la paginazione
  const [visitsPagination, setVisitsPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [clientsPagination, setClientsPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [audiencesPagination, setAudiencesPagination] = useState({ page: 1, total: 0, pages: 1 });
  
  // Stato per il caricamento
  const [isLoading, setIsLoading] = useState(true);
  
  // Stato per la ricerca
  const [searchQuery, setSearchQuery] = useState("");
  
  // Carica dati in base al tab attivo
  useEffect(() => {
    loadData();
  }, [activeTab, visitsPagination.page, clientsPagination.page, audiencesPagination.page]);
  
  // Funzione per caricare i dati
  const loadData = async () => {
    setIsLoading(true);
    try {
      let response;
      
      switch (activeTab) {
        case "visits":
          response = await axios.get(`${API_BASE_URL}/api/banca-dati/visits?page=${visitsPagination.page}&limit=100`, {
            withCredentials: true
          });
          if (response.data.success) {
            setVisits(response.data.data);
            setVisitsPagination({
              page: response.data.pagination.page,
              total: response.data.pagination.total,
              pages: response.data.pagination.pages
            });
          }
          break;
        
        case "clients":
          response = await axios.get(`${API_BASE_URL}/api/banca-dati/clients?page=${clientsPagination.page}&limit=100`, {
            withCredentials: true
          });
          if (response.data.success) {
            setClients(response.data.data);
            setClientsPagination({
              page: response.data.pagination.page,
              total: response.data.pagination.total,
              pages: response.data.pagination.pages
            });
          }
          break;
        
        case "audiences":
          response = await axios.get(`${API_BASE_URL}/api/banca-dati/audiences?page=${audiencesPagination.page}&limit=100`, {
            withCredentials: true
          });
          if (response.data.success) {
            setAudiences(response.data.data);
            setAudiencesPagination({
              page: response.data.pagination.page,
              total: response.data.pagination.total,
              pages: response.data.pagination.pages
            });
          }
          break;
      }
    } catch (error) {
      console.error(`Errore nel recupero dei dati per ${activeTab}:`, error);
      toast("error", "Errore", `Impossibile caricare i dati per ${activeTab}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funzione per cambiare tab
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchQuery("");
  };
  
  // Funzione per esportare in CSV
  const handleExport = async (type: "clients" | "audiences") => {
    try {
      // Usa window.location per iniziare il download del file
      window.location.href = `${API_BASE_URL}/api/banca-dati/${type}/export`;
      toast("success", "Esportazione avviata", "Il file CSV verrà scaricato a breve");
    } catch (error) {
      console.error(`Errore nell'esportazione di ${type}:`, error);
      toast("error", "Errore", `Impossibile esportare i dati per ${type}`);
    }
  };
  
  // Funzione per gestire la ricerca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };
  
  // Funzione di refresh
  const handleRefresh = () => {
    loadData();
  };
  
  if (isLoading && visits.length === 0 && clients.length === 0 && audiences.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
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
          
          <button 
            onClick={handleRefresh}
            className="btn btn-outline p-1.5"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-zinc-700">
        <button
          onClick={() => handleTabChange("visits")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "visits" 
              ? "border-primary text-primary" 
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Database size={16} className="inline-block mr-1 -mt-0.5" /> Visite
        </button>
        <button
          onClick={() => handleTabChange("audiences")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "audiences" 
              ? "border-primary text-primary" 
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <BarChart2 size={16} className="inline-block mr-1 -mt-0.5" /> Conversioni
        </button>
        <button
          onClick={() => handleTabChange("clients")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "clients" 
              ? "border-primary text-primary" 
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Users size={16} className="inline-block mr-1 -mt-0.5" /> Clienti
        </button>
      </div>
      
      {/* Contenuto del tab attivo */}
      <div className="card overflow-hidden">
        <div className="p-3 border-b border-zinc-700 bg-zinc-900/50 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-medium">
              {activeTab === "visits" && "Visite al sito"}
              {activeTab === "clients" && "Clienti registrati"}
              {activeTab === "audiences" && "Facebook Custom Audience"}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeTab === "visits" && visitsPagination.total} 
              {activeTab === "clients" && clientsPagination.total} 
              {activeTab === "audiences" && audiencesPagination.total} 
              record trovati
            </p>
          </div>
          
          {activeTab !== "visits" && (
            <button
              onClick={() => handleExport(activeTab === "clients" ? "clients" : "audiences")}
              className="btn btn-outline inline-flex items-center space-x-1 text-xs py-1.5 px-2.5"
              title="Esporta per lookalike audience in Facebook Ads"
            >
              <Download size={14} />
              <span>Esporta CSV</span>
            </button>
          )}
        </div>
        
        {/* Content basato sul tab attivo */}
        <div className="overflow-x-auto">
          {/* Visits Table */}
          {activeTab === "visits" && (
            <VisitsTable 
              visits={visits} 
              isLoading={isLoading} 
            />
          )}
          
          {/* Clients Table */}
          {activeTab === "clients" && (
            <ClientsTable 
              clients={clients} 
              isLoading={isLoading} 
            />
          )}
          
          {/* Audiences Table */}
          {activeTab === "audiences" && (
            <AudiencesTable 
              audiences={audiences} 
              isLoading={isLoading} 
            />
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-zinc-700">
          {activeTab === "visits" && (
            <Pagination
              currentPage={visitsPagination.page}
              totalPages={visitsPagination.pages}
              onPageChange={(page) => setVisitsPagination(prev => ({ ...prev, page }))}
            />
          )}
          
          {activeTab === "clients" && (
            <Pagination
              currentPage={clientsPagination.page}
              totalPages={clientsPagination.pages}
              onPageChange={(page) => setClientsPagination(prev => ({ ...prev, page }))}
            />
          )}
          
          {activeTab === "audiences" && (
            <Pagination
              currentPage={audiencesPagination.page}
              totalPages={audiencesPagination.pages}
              onPageChange={(page) => setAudiencesPagination(prev => ({ ...prev, page }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Componente tabella visite
function VisitsTable({ visits, isLoading }: { visits: Visit[], isLoading: boolean }) {
  if (isLoading && visits.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }
  
  if (visits.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Nessuna visita trovata
      </div>
    );
  }
  
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase text-zinc-500 bg-zinc-900/50">
        <tr>
          <th className="px-4 py-2 text-left">Data</th>
          <th className="px-4 py-2 text-left">URL</th>
          <th className="px-4 py-2 text-left">Sessione</th>
          <th className="px-4 py-2 text-left">Referrer</th>
          <th className="px-4 py-2 text-left">IP</th>
          <th className="px-4 py-2 text-left">Durata</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800">
        {visits.map((visit) => (
          <tr key={visit._id} className="hover:bg-zinc-800/50 transition-colors">
            <td className="px-4 py-2.5 whitespace-nowrap">
              {formatDateTime(visit.timestamp)}
            </td>
            <td className="px-4 py-2.5 max-w-xs truncate">
              {visit.url || visit.path || "-"}
            </td>
            <td className="px-4 py-2.5 font-mono text-xs">
              {visit.sessionId.substring(0, 8)}...
            </td>
            <td className="px-4 py-2.5 max-w-xs truncate">
              {visit.referrer || "-"}
            </td>
            <td className="px-4 py-2.5">
              {visit.ip || "-"}
            </td>
            <td className="px-4 py-2.5">
              {visit.timeOnPage ? `${Math.round(visit.timeOnPage)}s` : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Componente tabella clienti
function ClientsTable({ clients, isLoading }: { clients: Client[], isLoading: boolean }) {
  if (isLoading && clients.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }
  
  if (clients.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Nessun cliente trovato
      </div>
    );
  }
  
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase text-zinc-500 bg-zinc-900/50">
        <tr>
          <th className="px-4 py-2 text-left">Nome</th>
          <th className="px-4 py-2 text-left">Email</th>
          <th className="px-4 py-2 text-left">Telefono</th>
          <th className="px-4 py-2 text-left">Fonte</th>
          <th className="px-4 py-2 text-left">Valore</th>
          <th className="px-4 py-2 text-left">Stato</th>
          <th className="px-4 py-2 text-left">Data</th>
          <th className="px-4 py-2 text-left">Consenso</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800">
        {clients.map((client) => (
          <tr key={client._id} className="hover:bg-zinc-800/50 transition-colors">
            <td className="px-4 py-2.5 font-medium">
              {client.fullName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || '-'}
            </td>
            <td className="px-4 py-2.5">
              {client.email}
            </td>
            <td className="px-4 py-2.5">
              {client.phone || "-"}
            </td>
            <td className="px-4 py-2.5">
              {client.leadSource || "-"}
            </td>
            <td className="px-4 py-2.5">
              {client.value ? `€${client.value.toLocaleString('it-IT')}` : "-"}
            </td>
            <td className="px-4 py-2.5">
              <span className={`badge badge-${client.status}`}>
                {client.status}
              </span>
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap">
              {formatDateTime(client.createdAt)}
            </td>
            <td className="px-4 py-2.5">
              <div className="flex space-x-1">
                <span className={`w-2 h-2 rounded-full ${client.consent?.marketing ? 'bg-success' : 'bg-danger'}`} 
                      title={client.consent?.marketing ? 'Marketing: Sì' : 'Marketing: No'}></span>
                <span className={`w-2 h-2 rounded-full ${client.consent?.analytics ? 'bg-success' : 'bg-danger'}`}
                      title={client.consent?.analytics ? 'Analytics: Sì' : 'Analytics: No'}></span>
                <span className={`w-2 h-2 rounded-full ${client.consent?.thirdParty ? 'bg-success' : 'bg-danger'}`}
                      title={client.consent?.thirdParty ? 'Terze parti: Sì' : 'Terze parti: No'}></span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Componente tabella audience Facebook
function AudiencesTable({ audiences, isLoading }: { audiences: FacebookAudience[], isLoading: boolean }) {
  if (isLoading && audiences.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }
  
  if (audiences.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Nessuna audience trovata
      </div>
    );
  }
  
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase text-zinc-500 bg-zinc-900/50">
        <tr>
          <th className="px-4 py-2 text-left">Email</th>
          <th className="px-4 py-2 text-left">Telefono</th>
          <th className="px-4 py-2 text-left">Nome</th>
          <th className="px-4 py-2 text-left">Paese</th>
          <th className="px-4 py-2 text-left">Fonte</th>
          <th className="px-4 py-2 text-left">Consenso Ads</th>
          <th className="px-4 py-2 text-left">Prima visita</th>
          <th className="px-4 py-2 text-left">Ultima visita</th>
          <th className="px-4 py-2 text-left">Sincronizzato</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800">
        {audiences.map((audience) => (
          <tr key={audience._id} className="hover:bg-zinc-800/50 transition-colors">
            <td className="px-4 py-2.5">
              {audience.email || "-"}
            </td>
            <td className="px-4 py-2.5">
              {audience.phone || "-"}
            </td>
            <td className="px-4 py-2.5">
              {`${audience.firstName || ''} ${audience.lastName || ''}`.trim() || '-'}
            </td>
            <td className="px-4 py-2.5">
              {audience.country || "-"}
            </td>
            <td className="px-4 py-2.5">
              {audience.source || "-"}
            </td>
            <td className="px-4 py-2.5">
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${audience.adOptimizationConsent === 'GRANTED' 
                  ? 'bg-success/20 text-success' 
                  : audience.adOptimizationConsent === 'DENIED'
                    ? 'bg-danger/20 text-danger'
                    : 'bg-zinc-500/20 text-zinc-400'
                }
              `}>
                {audience.adOptimizationConsent === 'GRANTED' 
                  ? 'Concesso' 
                  : audience.adOptimizationConsent === 'DENIED'
                    ? 'Negato'
                    : 'Non specificato'
                }
              </span>
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap">
              {formatDateTime(audience.firstSeen)}
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap">
              {formatDateTime(audience.lastSeen)}
            </td>
            <td className="px-4 py-2.5">
              {audience.syncedToFacebook 
                ? <span className="text-success">✓</span> 
                : <span className="text-danger">✗</span>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}