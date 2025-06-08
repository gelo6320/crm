// app/projects/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Calendar, Tag, Clock, AlertTriangle, ChevronDown, MapPin, User } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import Link from "next/link";
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api/api-utils';
import { SmoothCorners } from 'react-smooth-corners';

// Definizione dei tipi
interface Project {
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
  images: { imageUrl: string }[];
  createdAt: string;
  updatedAt: string;
}

// Funzione helper per formattare il budget
const formatBudget = (budget: number): string => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(budget);
};

// Funzione helper per formattare la data
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/D';
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Funzione per ottenere il colore in base allo stato
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pianificazione': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
    case 'in corso': return 'bg-green-500/20 text-green-600 dark:text-green-400';
    case 'in pausa': return 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
    case 'completato': return 'bg-purple-500/20 text-purple-600 dark:text-purple-400';
    case 'cancellato': return 'bg-red-500/20 text-red-600 dark:text-red-400';
    default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
  }
};

// Funzione per ottenere il testo in base allo stato
const getStatusText = (status: string): string => {
  switch (status) {
    case 'pianificazione': return 'Pianificazione';
    case 'in corso': return 'In corso';
    case 'in pausa': return 'In pausa';
    case 'completato': return 'Completato';
    case 'cancellato': return 'Cancellato';
    default: return status;
  }
};

// Componente Badge per lo stato
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);
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

  // Carica i progetti all'avvio e quando cambiano i filtri
  useEffect(() => {
    loadProjects();
  }, [statusFilter]);
  
  // Funzione per caricare i progetti
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      
      // Chiamata all'API modificata per usare axios
      const response = await axios.get(`${API_BASE_URL}/api/projects`, { 
        withCredentials: true 
      });
      
      let data = response.data;  // Con axios, i dati sono in response.data
      
      // Applica filtri lato client
      if (statusFilter) {
        data = data.filter((project: Project) => project.status === statusFilter);
      }
      
      setProjects(data);
    } catch (error) {
      console.error("Errore nel caricamento dei progetti:", error);
      toast("error", "Errore", "Impossibile caricare i progetti");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Naviga al dettaglio di un progetto
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  // Gestisce l'highlight del progetto dalla URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    
    if (projectId && projects.length > 0) {
      // Imposta l'ID del progetto evidenziato
      setHighlightedProjectId(projectId);
      
      // Trova e scorri all'elemento
      setTimeout(() => {
        const element = document.getElementById(`project-${projectId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Rimuovi l'evidenziazione dopo 3 secondi
          setTimeout(() => {
            setHighlightedProjectId(null);
            
            // Pulisci i parametri URL
            if (window.history.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('id');
              window.history.replaceState({}, document.title, url.toString());
            }
          }, 3000);
        } else {
          setHighlightedProjectId(null);
          // Pulisci comunque l'URL
          if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('id');
            window.history.replaceState({}, document.title, url.toString());
          }
        }
      }, 300);
    }
  }, [projects]);

  // Ottiene l'etichetta del filtro attivo
  const getActiveFilterLabel = () => {
    if (statusFilter) {
      return getStatusText(statusFilter);
    }
    return "Tutti gli stati";
  };

  // Definizioni dei filtri
  const statusFilters = [
    { key: "", label: "Tutti" },
    { key: "pianificazione", label: "Pianificazione" },
    { key: "in corso", label: "In corso" },
    { key: "in pausa", label: "In pausa" },
    { key: "completato", label: "Completato" },
    { key: "cancellato", label: "Cancellato" }
  ];
  
  // Visualizzazione di caricamento
  if (isLoading && projects.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full">
        {/* Header con filtro e pulsante nuovo progetto */}
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Dropdown filtro stato */}
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
                          setStatusFilter(filter.key);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          statusFilter === filter.key
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

            {/* Pulsante nuovo progetto */}
            <Link 
              href="/projects/new" 
              className="bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <Plus size={18} className="mr-2" />
              Nuovo Progetto
            </Link>
          </div>
        </div>

        {/* Lista progetti */}
        <div className="w-full">
          {projects.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              {statusFilter ? (
                <div className="space-y-4">
                  <AlertTriangle size={40} className="text-zinc-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">Nessun progetto trovato</h3>
                  <p>Non ci sono progetti che corrispondono ai filtri selezionati.</p>
                  <button 
                    onClick={() => setStatusFilter("")}
                    className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancella filtri
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AlertTriangle size={40} className="text-zinc-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">Nessun progetto disponibile</h3>
                  <p>Non hai ancora creato nessun progetto.</p>
                  <Link 
                    href="/projects/new" 
                    className="inline-flex items-center bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <Plus size={18} className="mr-2" />
                    Crea il tuo primo progetto
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: Lista a card */}
              <div className="sm:hidden">
                <div className="space-y-2 px-1">
                  {projects.map((project) => (
                    <div 
                      key={project._id} 
                      id={`project-${project._id}`}
                      className={`bg-white dark:bg-zinc-800 rounded-lg p-4 transition-all duration-500 cursor-pointer ${
                        highlightedProjectId === project._id
                          ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-300/40 shadow-md scale-[1.01]' 
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                      }`}
                      onClick={() => handleProjectClick(project._id)}
                    >
                      {/* Immagine o placeholder */}
                      <div className="h-32 bg-zinc-100 dark:bg-zinc-700 rounded-lg mb-3 overflow-hidden">
                        {project.images && project.images.length > 0 ? (
                          <img 
                            src={project.images[0].imageUrl} 
                            alt={project.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-zinc-400">
                            <span className="text-sm">Nessuna immagine</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className={`font-semibold text-base line-clamp-1 transition-colors ${
                            highlightedProjectId === project._id
                              ? 'text-orange-800 dark:text-orange-200' 
                              : 'text-zinc-900 dark:text-white'
                          }`}>
                            {project.name}
                          </h3>
                          <StatusBadge status={project.status} />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                            <User size={14} className="mr-2 flex-shrink-0" />
                            <span className="line-clamp-1">{project.client}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                            <MapPin size={14} className="mr-2 flex-shrink-0" />
                            <span className="line-clamp-1">{project.address}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-zinc-600 dark:text-zinc-400">
                              <Tag size={14} className="mr-1 text-primary" />
                              <span>{formatBudget(project.budget)}</span>
                            </div>
                            <div className="flex items-center text-zinc-500">
                              <Calendar size={14} className="mr-1" />
                              <span>{formatDate(project.startDate)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-zinc-600 dark:text-zinc-400">Completamento</span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Griglia di card */}
              <div className="hidden sm:block px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <div 
                      key={project._id}
                      id={`project-${project._id}`}
                      className={`bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden transition-all duration-500 cursor-pointer hover:shadow-md hover:scale-[1.02] ${
                        highlightedProjectId === project._id
                          ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-300/40 shadow-md scale-[1.02]' 
                          : ''
                      }`}
                      onClick={() => handleProjectClick(project._id)}
                    >
                      <SmoothCorners 
                        corners="2"
                        borderRadius="12"
                      />
                      
                      {/* Immagine di copertina */}
                      <div className="h-48 bg-zinc-100 dark:bg-zinc-700 relative">
                        {project.images && project.images.length > 0 ? (
                          <img 
                            src={project.images[0].imageUrl} 
                            alt={project.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-zinc-400">
                            <span>Nessuna immagine</span>
                          </div>
                        )}
                        
                        {/* Badge stato */}
                        <div className="absolute top-3 right-3">
                          <StatusBadge status={project.status} />
                        </div>
                      </div>
                      
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className={`font-semibold text-lg mb-1 line-clamp-1 transition-colors ${
                            highlightedProjectId === project._id
                              ? 'text-orange-800 dark:text-orange-200' 
                              : 'text-zinc-900 dark:text-white'
                          }`}>
                            {project.name}
                          </h3>
                          <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-1">{project.client}</p>
                        </div>
                        
                        {/* Indirizzo */}
                        <div className="flex items-start text-sm text-zinc-500 dark:text-zinc-500">
                          <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{project.address}</span>
                        </div>
                        
                        {/* Budget e data */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-zinc-600 dark:text-zinc-400">
                            <Tag size={14} className="mr-1 text-primary" />
                            <span className="font-medium">{formatBudget(project.budget)}</span>
                          </div>
                          <div className="flex items-center text-zinc-500">
                            <Calendar size={14} className="mr-1" />
                            <span>{formatDate(project.startDate)}</span>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-zinc-600 dark:text-zinc-400">Completamento</span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Data ultimo aggiornamento */}
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center text-xs text-zinc-500">
                          <Clock size={12} className="mr-1" />
                          <span>Aggiornato: {formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}