// components/tracciamento/SessionsList.tsx
import { useState } from "react";
import { Clock, ArrowLeft, Monitor, MapPin, ChevronRight, Timer, MousePointer, Eye } from "lucide-react";
import { TrackedUser, UserSession } from "@/types/tracciamento";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/date";
import { formatTime } from "@/lib/utils/format";

interface SessionsListProps {
  sessions: UserSession[];
  user: TrackedUser;
  onSelectSession: (session: UserSession) => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function SessionsList({
  sessions,
  user,
  onSelectSession,
  onBack,
  isLoading
}: SessionsListProps) {
  const [sortBy, setSortBy] = useState<"recent" | "duration" | "interactions" | "pages">("recent");
  
  // Funzione per formattare la durata in modo appropriato
  const formatDuration = (durationInSeconds: number): string => {
    if (durationInSeconds < 60) {
      return `${durationInSeconds}s`;
    } else {
      return `${formatTime(durationInSeconds)}m`;
    }
  };
  
  // Ordinamento delle sessioni in base al criterio selezionato
  const sortedSessions = [...sessions].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      case "duration":
        return b.duration - a.duration;
      case "interactions":
        return b.interactionsCount - a.interactionsCount;
      case "pages":
        return b.pagesViewed - a.pagesViewed;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento sessioni in corso...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
        <h2 className="text-base font-medium">Sessioni dell'Utente</h2>
        <button
          onClick={onBack}
          className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1"
          style={{ borderRadius: '8px' }}
        >
          <ArrowLeft size={14} />
          <span>Indietro</span>
        </button>
      </div>
      
      {/* Riepilogo utente */}
      <div className="p-4 bg-zinc-800/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium flex items-center">
              <Monitor size={16} className="text-primary mr-2" />
              {user.fingerprint}
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center text-zinc-400">
                <MapPin size={14} className="mr-1" />
                <span>{user.location || "Posizione sconosciuta"}</span>
              </div>
              <div className="flex items-center text-zinc-400">
                <Clock size={14} className="mr-1" />
                <span>{formatRelativeTime(user.lastActivity)}</span>
              </div>
            </div>
          </div>
          <div className="flex md:justify-end items-end">
            <div className="text-sm text-zinc-400">
              Totale sessioni: <span className="font-medium text-white">{sessions.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Opzioni di ordinamento */}
      <div className="p-3 bg-zinc-800/20 flex items-center">
        <span className="text-xs text-zinc-400 mr-2">Ordina per:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setSortBy("recent")}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              sortBy === "recent" ? "bg-primary text-white" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
            }`}
            style={{ borderRadius: '8px' }}
          >
            Più recenti
          </button>
          <button
            onClick={() => setSortBy("duration")}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              sortBy === "duration" ? "bg-primary text-white" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
            }`}
            style={{ borderRadius: '8px' }}
          >
            Durata
          </button>
          <button
            onClick={() => setSortBy("interactions")}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              sortBy === "interactions" ? "bg-primary text-white" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
            }`}
            style={{ borderRadius: '8px' }}
          >
            Interazioni
          </button>
          <button
            onClick={() => setSortBy("pages")}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              sortBy === "pages" ? "bg-primary text-white" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
            }`}
            style={{ borderRadius: '8px' }}
          >
            Pagine viste
          </button>
        </div>
      </div>
      
      {sessions.length === 0 ? (
        <div className="p-8 text-center text-zinc-500">
          <p>Nessuna sessione disponibile per questo utente.</p>
          <p className="mt-2 text-sm">
            Identificativo utente: <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded-lg">{user.id}</span>
          </p>
          <button 
            onClick={onBack} 
            className="mt-4 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-xs transition-all"
            style={{ borderRadius: '8px' }}
          >
            Torna alla lista utenti
          </button>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-zinc-500 bg-zinc-800/30 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Data/Ora</th>
                <th className="px-4 py-2 text-left">Durata</th>
                <th className="px-4 py-2 text-left">Interazioni</th>
                <th className="px-4 py-2 text-left">Pagine</th>
                <th className="px-4 py-2 text-left">Conversione</th>
                <th className="px-4 py-2 text-left">Uscita</th>
                <th className="px-4 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {sortedSessions.map(session => (
                <tr 
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className="hover:bg-zinc-700/40 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(session.startTime).toLocaleDateString('it-IT')}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(session.startTime).toLocaleTimeString('it-IT')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Timer size={14} className="text-warning mr-1" />
                      <span>{formatDuration(session.duration)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <MousePointer size={14} className="text-success mr-1" />
                      <span>{session.interactionsCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Eye size={14} className="text-primary mr-1" />
                      <span>{session.pagesViewed}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      session.isConverted ? 'bg-success/20 text-success' : 'bg-zinc-700/30 text-zinc-400'
                    }`} style={{ borderRadius: '6px' }}>
                      {session.isConverted ? 'Sì' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {session.exitUrl && (
                      <span className="text-zinc-400 truncate max-w-xs block">
                        {session.exitUrl}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight size={16} className="text-zinc-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}