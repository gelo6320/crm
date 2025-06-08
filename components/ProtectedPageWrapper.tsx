// components/ProtectedPageWrapper.tsx - Risolve il problema del flash
"use client";

import { useAuth, AuthLoadingScreen } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedPageWrapperProps {
  children: ReactNode;
  requiredRole?: string;
  fallbackUrl?: string;
}

/**
 * Wrapper per pagine protette che evita il flash del contenuto
 * prima del controllo di autenticazione
 */
export function ProtectedPageWrapper({ 
  children, 
  requiredRole, 
  fallbackUrl = "/login" 
}: ProtectedPageWrapperProps) {
  const { user, isInitialized, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo dopo che l'auth è inizializzato
    if (isInitialized) {
      if (!user) {
        // Non autenticato - redirect al login
        const currentPath = window.location.pathname;
        const redirectUrl = `${fallbackUrl}?redirectTo=${encodeURIComponent(currentPath)}`;
        router.replace(redirectUrl);
        return;
      }

      // Controllo ruolo se specificato
      if (requiredRole && user.role !== requiredRole) {
        console.warn(`Access denied: required role ${requiredRole}, user has ${user.role}`);
        router.replace('/unauthorized');
        return;
      }
    }
  }, [isInitialized, user, requiredRole, router, fallbackUrl]);

  // 🔧 Mostra loading finché l'auth non è inizializzato
  if (!isInitialized || isLoading) {
    return <AuthLoadingScreen />;
  }

  // 🔧 Se non autenticato, non mostrare il contenuto (evita flash)
  if (!user) {
    return <AuthLoadingScreen />;
  }

  // 🔧 Se ruolo richiesto non corrisponde, non mostrare contenuto
  if (requiredRole && user.role !== requiredRole) {
    return <AuthLoadingScreen />;
  }

  // 🔧 Solo ora mostra il contenuto protetto
  return <>{children}</>;
}

/**
 * HOC per creare pagine protette
 */
export function withPageProtection<T extends {}>(
  WrappedComponent: React.ComponentType<T>,
  options: { requiredRole?: string; fallbackUrl?: string } = {}
) {
  return function ProtectedComponent(props: T) {
    return (
      <ProtectedPageWrapper 
        requiredRole={options.requiredRole}
        fallbackUrl={options.fallbackUrl}
      >
        <WrappedComponent {...props} />
      </ProtectedPageWrapper>
    );
  };
}

/**
 * Componente per pagine che richiedono ruolo admin
 */
export function AdminProtectedPageWrapper({ children }: { children: ReactNode }) {
  return (
    <ProtectedPageWrapper requiredRole="admin" fallbackUrl="/unauthorized">
      {children}
    </ProtectedPageWrapper>
  );
}

/**
 * Pagina di accesso negato
 */
export function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-zinc-100/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8">
          {/* Icona di errore */}
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Accesso Negato
          </h1>
          
          <p className="text-white/60 text-sm mb-6">
            Non hai i permessi necessari per accedere a questa pagina.
            {user && (
              <>
                <br />
                <span className="text-white/40">
                  Utente: {user.username} ({user.role})
                </span>
              </>
            )}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleBackToHome}
              className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:from-[#FF8533] hover:to-[#FF6B00] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)]"
            >
              Torna alla Home
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-white/5 border border-white/10 text-white/80 font-medium py-3 px-6 rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}