// app/my-sites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Globe, Activity, TrendingUp, TrendingDown } from "lucide-react";
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
    toast("success", "Sito aggiunto", `${newSite.domain} è stato aggiunto con successo`);
  };

  // Ottiene l'icona di stato per il sito
  const getSiteStatusIcon = (site: Site) => {
    // Simuliamo lo stato basandoci su dati del sito
    const isActive = true; // Questo dovrebbe venire dai dati reali del sito
    
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

  // Simula metriche per il sito (in un'app reale verrebbero dall'API)
  const getSiteMetrics = (site: Site) => {
    return {
      visitors: Math.floor(Math.random() * 1000) + 100,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      trendValue: Math.floor(Math.random() * 20) + 1
    };
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
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
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
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl inline-flex items-center gap-2 transition-colors"
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
                {sites.map((site) => {
                  const metrics = getSiteMetrics(site);
                  return (
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
                          
                          {/* Metriche mobile */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-xs text-zinc-400">Visitatori</p>
                                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                  {metrics.visitors.toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                {metrics.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-500" />
                                )}
                                <span className={`text-xs font-medium ${
                                  metrics.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {metrics.trendValue}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Griglia a card */}
              <div className="hidden sm:block px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sites.map((site) => {
                    const metrics = getSiteMetrics(site);
                    return (
                      <div 
                        key={site._id}
                        className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      >
                        {/* Header della card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getSiteStatusIcon(site)}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
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

                        {/* Metriche */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-zinc-400 uppercase tracking-wide">Visitatori oggi</p>
                              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                {metrics.visitors.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              {metrics.trend === 'up' ? (
                                <TrendingUp className="w-5 h-5 text-green-500" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-500" />
                              )}
                              <span className={`text-sm font-medium ${
                                metrics.trend === 'up' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {metrics.trendValue}%
                              </span>
                            </div>
                          </div>

                          {/* Barra di progresso simulata */}
                          <div>
                            <div className="flex justify-between text-xs text-zinc-500 mb-2">
                              <span>Performance</span>
                              <span>85%</span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Footer della card */}
                        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Ultimo aggiornamento</span>
                            <span>2 min fa</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sezione statistiche aggiuntive per desktop */}
        {sites.length > 0 && (
          <div className="hidden lg:block px-6 mt-8">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Panoramica generale
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {sites.reduce((acc, site) => acc + getSiteMetrics(site).visitors, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">Visitatori totali oggi</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{sites.length}</p>
                  <p className="text-sm text-zinc-500 mt-1">Siti attivi</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">98.5%</p>
                  <p className="text-sm text-zinc-500 mt-1">Uptime medio</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modale aggiungi sito */}
      {showAddModal && (
        <AddSiteModal 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddSite}
        />
      )}
    </div>
  );
}