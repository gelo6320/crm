// components/tracciamento/UsersList.tsx
import { Clock, ArrowLeft, Monitor, MapPin, Globe, Activity, ChevronRight } from "lucide-react";
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
          <div className="text-xs text-zinc-400">
            {landingPage.totalVisits.toLocaleString()} visite &middot; {landingPage.uniqueUsers.toLocaleString()} utenti unici
          </div>
        </div>
      </div>
      
      {users.length === 0 ? (
        <div className="p-8 text-center text-zinc-500">
          <p>Nessun utente disponibile per questa landing page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {users.map(user => (
            <div 
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="bg-zinc-800 hover:bg-zinc-700/50 hover:ring-1 hover:ring-primary/30 transition-all duration-200 cursor-pointer p-4 rounded-xl"
              style={{ borderRadius: '12px' }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    user.isActive ? 'bg-success animate-pulse' : 'bg-zinc-500'
                  }`}></div>
                  <h3 className="font-medium text-sm">
                    {user.isActive ? 'Attivo ora' : 'Inattivo'}
                  </h3>
                </div>
                <div className="text-xs text-zinc-400 flex items-center">
                  <Activity size={14} className="mr-1" />
                  {user.sessionsCount} sessioni
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {/* Fingerprint */}
                <div className="flex items-center text-sm">
                  <Monitor size={14} className="text-primary mr-2 flex-shrink-0" />
                  <div className="truncate" title={user.fingerprint}>
                    {user.fingerprint}
                  </div>
                </div>
                
                {/* IP Address */}
                <div className="flex items-center text-sm">
                  <Globe size={14} className="text-info mr-2 flex-shrink-0" />
                  <div>{user.ip}</div>
                </div>
                
                {/* Location */}
                {user.location && (
                  <div className="flex items-center text-sm">
                    <MapPin size={14} className="text-warning mr-2 flex-shrink-0" />
                    <div className="truncate" title={user.location}>
                      {user.location}
                    </div>
                  </div>
                )}
                
                {/* Referrer */}
                {user.referrer && (
                  <div className="flex items-center text-sm">
                    <ArrowLeft size={14} className="text-success mr-2 flex-shrink-0" />
                    <div className="truncate" title={user.referrer}>
                      {user.referrer}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-700">
                <div className="flex items-center text-zinc-400">
                  <Clock size={12} className="mr-1" />
                  <span>Ultimo accesso: {formatDateTime(user.lastActivity)}</span>
                </div>
                <ChevronRight size={14} className="text-primary" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}