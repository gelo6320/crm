// app/tracciamento/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ChartBar, RefreshCw, Search, Filter, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LandingPageList from "@/components/tracciamento/LandingPageList";
import MarketingApiOverview from "@/components/tracciamento/MarketingApiOverview";
import UsersList from "@/components/tracciamento/UsersList";
import SessionsList from "@/components/tracciamento/SessionsList";
import SessionFlow from "@/components/tracciamento/SessionFlow";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("7d"); // '24h', '7d', '30d', 'all'
  
  // Stato per il tab attivo (aggiungiamo il tab Marketing)
  const [activeTab, setActiveTab] = useState<'landing-pages' | 'marketing'>('landing-pages');
  
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
      
      // Se non ci sono sessioni trovate, visualizza un messaggio nella console
      if (data.length === 0) {
        console.log(`Nessuna sessione trovata per l'utente ${userId}.`);
      }
      
      // Resetta la sessione selezionata
      setSelectedSession(null);
    } catch (error: unknown) {
      console.error("Errore dettagliato durante il caricamento delle sessioni:", error);
      console.error("URL richiesta:", `/api/tracciamento/sessions/${userId}?timeRange=${timeRange}`);
      
      // 2. Correzione per il tipo 'unknown' di error
      // Aggiunta di un controllo di tipo per accedere a error.message in modo sicuro
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

  // Gestione ricerca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLandingPage) {
      loadUsers(selectedLandingPage.id);
    } else {
      loadLandingPages();
    }
  };

  // Gestione cambio intervallo di tempo
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  // Gestione refresh
  const handleRefresh = () => {
    if (selectedSession) {
      loadSessionDetails(selectedSession.id);
    } else if (selectedUser) {
      loadSessions(selectedUser.id);
    } else if (selectedLandingPage) {
      loadUsers(selectedLandingPage.id);
    } else {
      loadLandingPages();
    }
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

  if (isLoading && landingPages.length === 0 && activeTab === 'landing-pages') {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header con titolo e controlli */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {activeTab === 'landing-pages' && (
            <>
              {/* Barra di ricerca */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={selectedLandingPage ? "Cerca utenti..." : "Cerca landing page..."}
                  className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 pl-9 text-sm w-full focus:ring-primary focus:border-primary"
                />
                <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              </form>
              
              {/* Filtro intervallo di tempo */}
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm appearance-none pr-8 focus:ring-primary focus:border-primary"
                >
                  <option value="24h">Ultime 24 ore</option>
                  <option value="7d">Ultimi 7 giorni</option>
                  <option value="30d">Ultimi 30 giorni</option>
                  <option value="all">Tutti i dati</option>
                </select>
                <Filter size={14} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
              
              {/* Refresh button */}
              <button 
                onClick={handleRefresh}
                className="btn btn-outline p-1.5"
                disabled={isLoading || isLoadingUsers || isLoadingSessions || isLoadingDetails}
              >
                <RefreshCw size={16} className={isLoading || isLoadingUsers || isLoadingSessions || isLoadingDetails ? "animate-spin" : ""} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Tabs di navigazione */}
      <div className="border-b border-zinc-700 flex space-x-2">
        <button
          onClick={() => setActiveTab('landing-pages')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'landing-pages'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-500'
          }`}
        >
          Landing Pages
        </button>
        <button
          onClick={() => setActiveTab('marketing')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'marketing'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-500'
          }`}
        >
          Facebook Ads
        </button>
      </div>
      
      {/* Breadcrumb di navigazione (solo per landing pages) */}
      {activeTab === 'landing-pages' && (selectedLandingPage || selectedUser || selectedSession) && (
        <div className="flex items-center text-xs text-zinc-400 space-x-1 py-2">
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
                className="hover:text-primary transition-colors"
              >
                {selectedUser.fingerprint}
              </button>
            </>
          )}
          
          {selectedSession && (
            <>
              <ChevronRight size={12} />
              <span className="text-zinc-300">
                Sessione {new Date(selectedSession.startTime).toLocaleString('it-IT')}
              </span>
            </>
          )}
        </div>
      )}
      
      {/* Contenuto principale - Visualizzazione condizionale in base al tab attivo */}
      {activeTab === 'landing-pages' ? (
        <div className="card overflow-hidden">
          {/* Visualizzazione delle landing page */}
          {!selectedLandingPage && (
            <LandingPageList 
              landingPages={landingPages}
              onSelectLandingPage={handleSelectLandingPage}
              isLoading={isLoading}
              searchQuery={searchQuery}
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
              searchQuery={searchQuery}
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
      ) : (
        /* Visualizzazione della sezione Marketing API */
        <MarketingApiOverview />
      )}
    </div>
  );
}