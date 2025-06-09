// app/my-sites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Globe, Activity, ExternalLink } from "lucide-react";
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 relative">
      {/* Container principale con posizionamento relativo */}
      <div className="w-full relative z-0">
        {/* Header con pulsante aggiungi - Mobile ottimizzato */}
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
              className="bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors shadow-sm relative z-10"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Aggiungi sito</span>
            </button>
          </div>
        </div>

        {/* Lista siti con posizionamento corretto */}
        <div className="w-full relative z-0">
          {sites.length === 0 ? (
            <div className="px-4 sm:px-6">
              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 sm:p-12 text-center border border-zinc-200 dark:border-zinc-700 relative z-0">
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
                  className="bg-primary hover:bg-primary-hover text-white font-medium py-3 px-6 rounded-xl inline-flex items-center gap-2 transition-colors relative z-10"
                >
                  <Plus size={18} />
                  Aggiungi il tuo primo sito
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile: Lista a card */}
              <div className="sm:hidden px-4 space-y-3 relative z-0">
                {sites.map((site, index) => (
                  <div 
                    key={site._id}
                    className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer relative"
                    style={{ zIndex: sites.length - index }} // Z-index decrescente per evitare sovrapposizioni
                  >
                    {/* Header con dominio */}
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-700">
                      <div className="flex items-center space-x-3">
                        {getSiteStatusIcon(site)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                            {site.domain}
                          </h3>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                            {site.url || `https://${site.domain}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Anteprima Screenshot */}
                    <div className="relative bg-black">
                      <div className="aspect-[16/10]">
                        {site.screenshotUrl ? (
                          <img 
                            src={site.screenshotUrl} 
                            alt={`Screenshot di ${site.domain}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-zinc-500">
                            <div className="text-center">
                              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <span className="text-sm">Anteprima non disponibile</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Link per visitare il sito */}
                      <a 
                        href={site.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute bottom-3 right-3 bg-primary hover:bg-primary-hover p-2 rounded-full text-white shadow-lg transition-all hover:scale-105 z-10"
                        title="Visita il sito"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                    
                    {/* Punteggi e Footer */}
                    <div className="p-4">
                      {/* Punteggi PageSpeed */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
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
                      
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-700">
                        <span className="text-xs text-zinc-500">
                          Aggiornato: {new Date(site.lastScan).toLocaleDateString('it-IT')}
                        </span>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Griglia a card con anteprima */}
              <div className="hidden sm:block px-6 relative z-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {sites.map((site, index) => (
                    <div 
                      key={site._id}
                      className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg transition-all duration-200 group relative"
                      style={{ zIndex: sites.length - index }} // Z-index decrescente
                    >
                      <div className="flex">
                        {/* Anteprima del sito */}
                        <div className="w-64 bg-black relative flex-shrink-0">
                          <div className="aspect-[4/3] h-full">
                            {site.screenshotUrl ? (
                              <img 
                                src={site.screenshotUrl} 
                                alt={`Screenshot di ${site.domain}`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-zinc-500">
                                <div className="text-center">
                                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                  <span className="text-sm">Anteprima non disponibile</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Link overlay */}
                          <a 
                            href={site.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute bottom-3 right-3 bg-primary hover:bg-primary-hover p-2.5 rounded-full text-white shadow-lg transition-all hover:scale-105 z-10"
                            title="Visita il sito"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                        
                        {/* Contenuto principale */}
                        <div className="flex-1 p-6">
                          {/* Header */}
                          <div className="flex justify-between items-start mb-4">
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
                          </div>

                          {/* Punteggi PageSpeed */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                              <div className={`text-xl font-bold ${getScoreColor(site.metrics.performance)}`}>
                                {formatScore(site.metrics.performance)}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Performance</div>
                            </div>
                            
                            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                              <div className={`text-xl font-bold ${getScoreColor(site.metrics.accessibility)}`}>
                                {formatScore(site.metrics.accessibility)}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Accessibilità</div>
                            </div>
                            
                            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                              <div className={`text-xl font-bold ${getScoreColor(site.metrics.bestPractices)}`}>
                                {formatScore(site.metrics.bestPractices)}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Best Practices</div>
                            </div>
                            
                            <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                              <div className={`text-xl font-bold ${getScoreColor(site.metrics.seo)}`}>
                                {formatScore(site.metrics.seo)}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">SEO</div>
                            </div>
                          </div>

                          {/* Punteggio medio e footer */}
                          <div className="space-y-3">
                            <div className="text-center p-3 bg-primary/5 rounded-xl">
                              <div className="text-lg font-bold text-primary">
                                {formatScore((site.metrics.performance + site.metrics.accessibility + site.metrics.bestPractices + site.metrics.seo) / 4)}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">Punteggio medio</div>
                            </div>

                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-700">
                              <div className="flex items-center justify-between text-xs text-zinc-500">
                                <span>Ultima scansione</span>
                                <span>{new Date(site.lastScan).toLocaleDateString('it-IT')}</span>
                              </div>
                            </div>
                          </div>
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
      
      {/* Modale aggiungi sito con z-index massimo */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999]">
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