// app/banca-dati/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Download, Database, Users, BarChart2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SmoothCorners } from 'react-smooth-corners';
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { formatDateTime } from "@/lib/utils/date";
import axios from "axios";
import { EnhancedCapiStatus } from "@/components/banca/CapiDetailsComponent";

// Definiamo l'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Interfaccia per i dati CAPI Facebook
interface FacebookCapi {
  sent: boolean;
  timestamp?: string;
  success?: boolean;
  eventId?: string;
  payload?: any;
  response?: any;
  error?: any;
}

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
  location?: {
    city: string;
    region: string;
    country: string;
    country_code: string;
  };
  facebookCapi?: FacebookCapi;
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
  location?: {
    city: string;
    region: string;
    country: string;
    country_code: string;
  };
  consent: {
    marketing: boolean;
    analytics: boolean;
    thirdParty: boolean;
  };
  facebookCapi?: FacebookCapi;
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
  region: string;
  country_code: string;
  location?: {
    city: string;
    region: string;
    country: string;
    country_code: string;
  };
  language: string;
  source: string;
  medium: string;
  campaign: string;
  adOptimizationConsent: string;
  firstSeen: string;
  lastSeen: string;
  lastUpdated: string;
  syncedToFacebook: boolean;
  facebookCapi?: FacebookCapi;
}

// Tipo di tabella attiva
type ActiveTab = "visits" | "clients" | "audiences";

// Tooltip helper component
function Tooltip({ children, content }: { children: React.ReactNode, content: string }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="opacity-0 bg-zinc-800 text-xs text-white rounded py-1 px-2 absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none transition-opacity group-hover:opacity-100 w-48 text-center">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800"></div>
      </div>
    </div>
  );
}

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

  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');
    
    if (itemId && !isLoading) {
      // Cerca l'item in tutte le tabs
      let foundTab: ActiveTab | null = null;
      let foundItem = false;
      
      // Cerca nelle visite
      if (visits.find(v => v._id === itemId)) {
        foundTab = "visits";
        foundItem = true;
      }
      // Cerca nei clienti
      else if (clients.find(c => c._id === itemId)) {
        foundTab = "clients";
        foundItem = true;
      }
      // Cerca nelle audiences
      else if (audiences.find(a => a._id === itemId)) {
        foundTab = "audiences";
        foundItem = true;
      }
      
      if (foundTab && foundItem) {
        // Cambia tab se necessario
        if (activeTab !== foundTab) {
          setActiveTab(foundTab);
        }
        
        // Evidenzia l'elemento
        setHighlightedItemId(itemId);
        
        setTimeout(() => {
          const element = document.getElementById(`banca-item-${itemId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-orange-50', 'dark:bg-orange-900/20', 'ring-1', 'ring-orange-300/40');
            
            setTimeout(() => {
              element.classList.remove('bg-orange-50', 'dark:bg-orange-900/20', 'ring-1', 'ring-orange-300/40');
              setHighlightedItemId(null);
            }, 3000);
          }
        }, 500);
        
        // Pulisci URL
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('id');
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    }
  }, [visits, clients, audiences, activeTab, isLoading]);
  
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
  };
  
  // Funzione per esportare in CSV
  const handleExport = async (type: "clients" | "audiences") => {
    try {
      window.location.href = `${API_BASE_URL}/api/banca-dati/${type}/export`;
      toast("success", "Esportazione avviata", "Il file CSV verrà scaricato a breve");
    } catch (error) {
      console.error(`Errore nell'esportazione di ${type}:`, error);
      toast("error", "Errore", `Impossibile esportare i dati per ${type}`);
    }
  };

  // Ottieni l'etichetta del tab attivo
  const getActiveTabLabel = () => {
    switch(activeTab) {
      case "visits": return "Visite al sito";
      case "clients": return "Clienti registrati";
      case "audiences": return "Conversioni registrate";
      default: return "Seleziona categoria";
    }
  };

  // Ottieni il totale per il tab attivo
  const getActiveTabTotal = () => {
    switch(activeTab) {
      case "visits": return visitsPagination.total;
      case "clients": return clientsPagination.total;
      case "audiences": return audiencesPagination.total;
      default: return 0;
    }
  };

  // Definizioni dei tabs
  const tabs = [
    { key: "visits" as ActiveTab, label: "Visite", icon: Database },
    { key: "audiences" as ActiveTab, label: "Conversioni", icon: BarChart2 },
    { key: "clients" as ActiveTab, label: "Clienti", icon: Users }
  ];
  
  if (isLoading && visits.length === 0 && clients.length === 0 && audiences.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full">
        {/* Tab selector mobile-first */}
        <div className="py-4 sm:px-6">
          <div className="flex space-x-1 bg-white dark:bg-zinc-800 rounded-lg p-1 border border-zinc-200 dark:border-zinc-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="sm:px-6">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
            {/* Header con statistiche */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                    {getActiveTabLabel()}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {getActiveTabTotal().toLocaleString('it-IT')} record trovati
                  </p>
                </div>
                
                {activeTab !== "visits" && (
                  <button
                    onClick={() => handleExport(activeTab === "clients" ? "clients" : "audiences")}
                    className="bg-white dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium py-2 px-4 rounded-lg border border-zinc-200 dark:border-zinc-600 flex items-center gap-2 transition-colors"
                    title="Esporta per lookalike audience in Facebook Ads"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Esporta CSV</span>
                  </button>
                )}
              </div>
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
            {getActiveTabTotal() > 0 && (
              <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente tabella visite
function VisitsTable({ visits, isLoading }: { visits: Visit[], isLoading: boolean }) {
  if (isLoading && visits.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }
  
  if (visits.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500">
        Nessuna visita trovata
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-zinc-50 dark:bg-zinc-700/50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Data</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">URL</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Sessione</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Referrer</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">IP</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Località</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Durata</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">FB CAPI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {visits.map((visit) => (
            <tr key={visit._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                {formatDateTime(visit.timestamp)}
              </td>
              <td className="px-6 py-4 max-w-xs truncate text-sm text-primary">
                {visit.url || visit.path || "-"}
              </td>
              <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {visit.sessionId.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 max-w-xs truncate text-sm text-zinc-600 dark:text-zinc-400">
                {visit.referrer || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {visit.ip || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {visit.location ? `${visit.location.city || ''}, ${visit.location.region || ''}` : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {visit.timeOnPage ? `${Math.round(visit.timeOnPage)}s` : "-"}
              </td>
              <td className="px-6 py-4">
                <EnhancedCapiStatus capiData={visit.facebookCapi} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente tabella clienti
function ClientsTable({ clients, isLoading }: { clients: Client[], isLoading: boolean }) {
  if (isLoading && clients.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }
  
  if (clients.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500">
        Nessun cliente trovato
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-zinc-50 dark:bg-zinc-700/50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Nome</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Email</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Telefono</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Località</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Fonte</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Valore</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Stato</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Data</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Consenso</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">FB CAPI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {clients.map((client) => (
            <tr key={client._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
              <td className="px-6 py-4 font-medium text-sm text-zinc-900 dark:text-white">
                {client.fullName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-primary">
                {client.email}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {client.phone || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {client.location ? `${client.location.city || ''}, ${client.location.region || ''}` : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {client.leadSource || "-"}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-green-600">
                {client.value ? `€${client.value.toLocaleString('it-IT')}` : "-"}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  client.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  client.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {client.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                {formatDateTime(client.createdAt)}
              </td>
              <td className="px-6 py-4">
                <div className="flex space-x-1.5">
                  <Tooltip content="Marketing">
                    <span className={`w-2.5 h-2.5 rounded-full ${client.consent?.marketing ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  </Tooltip>
                  <Tooltip content="Analytics">
                    <span className={`w-2.5 h-2.5 rounded-full ${client.consent?.analytics ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  </Tooltip>
                  <Tooltip content="Terze parti">
                    <span className={`w-2.5 h-2.5 rounded-full ${client.consent?.thirdParty ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  </Tooltip>
                </div>
              </td>
              <td className="px-6 py-4">
                <EnhancedCapiStatus capiData={client.facebookCapi} />
                {client.facebookCapi?.eventId && !client.facebookCapi?.error && (
                  <div className="text-xs text-zinc-500 font-mono mt-1 truncate max-w-[120px]" title={client.facebookCapi.eventId}>
                    {client.facebookCapi.eventId.substring(0, 10)}...
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente tabella audience Facebook
function AudiencesTable({ audiences, isLoading }: { audiences: FacebookAudience[], isLoading: boolean }) {
  if (isLoading && audiences.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }
  
  if (audiences.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500">
        Nessuna audience trovata
      </div>
    );
  }

  // Helper function per estrarre informazioni dall'utente
  const getUserInfo = (audience: any, field: string) => {
    if (audience[field] && audience[field] !== "") return audience[field];
    
    if (audience.conversions && audience.conversions.length > 0) {
      const lastConversion = audience.conversions[audience.conversions.length - 1];
      if (lastConversion.metadata?.formData?.[field] && lastConversion.metadata.formData[field] !== "") {
        return lastConversion.metadata.formData[field];
      }
    }
    
    return null;
  };

  // Helper per ottenere il nome completo
  const getFullName = (audience: any) => {
    const firstName = getUserInfo(audience, 'firstName');
    const lastName = getUserInfo(audience, 'lastName');
    
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return null;
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-zinc-50 dark:bg-zinc-700/50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Email</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Telefono</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Nome</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Località</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Fonte</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Consenso Ads</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Prima visita</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Ultima visita</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">FB CAPI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {audiences.map((audience) => (
            <tr key={audience._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
              <td className="px-6 py-4 text-sm text-primary">
                {getUserInfo(audience, 'email') || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {getUserInfo(audience, 'phone') || "-"}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                {getFullName(audience) || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {audience.location ? 
                  `${audience.location.city || ''}, ${audience.location.region || ''}` : 
                  (audience.city ? `${audience.city || ''}, ${audience.region || ''}` : "-")}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {audience.source || "-"}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  audience.adOptimizationConsent === 'GRANTED' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : audience.adOptimizationConsent === 'DENIED'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {audience.adOptimizationConsent === 'GRANTED' 
                    ? 'Concesso' 
                    : audience.adOptimizationConsent === 'DENIED'
                      ? 'Negato'
                      : 'Non specificato'
                  }
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                {formatDateTime(audience.firstSeen)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                {formatDateTime(audience.lastSeen)}
              </td>
              <td className="px-6 py-4">
                <EnhancedCapiStatus capiData={audience.facebookCapi} />
                {audience.facebookCapi?.eventId && !audience.facebookCapi?.error && (
                  <div className="text-xs text-zinc-500 font-mono mt-1 truncate max-w-[120px]" title={audience.facebookCapi.eventId}>
                    {audience.facebookCapi.eventId.substring(0, 10)}...
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}