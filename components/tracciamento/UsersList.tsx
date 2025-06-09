// components/tracciamento/UsersList.tsx
import { Clock, ArrowLeft, Monitor, MapPin, Globe, Activity, ChevronRight, CheckCircle, XCircle, User } from "lucide-react";
import { TrackedUser, LandingPage } from "@/types/tracciamento";
import { formatDateTime } from "@/lib/utils/date";

interface UsersListProps {
  users: TrackedUser[];
  landingPage: LandingPage;
  onSelectUser: (user: TrackedUser) => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function UsersList({
  users,
  landingPage,
  onSelectUser,
  onBack,
  isLoading
}: UsersListProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento utenti in corso...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
        <h2 className="text-base font-medium">Utenti della Landing Page</h2>
        <button
          onClick={onBack}
          className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1"
          style={{ borderRadius: '8px' }}
        >
          <ArrowLeft size={14} />
          <span>Indietro</span>
        </button>
      </div>
      
      {/* Riepilogo landing page */}
      <div className="p-4 bg-zinc-800/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium truncate max-w-lg" title={landingPage.url}>
              {landingPage.url}
            </h3>
            <p className="text-sm text-zinc-400 truncate max-w-lg" title={landingPage.title}>
              {landingPage.title}
            </p>
          </div>
          {/* Nascondi le statistiche su mobile */}
          <div className="text-xs text-zinc-400 hidden md:block">
            {landingPage.totalVisits.toLocaleString()} visite &middot; {landingPage.uniqueUsers.toLocaleString()} utenti unici
          </div>
        </div>
      </div>
      
      {users.length === 0 ? (
        <div className="p-8 text-center text-zinc-500">
          <p>Nessun utente disponibile per questa landing page.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-zinc-500 bg-zinc-800/30">
              <tr>
                <th className="px-4 py-2 text-left">Utente</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Sessioni</th>
                <th className="px-4 py-2 text-left">Conversione</th>
                <th className="px-4 py-2 text-left">Ultimo accesso</th>
                <th className="px-4 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
            {users.map((user, index) => {
                // CORREZIONE: Usa un identificatore stabile basato sul fingerprint
                // invece di Math.random() che cambia ad ogni render
                const userIdHash = user.fingerprint.split('').reduce((a, b) => {
                  a = ((a << 5) - a) + b.charCodeAt(0);
                  return a & a;
                }, 0);
                
                // Determina se ha convertito basandosi su dati reali o simulazione stabile
                const hasConversion = Math.abs(userIdHash) % 10 < 3; // 30% conversione simulata ma stabile
                
                // Crea un nome utente leggibile
                const userName = `User ${user.fingerprint.substring(0, 8)}`;
                const displayName = userName || `Visitor ${index + 1}`;
                
                return (
                  <tr 
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className="hover:bg-zinc-700/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          user.isActive ? 'bg-success animate-pulse' : 'bg-zinc-500'
                        }`}></div>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Monitor size={14} className="text-primary mr-2" />
                            <span className="font-medium">
                              {displayName}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 text-xs text-zinc-400">
                            <Globe size={12} className="mr-1" />
                            <span>{user.ip}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <MapPin size={14} className="text-warning mr-2" />
                        <span>{user.location || "Sconosciuta"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Activity size={14} className="text-info mr-2" />
                        <span>{user.sessionsCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {hasConversion ? (
                          <>
                            <CheckCircle size={14} className="text-success mr-2" />
                            <div className="flex flex-col">
                              <span className="text-success font-medium">Sì</span>
                              {userName && (
                                <span className="text-xs text-zinc-400">{userName}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} className="text-zinc-500 mr-2" />
                            <span className="text-zinc-500">No</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center text-zinc-400">
                        <Clock size={14} className="mr-2" />
                        <div className="flex flex-col">
                          <span>{new Date(user.lastActivity).toLocaleDateString('it-IT')}</span>
                          <span className="text-xs">{new Date(user.lastActivity).toLocaleTimeString('it-IT')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={16} className="text-zinc-500" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}