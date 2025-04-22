// app/sales-funnel-admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Shield, Users, Settings, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import useAuthz from "@/lib/auth/useAuthz";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function SalesFunnelAdminPage() {
    const { isAdmin } = useAuthz();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    
    // Verifica che l'utente sia un amministratore
    useEffect(() => {
      const checkAccess = () => {
        setIsLoading(false);
        
        const isAdminUser = isAdmin();
        console.log(`SalesFunnelAdminPage: Accesso verificato - L'utente ${isAdminUser ? 'è' : 'non è'} un amministratore`);
        
        if (!isAdminUser) {
          console.log("SalesFunnelAdminPage: Accesso negato - Reindirizzamento alla home page");
          router.push('/');
        } else {
          console.log("SalesFunnelAdminPage: Accesso consentito");
        }
      };
      
      const timeout = setTimeout(checkAccess, 500);
      return () => clearTimeout(timeout);
    }, [isAdmin, router]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Se non è un amministratore, non dovrebbe vedere questa pagina (sarà reindirizzato)
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-in">
        <div className="card p-8 max-w-lg text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-warning" />
          <h2 className="text-xl font-bold mb-2">Accesso non autorizzato</h2>
          <p className="text-zinc-400 mb-4">Non hai i permessi necessari per accedere a questa pagina.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center">
        <Shield size={20} className="mr-2 text-primary" />
        <h1 className="text-lg font-medium">Gestione Funnel (Admin)</h1>
      </div>
      
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Users size={64} className="text-primary" />
              <Settings size={36} className="text-zinc-400 -ml-4 -mt-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Pannello di Amministrazione</h2>
            <p className="text-zinc-400 mb-6">
              Questa sezione è riservata agli amministratori per la gestione avanzata del sales funnel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="card bg-zinc-900/60 p-4 rounded">
                <h3 className="font-medium mb-2">Configurazione Fasi Funnel</h3>
                <p className="text-sm text-zinc-400">
                  Personalizza le fasi del funnel e configura comportamenti specifici.
                </p>
              </div>
              <div className="card bg-zinc-900/60 p-4 rounded">
                <h3 className="font-medium mb-2">Automazioni Avanzate</h3>
                <p className="text-sm text-zinc-400">
                  Configura regole automatiche per lo spostamento dei lead nel funnel.
                </p>
              </div>
              <div className="card bg-zinc-900/60 p-4 rounded">
                <h3 className="font-medium mb-2">Gestione Team</h3>
                <p className="text-sm text-zinc-400">
                  Assegna permessi e ruoli ai membri del team commerciale.
                </p>
              </div>
              <div className="card bg-zinc-900/60 p-4 rounded">
                <h3 className="font-medium mb-2">Analytics Avanzate</h3>
                <p className="text-sm text-zinc-400">
                  Visualizza metriche dettagliate e previsioni di conversione.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}