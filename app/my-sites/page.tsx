// app/my-sites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Globe } from "lucide-react";
import { fetchUserSites } from "@/lib/api/sites"; 
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { Site } from "@/types";
import SiteCard from "@/components/sites/SiteCard";
import AddSiteModal from "@/components/sites/AddSiteModal";

export default function MySitesPage() { 
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTriggerRect, setModalTriggerRect] = useState<DOMRect | null>(null);
  
  useEffect(() => {
    loadSites();
  }, []);
  
  const loadSites = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUserSites();
      setSites(data);
    } catch (error) {
      console.error("Error loading sites:", error);
      toast("error", "Errore", "Impossibile caricare i siti");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddSite = (newSite: Site) => {
    setSites([...sites, newSite]);
    setShowAddModal(false);
    setModalTriggerRect(null);
    toast("success", "Sito aggiunto", `${newSite.domain} è stato aggiunto con successo`);
  };

  // Gestisce il click del pulsante aggiungi con coordinate per l'animazione
  const handleAddButtonClick = (event: React.MouseEvent) => {
    const targetElement = event.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    
    setModalTriggerRect(rect);
    setShowAddModal(true);
  };
  
  if (isLoading && sites.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Container principale */}
      <div className="w-full">
        {/* Header con pulsante aggiungi */}
        <div className="px-4 py-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                I tuoi siti
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {sites.length} {sites.length === 1 ? 'sito configurato' : 'siti configurati'}
              </p>
            </div>
            
            <button
              onClick={handleAddButtonClick}
              className="bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors shadow-sm relative z-20"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Aggiungi sito</span>
            </button>
          </div>
        </div>

        {/* Lista siti */}
        <div className="w-full">
          {sites.length === 0 ? (
            <div className="px-4 sm:px-6">
              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 sm:p-12 text-center border border-zinc-200 dark:border-zinc-700">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Nessun sito configurato
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
                  Inizia aggiungendo il tuo primo sito per monitorare le performance e gestire i contenuti.
                </p>
                <button
                  onClick={handleAddButtonClick}
                  className="bg-primary hover:bg-primary-hover text-white font-medium py-3 px-6 rounded-xl inline-flex items-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  Aggiungi il tuo primo sito
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 sm:px-6">
              <div className="hidden sm:grid sm:grid-cols-1 xl:grid-cols-2 gap-6">
                {sites.map((site, index) => (
                  <div 
                    key={site._id}
                    style={{ zIndex: Math.max(1, 100 - index) }}
                    className="relative"
                  >
                    <SiteCard 
                      site={site} 
                      onRefresh={loadSites}
                    />
                  </div>
                ))}
              </div>
              
              <div className="sm:hidden space-y-3">
                {sites.map((site, index) => (
                  <div 
                    key={site._id}
                    style={{ zIndex: Math.max(1, 100 - index) }}
                    className="relative"
                  >
                    <SiteCard 
                      site={site} 
                      onRefresh={loadSites}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modale aggiungi sito */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
          <AddSiteModal 
            onClose={() => {
              setShowAddModal(false);
              setModalTriggerRect(null);
            }}
            onSave={handleAddSite}
            triggerRect={modalTriggerRect}
          />
        </div>
      )}
    </div>
  );
}