// components/tracciamento/LandingPageList.tsx
import { ExternalLink, Users, Clock, LineChart } from "lucide-react";
import { LandingPage } from "@/types/tracciamento";
import { formatDateTime } from "@/lib/utils/date";
import { normalizeUrl, groupLandingPagesByNormalizedUrl } from "@/lib/utils/url-normalizer";

interface LandingPageListProps {
  landingPages: LandingPage[];
  onSelectLandingPage: (landingPage: LandingPage) => void;
  isLoading: boolean;
}

export default function LandingPageList({
  landingPages,
  onSelectLandingPage,
  isLoading
}: LandingPageListProps) {
  // Raggruppa le landing page per URL normalizzato per evitare duplicati
  const groupedLandingPages = groupLandingPagesByNormalizedUrl(landingPages);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }

  if (groupedLandingPages.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <p>Nessuna landing page disponibile nel periodo selezionato.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-3 bg-zinc-800/50">
        <h2 className="text-base font-medium">Landing Page Tracciate</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-zinc-500 bg-zinc-800/30">
            <tr>
              <th className="px-4 py-2 text-left">URL / Titolo</th>
              <th className="px-4 py-2 text-left">Totale visite</th>
              <th className="px-4 py-2 text-left">Utenti unici</th>
              <th className="px-4 py-2 text-left">Tasso conversione</th>
              <th className="px-4 py-2 text-left">Ultimo accesso</th>
              <th className="px-4 py-2 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {groupedLandingPages.map((landingPage) => (
              <tr 
                key={landingPage.id} 
                className="hover:bg-zinc-800/50 transition-colors cursor-pointer"
                onClick={() => onSelectLandingPage(landingPage)}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-primary truncate max-w-md" title={landingPage.url}>
                      {landingPage.url}
                    </span>
                    <span className="text-zinc-400 truncate max-w-md" title={landingPage.title}>
                      {landingPage.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <LineChart size={16} className="mr-2 text-primary" />
                    {landingPage.totalVisits.toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <Users size={16} className="mr-2 text-info" />
                    {landingPage.uniqueUsers.toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium inline-flex items-center ${
                    landingPage.conversionRate > 5 ? 'bg-success/20 text-success' :
                    landingPage.conversionRate > 2 ? 'bg-warning/20 text-warning' :
                    'bg-zinc-700/30 text-zinc-400'
                  }`} style={{ borderRadius: '8px' }}>
                    {landingPage.conversionRate.toFixed(2)}%
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center text-zinc-400">
                    <Clock size={16} className="mr-2" />
                    {formatDateTime(landingPage.lastAccess)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(landingPage.url, '_blank');
                    }}
                    className="p-2 rounded-lg hover:bg-zinc-700 transition-colors"
                    title="Visita la pagina"
                    style={{ borderRadius: '8px' }}
                  >
                    <ExternalLink size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}