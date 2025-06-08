// lib/auth/AuthContext.tsx - Versione completa con sicurezza e fix del flash
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

interface User {
  id: string;
  username: string;
  name: string;
  role: string; 
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean; // 🔧 Nuovo stato per evitare flash
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // 🔧 Fix flash problem
  const router = useRouter();
  
  useEffect(() => {
    checkAuthOnMount();
  }, [router]);

  // 🔧 Session refresh ogni 10 minuti per mantenere viva la sessione
  useEffect(() => {
    if (user) {
      const interval = setInterval(async () => {
        try {
          await axios.post(`${API_BASE_URL}/api/refresh-session`, {}, {
            withCredentials: true
          });
        } catch (error) {
          console.warn("Session refresh failed:", error);
        }
      }, 10 * 60 * 1000); // 10 minuti

      return () => clearInterval(interval);
    }
  }, [user]);

  const checkAuthOnMount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/check-auth`, {
        withCredentials: true,
        timeout: 10000 // 🔧 Timeout per evitare hang
      });
      
      if (response.data.authenticated && response.data.user) {
        setUser({
          id: response.data.user.id || '1',
          username: response.data.user.username,
          name: response.data.user.name || response.data.user.username,
          role: response.data.user.role || 'user',
          lastLogin: response.data.user.lastLogin
        });
      } else {
        setUser(null);
        redirectToLoginIfNeeded();
      }
    } catch (error) {
      console.error("Authentication check error:", error);
      setUser(null);
      redirectToLoginIfNeeded();
    } finally {
      setIsInitialized(true); // 🔧 Auth check completato
    }
  };

  const redirectToLoginIfNeeded = () => {
    const currentPath = window.location.pathname;
    const protectedPaths = ['/', '/crm', '/events', '/calendar', '/sales-funnel', '/settings'];
    
    // 🔧 Evita redirect se siamo già sulla pagina di login
    if (currentPath === '/login') {
      return;
    }
    
    if (protectedPaths.some(path => currentPath === path || currentPath.startsWith(`${path}/`))) {
      const redirectUrl = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    }
  };
  
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username: username.trim().toLowerCase(),
        password
      }, {
        withCredentials: true,
        timeout: 15000 // 🔧 Timeout più lungo per login
      });
      
      if (response.data.success) {
        // 🔧 Usa i dati utente dalla risposta di login se disponibili
        if (response.data.user) {
          setUser({
            id: response.data.user.id,
            username: response.data.user.username,
            name: response.data.user.name,
            role: response.data.user.role,
            lastLogin: response.data.user.lastLogin
          });
        } else {
          // Fallback: ricarica i dati utente
          await checkAuthOnMount();
        }
        
        // Redirect
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirectTo') || '/';
        
        // 🔧 Usa replace invece di push per evitare ritorno al login
        router.replace(redirectTo);
      } else {
        throw new Error(response.data.message || 'Login fallito');
      }
    } catch (error) {
      console.error("Login error:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Troppi tentativi di login. Riprova più tardi.');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
      }
      throw new Error('Errore durante il login');
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/logout`, {}, {
        withCredentials: true,
        timeout: 10000
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // 🔧 Sempre pulire lo stato locale anche se il logout fallisce
      setUser(null);
      setIsLoading(false);
      
      // 🔧 Force refresh completo per pulire tutto lo stato
      window.location.href = '/login';
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      isInitialized 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🔧 Loading Screen Component per evitare flash
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60 text-sm">Verifica autenticazione...</p>
      </div>
    </div>
  );
}

// 🔧 HOC per proteggere le pagine
export function withAuth<T extends {}>(WrappedComponent: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { user, isInitialized } = useAuth();
    
    // 🔧 Mostra loading screen finché non è inizializzato
    if (!isInitialized) {
      return <AuthLoadingScreen />;
    }
    
    // 🔧 Se non autenticato, non renderizzare nulla (il redirect è gestito nel context)
    if (!user) {
      return <AuthLoadingScreen />;
    }
    
    return <WrappedComponent {...props} />;
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}