// components/sites/SiteCard.tsx
import { useState } from "react";
import { ExternalLink, BarChart, RefreshCw, Trash2 } from "lucide-react";
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
    if (score >= 0.9) return "text-success";
    if (score >= 0.5) return "text-warning";
    return "text-danger";
  };
  
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Anteprima del sito */}
        <div className="w-full md:w-2/5 lg:w-1/3 bg-black relative">
          <div className="aspect-w-16 aspect-h-9 md:h-full">
            {site.screenshotUrl ? (
              <img 
                src={site.screenshotUrl} 
                alt={site.domain} 
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-zinc-900 text-zinc-500">
                <span>Anteprima non disponibile</span>
              </div>
            )}
          </div>
          
          <a 
            href={site.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 bg-primary hover:bg-primary-hover p-1.5 rounded-full text-white shadow-lg transition-all"
            title="Visita il sito"
          >
            <ExternalLink size={16} />
          </a>
        </div>
        
        {/* Informazioni e punteggi */}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-lg font-medium">{site.domain}</h2>
              <p className="text-sm text-zinc-400">{site.url}</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn btn-outline p-1.5"
                title="Aggiorna metriche"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              </button>
              
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-outline border-danger text-danger hover:bg-danger/10 p-1.5"
                title="Elimina sito"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Performance Score */}
            <div className="card bg-zinc-900/50 p-3">
              <div className="text-center mb-1">
                <span className={`text-2xl font-bold ${getScoreColor(site.metrics.performance)}`}>
                  {formatScore(site.metrics.performance)}
                </span>
              </div>
              <div className="text-xs text-center text-zinc-400">Performance</div>
            </div>
            
            {/* Accessibility Score */}
            <div className="card bg-zinc-900/50 p-3">
              <div className="text-center mb-1">
                <span className={`text-2xl font-bold ${getScoreColor(site.metrics.accessibility)}`}>
                  {formatScore(site.metrics.accessibility)}
                </span>
              </div>
              <div className="text-xs text-center text-zinc-400">Accessibilità</div>
            </div>
            
            {/* Best Practices Score */}
            <div className="card bg-zinc-900/50 p-3">
              <div className="text-center mb-1">
                <span className={`text-2xl font-bold ${getScoreColor(site.metrics.bestPractices)}`}>
                  {formatScore(site.metrics.bestPractices)}
                </span>
              </div>
              <div className="text-xs text-center text-zinc-400">Best Practices</div>
            </div>
            
            {/* SEO Score */}
            <div className="card bg-zinc-900/50 p-3">
              <div className="text-center mb-1">
                <span className={`text-2xl font-bold ${getScoreColor(site.metrics.seo)}`}>
                  {formatScore(site.metrics.seo)}
                </span>
              </div>
              <div className="text-xs text-center text-zinc-400">SEO</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm">
            <div className="flex justify-between text-zinc-400">
              <div>Ultima scansione:</div>
              <div>{new Date(site.lastScan).toLocaleString('it-IT')}</div>
            </div>
          </div>
        </div>
      </div>
      
      {showDeleteModal && (
        <DeleteConfirmModal
          title="Elimina sito"
          message={`Sei sicuro di voler eliminare il sito ${site.domain}? Questa azione non può essere annullata.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}