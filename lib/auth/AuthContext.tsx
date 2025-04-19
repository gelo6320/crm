// lib/auth/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        // Chiama l'API per verificare l'autenticazione
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";
        const response = await axios.get(`${API_BASE_URL}/api/check-auth`, {
          withCredentials: true
        });
        
        if (response.data.authenticated) {
          // Se l'utente è autenticato, imposta i dati utente
          setUser({
            id: response.data.user?.id || '1',
            email: response.data.user?.email || 'admin@costruzionedigitale.com',
            name: response.data.user?.name || 'Amministratore',
            role: response.data.user?.role || 'admin'
          });
        } else {
          // Se non autenticato, assicurati che l'utente sia null
          setUser(null);
          
          // Se ci troviamo in un percorso protetto, reindirizza al login
          const currentPath = window.location.pathname;
          const protectedPaths = ['/dashboard', '/crm', '/forms', '/bookings', '/events', '/facebook-leads', '/calendar', '/sales-funnel', '/settings'];
          
          if (protectedPaths.some(path => currentPath.startsWith(path))) {
            router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
          }
        }
      } catch (error) {
        console.error("Authentication check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Chiama l'API di login
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username: email,
        password
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        // Recupera le informazioni utente dopo il login
        const userResponse = await axios.get(`${API_BASE_URL}/api/check-auth`, {
            withCredentials: true
          });
        
        if (userResponse.data.authenticated) {
          setUser({
            id: userResponse.data.user?.id || '1',
            email: userResponse.data.user?.email || email,
            name: userResponse.data.user?.name || 'Amministratore',
            role: userResponse.data.user?.role || 'admin'
          });
          
          // Reindirizza alla pagina richiesta o alla dashboard
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTo = urlParams.get('redirectTo') || '/dashboard';
          router.push(redirectTo);
        }
      } else {
        throw new Error(response.data.message || 'Login fallito');
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      // Chiamata all'API di logout
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";
      await axios.get(`${API_BASE_URL}/api/logout`, {
        withCredentials: true
      });
      
      // Resetta lo stato dell'utente
      setUser(null);
      
      // IMPORTANTE: Reindirizza completamente fuori dall'area CRM
      // Determina l'URL di base per il reindirizzamento
      const crmDomain = process.env.NEXT_PUBLIC_CRM_DOMAIN || 'crm.costruzionedigitale.com';
      const baseUrl = window.location.hostname === crmDomain 
        ? `https://${crmDomain}/login` 
        : '/login';
      
      // Aggiungi un timestamp per evitare problemi di cache
      const redirectUrl = `${baseUrl}?t=${Date.now()}`;
      
      // Reindirizza alla pagina di login usando window.location per un refresh completo
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}