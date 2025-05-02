// app/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw, Search, Calendar, Tag, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import Link from "next/link";
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api/api-utils';

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
    case 'pianificazione': return 'bg-blue-500';
    case 'in corso': return 'bg-green-500';
    case 'in pausa': return 'bg-amber-500';
    case 'completato': return 'bg-purple-500';
    case 'cancellato': return 'bg-red-500';
    default: return 'bg-gray-500';
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const router = useRouter();
  
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
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        data = data.filter((project: Project) => 
          project.name.toLowerCase().includes(query) || 
          project.client.toLowerCase().includes(query) || 
          project.address.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
        );
      }
      
      setProjects(data);
    } catch (error) {
      console.error("Errore nel caricamento dei progetti:", error);
      toast("error", "Errore", "Impossibile caricare i progetti");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funzione per gestire la ricerca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects();
  };
  
  // Naviga al dettaglio di un progetto
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };
  
  // Visualizzazione di caricamento
  if (isLoading && projects.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">    
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Ricerca */}
          <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca progetti..."
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 pl-9 text-sm w-full focus:ring-primary focus:border-primary"
            />
            <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          </form>
          
          {/* Filtro per stato */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm focus:ring-primary focus:border-primary"
          >
            <option value="">Tutti gli stati</option>
            <option value="pianificazione">Pianificazione</option>
            <option value="in corso">In corso</option>
            <option value="in pausa">In pausa</option>
            <option value="completato">Completato</option>
            <option value="cancellato">Cancellato</option>
          </select>
          
          {/* Pulsante refresh */}
          <button 
            onClick={loadProjects}
            className="btn btn-outline p-1.5"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          
          {/* Pulsante per aggiungere un progetto */}
          <Link href="/projects/new" className="btn btn-primary inline-flex items-center justify-center">
            <Plus size={18} className="mr-1" />
            <span className="hidden sm:inline">Nuovo Progetto</span>
          </Link>
        </div>
      </div>
      
      {/* Griglia dei progetti */}
      {projects.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <AlertTriangle size={40} className="text-zinc-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessun progetto trovato</h3>
            <p className="text-zinc-400 mb-6">
              {statusFilter || searchQuery ? 
                "Non ci sono progetti che corrispondono ai filtri selezionati." : 
                "Non hai ancora creato nessun progetto."}
            </p>
            <Link href="/projects/new" className="btn btn-primary inline-flex items-center justify-center">
              <Plus size={18} className="mr-1" />
              Crea il tuo primo progetto
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div 
              key={project._id} 
              className="card overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleProjectClick(project._id)}
            >
              {/* Immagine di copertina o placeholder */}
              <div className="h-40 bg-zinc-900 relative">
                {project.images && project.images.length > 0 ? (
                  <img 
                    src={project.images[0].imageUrl} 
                    alt={project.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-500">
                    <span>Nessuna immagine</span>
                  </div>
                )}
                
                {/* Badge stato */}
                <div className={`absolute top-2 right-2 ${getStatusColor(project.status)} text-white text-xs px-2 py-1 rounded`}>
                  {getStatusText(project.status)}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-base mb-1 line-clamp-1">{project.name}</h3>
                <p className="text-zinc-400 text-sm mb-2">{project.client}</p>
                
                {/* Indirizzo */}
                <p className="text-xs text-zinc-500 mb-3 line-clamp-1">{project.address}</p>
                
                {/* Budget e date */}
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                  <div className="flex items-center">
                    <Tag size={14} className="mr-1 text-primary" />
                    <span>{formatBudget(project.budget)}</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <Calendar size={14} className="mr-1 text-primary" />
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                </div>
                
                {/* Progresso */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Completamento</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Data ultimo aggiornamento */}
                <div className="mt-3 pt-3 border-t border-zinc-700 flex justify-between items-center text-xs text-zinc-500">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    <span>Aggiornato: {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}