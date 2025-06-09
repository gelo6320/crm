// app/my-sites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Globe, Activity } from "lucide-react";
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

  // Ottiene l'icona di stato per il sito
  const getSiteStatusIcon = (site: Site) => {
    // Controlliamo se il sito ha metriche recenti (ultimo aggiornamento nelle ultime 24h)
    const lastScan = new Date(site.lastScan);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastScan.getTime()) / (1000 * 60 * 60);
    const isActive = hoursDiff < 24;
    
    if (isActive) {
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-green-600" />
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <Globe className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>
      );
    }
  };

  // Formatta il punteggio PageSpeed (da 0-1 a 0-100)
  const formatScore = (score: number) => {
    return Math.round(score * 100);
  };

  // Ottiene il colore del punteggio basato sui range di PageSpeed
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-500";
    if (score >= 0.5) return "text-yellow-500";
    return "text-red-500";
  };
  
  if (isLoading && sites.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full">
        {/* Header con pulsante aggiungi - Mobile ottimizzato */}
        <div className="px-4 py-4 sm:px-6">
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
              className="bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
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
            <>
              {/* Mobile: Lista a card */}
              <div className="sm:hidden px-4 space-y-3">
                {sites.map((site) => (
                  <div 
                    key={site._id}
                    className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      {getSiteStatusIcon(site)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                          {site.domain}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                          {site.url || `https://${site.domain}`}
                        </p>
                        
                        {/* Punteggi PageSpeed */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(site.metrics.performance)}`}>
                              {formatScore(site.metrics.performance)}
                            </div>
                            <div className="text-xs text-zinc-400">Performance</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(site.metrics.seo)}`}>
                              {formatScore(site.metrics.seo)}
                            </div>
                            <div className="text-xs text-zinc-400">SEO</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-zinc-400">
                            Aggiornato: {new Date(site.lastScan).toLocaleDateString('it-IT')}
                          </span>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Griglia a card */}
              <div className="hidden sm:block px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sites.map((site) => (
                    <div 
                      key={site._id}
                      className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    >
                      {/* Header della card */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getSiteStatusIcon(site)}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-zinc-900 dark:text-white truncate group-hover:text-primary transition-colors">
                              {site.domain}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                              {site.url || `https://${site.domain}`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Indicatore stato */}
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-xs text-zinc-500">Attivo</span>
                        </div>
                      </div>

                      {/* Punteggi PageSpeed */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                          <div className={`text-2xl font-bold ${getScoreColor(site.metrics.performance)}`}>
                            {formatScore(site.metrics.performance)}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Performance</div>
                        </div>
                        
                        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                          <div className={`text-2xl font-bold ${getScoreColor(site.metrics.accessibility)}`}>
                            {formatScore(site.metrics.accessibility)}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Accessibilità</div>
                        </div>
                        
                        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                          <div className={`text-2xl font-bold ${getScoreColor(site.metrics.bestPractices)}`}>
                            {formatScore(site.metrics.bestPractices)}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Best Practices</div>
                        </div>
                        
                        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                          <div className={`text-2xl font-bold ${getScoreColor(site.metrics.seo)}`}>
                            {formatScore(site.metrics.seo)}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">SEO</div>
                        </div>
                      </div>

                      {/* Punteggio medio */}
                      <div className="text-center p-3 bg-primary/5 rounded-xl mb-4">
                        <div className="text-lg font-bold text-primary">
                          {formatScore((site.metrics.performance + site.metrics.accessibility + site.metrics.bestPractices + site.metrics.seo) / 4)}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">Punteggio medio</div>
                      </div>

                      {/* Footer della card */}
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700">
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>Ultima scansione</span>
                          <span>{new Date(site.lastScan).toLocaleDateString('it-IT')}</span>
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
      
      {/* Modale aggiungi sito con stile dei contatti */}
      {showAddModal && (
        <AddSiteModal 
          onClose={() => {
            setShowAddModal(false);
            setModalTriggerRect(null);
          }}
          onSave={handleAddSite}
          triggerRect={modalTriggerRect}
        />
      )}
    </div>
  );
}