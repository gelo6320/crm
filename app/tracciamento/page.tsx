// app/tracciamento/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ChartBar, Filter, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AIAnalytics from "@/components/tracciamento/AIAnalytics";
import LandingPageList from "@/components/tracciamento/LandingPageList";
import MarketingApiOverview from "@/components/tracciamento/MarketingApiOverview";
import UsersList from "@/components/tracciamento/UsersList";
import SessionsList from "@/components/tracciamento/SessionsList";
import SessionFlow from "@/components/tracciamento/SessionFlow";
import AdvancedStatistics from "@/components/tracciamento/AdvancedStatistics";
import { 
  fetchLandingPages, 
  fetchUsers, 
  fetchSessions, 
  fetchSessionDetails 
} from "@/lib/api/tracciamento";
import { 
  LandingPage, 
  TrackedUser, 
  UserSession, 
  SessionDetail 
} from "@/types/tracciamento";
import { toast } from "@/components/ui/toaster";

export default function TracciamentoPage() {
  // Stati principali
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [selectedLandingPage, setSelectedLandingPage] = useState<LandingPage | null>(null);
  const [users, setUsers] = useState<TrackedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<TrackedUser | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetail[]>([]);
  
  // Stati UI
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [timeRange, setTimeRange] = useState("7d"); // '24h', '7d', '30d', 'all'
  
  const router = useRouter();

  // Carica le landing page all'avvio
  useEffect(() => {
    loadLandingPages();
  }, [timeRange]);

  // Carica gli utenti quando viene selezionata una landing page
  useEffect(() => {
    if (selectedLandingPage) {
      loadUsers(selectedLandingPage.id);
    }
  }, [selectedLandingPage]);

  // Carica le sessioni quando viene selezionato un utente
  useEffect(() => {
    if (selectedUser) {
      loadSessions(selectedUser.id);
    }
  }, [selectedUser]);

  // Carica i dettagli quando viene selezionata una sessione
  useEffect(() => {
    if (selectedSession) {
      loadSessionDetails(selectedSession.id);
    }
  }, [selectedSession]);

  // Fetch delle landing page
  const loadLandingPages = async () => {
    try {
      setIsLoading(true);
      const data = await fetchLandingPages(timeRange);
      setLandingPages(data);
      
      // Resetta le selezioni
      setSelectedLandingPage(null);
      setSelectedUser(null);
      setSelectedSession(null);
    } catch (error) {
      console.error("Errore durante il caricamento delle landing page:", error);
      toast("error", "Errore", "Impossibile caricare le landing page");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch degli utenti di una landing page
  const loadUsers = async (landingPageId: string) => {
    try {
      setIsLoadingUsers(true);
      setUsers([]);
      const data = await fetchUsers(landingPageId, timeRange);
      setUsers(data);
      
      // Resetta le selezioni successive
      setSelectedUser(null);
      setSelectedSession(null);
    } catch (error) {
      console.error("Errore durante il caricamento degli utenti:", error);
      toast("error", "Errore", "Impossibile caricare gli utenti");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch delle sessioni di un utente
  const loadSessions = async (userId: string) => {
    try {
      setIsLoadingSessions(true);
      setSessions([]);
      console.log(`Caricamento sessioni per utente: ${userId}`);
      
      const data = await fetchSessions(userId, timeRange);
      console.log(`Sessioni ricevute: ${data.length}`);
      setSessions(data);
      
      if (data.length === 0) {
        console.log(`Nessuna sessione trovata per l'utente ${userId}.`);
      }
      
      setSelectedSession(null);
    } catch (error: unknown) {
      console.error("Errore dettagliato durante il caricamento delle sessioni:", error);
      console.error("URL richiesta:", `/api/tracciamento/sessions/${userId}?timeRange=${timeRange}`);
      
      const errorMessage = error instanceof Error ? error.message : 'Errore di rete';
      toast("error", "Errore", `Impossibile caricare le sessioni: ${errorMessage}`);
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Fetch dei dettagli di una sessione
  const loadSessionDetails = async (sessionId: string) => {
    try {
      setIsLoadingDetails(true);
      setSessionDetails([]);
      const data = await fetchSessionDetails(sessionId);
      setSessionDetails(data);
    } catch (error) {
      console.error("Errore durante il caricamento dei dettagli della sessione:", error);
      toast("error", "Errore", "Impossibile caricare i dettagli della sessione");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Gestione cambio intervallo di tempo
  const handleTimeRangeChange = (range: string) => {
    console.log(`Cambiando timeRange a: ${range}`);
    setTimeRange(range);
    
    // Il caricamento verrà gestito automaticamente dall'useEffect
  };

  // Handler per la selezione di una landing page
  const handleSelectLandingPage = (landingPage: LandingPage) => {
    setSelectedLandingPage(landingPage);
  };

  // Handler per la selezione di un utente
  const handleSelectUser = (user: TrackedUser) => {
    setSelectedUser(user);
  };

  // Handler per la selezione di una sessione
  const handleSelectSession = (session: UserSession) => {
    setSelectedSession(session);
  };

  // Handler per tornare indietro dalla visualizzazione di una sessione
  const handleBackFromSession = () => {
    setSelectedSession(null);
  };

  // Handler per tornare indietro dalla visualizzazione di un utente
  const handleBackFromUser = () => {
    setSelectedUser(null);
  };

  // Handler per tornare indietro dalla visualizzazione di una landing page
  const handleBackFromLandingPage = () => {
    setSelectedLandingPage(null);
  };

  if (isLoading && landingPages.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header con controlli semplificati */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          {/* Filtro intervallo di tempo */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="bg-zinc-800 rounded-xl px-3 py-2 text-sm appearance-none pr-8 focus:ring-primary focus:outline-none transition-all"
              style={{ borderRadius: '12px' }}
            >
              <option value="24h">Ultime 24 ore</option>
              <option value="7d">Ultimi 7 giorni</option>
              <option value="30d">Ultimi 30 giorni</option>
              <option value="all">Tutti i dati</option>
            </select>
            <Filter size={14} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>
      
      {/* AI Analytics - Nuova sezione sopra la lista delle landing page */}
      {!selectedLandingPage && (
        <AIAnalytics timeRange={timeRange} />
      )}
      
      {/* Breadcrumb di navigazione */}
      {(selectedLandingPage || selectedUser || selectedSession) && (
        <div className="flex flex-wrap items-center text-xs text-zinc-400 gap-1 py-2">
          <button 
            onClick={() => {
              setSelectedLandingPage(null);
              setSelectedUser(null);
              setSelectedSession(null);
            }}
            className="hover:text-primary transition-colors"
          >
            Landing Pages
          </button>
          
          {selectedLandingPage && (
            <>
              <ChevronRight size={12} />
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedSession(null);
                }}
                className="hover:text-primary transition-colors"
              >
                {selectedLandingPage.url.length > 30 
                  ? selectedLandingPage.url.substring(0, 30) + '...' 
                  : selectedLandingPage.url}
              </button>
            </>
          )}
          
          {selectedUser && (
            <>
              <ChevronRight size={12} />
              <button 
                onClick={() => setSelectedSession(null)}
                className="hover:text-primary transition-colors max-w-[150px] truncate"
              >
                fingerprintID
              </button>
            </>
          )}
          
          {selectedSession && (
            <>
              <ChevronRight size={12} />
              <span className="text-zinc-300">
                Sessione {selectedSession?.startTime ? new Date(selectedSession.startTime).toLocaleString('it-IT') : 'Data non disponibile'}
              </span>
            </>
          )}
        </div>
      )}
      
      {/* Contenuto principale */}
      <div className="bg-zinc-900 rounded-xl overflow-hidden" style={{ borderRadius: '12px' }}>
        {/* Visualizzazione delle landing page */}
        {!selectedLandingPage && (
          <LandingPageList 
            landingPages={landingPages}
            onSelectLandingPage={handleSelectLandingPage}
            isLoading={isLoading}
          />
        )}
        
        {/* Visualizzazione degli utenti di una landing page */}
        {selectedLandingPage && !selectedUser && (
          <UsersList 
            users={users}
            landingPage={selectedLandingPage}
            onSelectUser={handleSelectUser}
            onBack={handleBackFromLandingPage}
            isLoading={isLoadingUsers}
          />
        )}
        
        {/* Visualizzazione delle sessioni di un utente */}
        {selectedUser && !selectedSession && (
          <SessionsList 
            sessions={sessions}
            user={selectedUser}
            onSelectSession={handleSelectSession}
            onBack={handleBackFromUser}
            isLoading={isLoadingSessions}
          />
        )}
        
        {/* Visualizzazione del percorso di una sessione */}
        {selectedSession && (
          <SessionFlow 
            sessionDetails={sessionDetails}
            session={selectedSession}
            onBack={handleBackFromSession}
            isLoading={isLoadingDetails}
          />
        )}
      </div>
      
      {/* Statistiche Avanzate */}
      {!selectedLandingPage && (
        <AdvancedStatistics timeRange={timeRange} />
      )}
      
      {/* Facebook Ads */}
      {!selectedLandingPage && (
        <div className="mt-8">
          <div className="bg-zinc-900 rounded-xl" style={{ borderRadius: '12px' }}>
            <MarketingApiOverview timeRange={timeRange as '7d' | '30d' | '90d'} />
          </div>
        </div>
      )}
    </div>
  );
}