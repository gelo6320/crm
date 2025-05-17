// components/tracciamento/SessionsList.tsx
import { useState } from "react";
import { Clock, ArrowLeft, Monitor, MapPin, ChevronRight, Calendar, Timer, MousePointer, Eye } from "lucide-react";
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
      return `${durationInSeconds} sec`;
    } else {
      return `${formatTime(durationInSeconds)} min`;
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-900/50">
        <h2 className="text-base font-medium">Sessioni dell'Utente</h2>
        <button
          onClick={onBack}
          className="btn btn-outline flex items-center space-x-1 py-1 px-2 text-xs"
        >
          <ArrowLeft size={14} />
          <span>Indietro</span>
        </button>
      </div>
      
      {/* Riepilogo utente */}
      <div className="p-4 border-b border-zinc-700 bg-zinc-800/30">
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
      <div className="p-3 border-b border-zinc-700 bg-zinc-900/30 flex items-center">
        <span className="text-xs text-zinc-400 mr-2">Ordina per:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setSortBy("recent")}
            className={`text-xs px-2 py-1 rounded ${
              sortBy === "recent" ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Più recenti
          </button>
          <button
            onClick={() => setSortBy("duration")}
            className={`text-xs px-2 py-1 rounded ${
              sortBy === "duration" ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Durata
          </button>
          <button
            onClick={() => setSortBy("interactions")}
            className={`text-xs px-2 py-1 rounded ${
              sortBy === "interactions" ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Interazioni
          </button>
          <button
            onClick={() => setSortBy("pages")}
            className={`text-xs px-2 py-1 rounded ${
              sortBy === "pages" ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Pagine viste
          </button>
        </div>
      </div>
      
      {isLoading ? (
         <div className="p-8 text-center text-zinc-500">
           <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
           <p>Caricamento sessioni in corso...</p>
         </div>
       ) : sessions.length === 0 ? (
         <div className="p-8 text-center text-zinc-500">
           <p>Nessuna sessione disponibile per questo utente.</p>
           <p className="mt-2 text-sm">
             Identificativo utente: <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded">{user.id}</span>
           </p>
           <button 
             onClick={onBack} 
             className="mt-4 btn btn-outline text-xs px-4 py-2"
           >
             Torna alla lista utenti
           </button>
         </div>
       ) : (
        <div className="overflow-y-auto max-h-[600px]">
          {sortedSessions.map(session => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="flex border-b border-zinc-700 hover:bg-zinc-800/70 transition-colors cursor-pointer p-4"
            >
              <div className="w-16 h-16 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0 mr-4">
                <Calendar size={24} className="text-primary" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">
                    Sessione del {new Date(session.startTime).toLocaleDateString('it-IT')}
                  </h3>
                  <div className="text-xs">
                    <span className={`px-2 py-1 rounded ${
                      session.isConverted ? 'bg-success/20 text-success' : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {session.isConverted ? 'Convertito' : 'Non convertito'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="flex items-center text-sm">
                    <Clock size={14} className="text-info mr-2" />
                    <span>{formatDateTime(session.startTime)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Timer size={14} className="text-warning mr-2" />
                    <span>{formatDuration(session.duration)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <MousePointer size={14} className="text-success mr-2" />
                    <span>{session.interactionsCount} interazioni</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Eye size={14} className="text-primary mr-2" />
                    <span>{session.pagesViewed} pagine viste</span>
                  </div>
                </div>
                
                {session.exitUrl && (
                  <div className="mt-3 text-sm text-zinc-400">
                    <span className="mr-1">Uscita:</span>
                    <span className="truncate inline-block max-w-md align-bottom">{session.exitUrl}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center ml-4">
                <ChevronRight size={20} className="text-zinc-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}