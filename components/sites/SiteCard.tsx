// components/sites/SiteCard.tsx
import { useState } from "react";
import { ExternalLink, BarChart, RefreshCw, Trash2, Globe } from "lucide-react";
import { Site } from "@/types";
import { refreshSiteMetrics, deleteSite } from "@/lib/api/sites";
import { toast } from "@/components/ui/toaster";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

interface SiteCardProps {
  site: Site;
  onRefresh: () => void;
}

export default function SiteCard({ site, onRefresh }: SiteCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshSiteMetrics(site._id);
      toast("success", "Metriche aggiornate", "I dati del sito sono stati aggiornati");
      onRefresh();
    } catch (error) {
      console.error("Error refreshing site metrics:", error);
      toast("error", "Errore", "Impossibile aggiornare le metriche");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      await deleteSite(site._id);
      toast("success", "Sito eliminato", `${site.domain} è stato rimosso`);
      onRefresh();
    } catch (error) {
      console.error("Error deleting site:", error);
      toast("error", "Errore", "Impossibile eliminare il sito");
    }
  };
  
  const formatScore = (score: number) => {
    return Math.round(score * 100);
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-500";
    if (score >= 0.5) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.9) return "bg-green-500/10 border-green-500/20";
    if (score >= 0.5) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Oggi";
    if (diffDays <= 7) return `${diffDays} giorni fa`;
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };
  
  return (
    <>
      {/* Mobile Layout */}
      <div className="sm:hidden bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 relative">
        {/* Header con dominio e azioni */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">{site.domain}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{site.url}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors relative z-20"
                title="Aggiorna metriche"
              >
                <RefreshCw size={16} className={`text-zinc-600 dark:text-zinc-400 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              
              <a 
                href={site.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors relative z-20"
                title="Visita il sito"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={16} className="text-primary" />
              </a>
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
              <div className="flex items-center justify-center h-full bg-zinc-900 text-zinc-500">
                <div className="text-center">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span className="text-sm">Anteprima non disponibile</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Link per visitare il sito sovrapposto */}
          <a 
            href={site.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 bg-primary hover:bg-primary-hover p-2 rounded-full text-white shadow-lg transition-all hover:scale-105 z-20"
            title="Visita il sito"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Metriche */}
        <div className="p-4 relative z-10">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3 rounded-xl border ${getScoreBgColor(site.metrics.performance)}`}>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(site.metrics.performance)}`}>
                  {formatScore(site.metrics.performance)}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Performance</div>
              </div>
            </div>
            
            <div className={`p-3 rounded-xl border ${getScoreBgColor(site.metrics.accessibility)}`}>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(site.metrics.accessibility)}`}>
                  {formatScore(site.metrics.accessibility)}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Accessibilità</div>
              </div>
            </div>
            
            <div className={`p-3 rounded-xl border ${getScoreBgColor(site.metrics.bestPractices)}`}>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(site.metrics.bestPractices)}`}>
                  {formatScore(site.metrics.bestPractices)}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Best Practices</div>
              </div>
            </div>
            
            <div className={`p-3 rounded-xl border ${getScoreBgColor(site.metrics.seo)}`}>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(site.metrics.seo)}`}>
                  {formatScore(site.metrics.seo)}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">SEO</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-700">
            <span className="text-xs text-zinc-500">
              Scansione: {formatDate(site.lastScan)}
            </span>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors relative z-20"
            >
              Elimina
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 group relative">
        <div className="flex">
          {/* Anteprima del sito */}
          <div className="w-80 bg-black relative">
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
            
            {/* Link overlay permanente in basso a destra */}
            <a 
              href={site.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 bg-primary hover:bg-primary-hover p-2.5 rounded-full text-white shadow-lg transition-all hover:scale-105 z-20"
              title="Visita il sito"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={18} />
            </a>
            
            {/* Overlay hover aggiuntivo per l'area centrale */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl text-white/80 text-sm font-medium">
                Clicca per visitare
              </div>
            </div>
          </div>
          
          {/* Contenuto principale */}
          <div className="flex-1 p-6 relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                  {site.domain}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{site.url}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors relative z-20"
                  title="Aggiorna metriche"
                >
                  <RefreshCw size={18} className={`text-zinc-600 dark:text-zinc-400 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
                
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors relative z-20"
                  title="Elimina sito"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {/* Metriche Performance */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-2xl border ${getScoreBgColor(site.metrics.performance)} text-center`}>
                <div className={`text-3xl font-bold ${getScoreColor(site.metrics.performance)} mb-1`}>
                  {formatScore(site.metrics.performance)}
                </div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Performance
                </div>
              </div>
              
              <div className={`p-4 rounded-2xl border ${getScoreBgColor(site.metrics.accessibility)} text-center`}>
                <div className={`text-3xl font-bold ${getScoreColor(site.metrics.accessibility)} mb-1`}>
                  {formatScore(site.metrics.accessibility)}
                </div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Accessibilità
                </div>
              </div>
              
              <div className={`p-4 rounded-2xl border ${getScoreBgColor(site.metrics.bestPractices)} text-center`}>
                <div className={`text-3xl font-bold ${getScoreColor(site.metrics.bestPractices)} mb-1`}>
                  {formatScore(site.metrics.bestPractices)}
                </div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Best Practices
                </div>
              </div>
              
              <div className={`p-4 rounded-2xl border ${getScoreBgColor(site.metrics.seo)} text-center`}>
                <div className={`text-3xl font-bold ${getScoreColor(site.metrics.seo)} mb-1`}>
                  {formatScore(site.metrics.seo)}
                </div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  SEO
                </div>
              </div>
            </div>

            {/* Punteggio generale e ultimo aggiornamento */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-700">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Punteggio medio:</span>
                  <span className={`ml-2 text-lg font-bold ${getScoreColor((site.metrics.performance + site.metrics.accessibility + site.metrics.bestPractices + site.metrics.seo) / 4)}`}>
                    {formatScore((site.metrics.performance + site.metrics.accessibility + site.metrics.bestPractices + site.metrics.seo) / 4)}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Ultima scansione</div>
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {formatDate(site.lastScan)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal per la conferma di eliminazione */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
          <DeleteConfirmModal
            title="Elimina sito"
            message={`Sei sicuro di voler eliminare il sito ${site.domain}? Questa azione non può essere annullata.`}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        </div>
      )}
    </>
  );
}