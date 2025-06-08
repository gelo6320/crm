// lib/auth/useAuthz.ts - Versione corretta e migliorata
import { useAuth } from "./AuthContext";

/**
 * Custom hook per verificare le autorizzazioni utente
 */
export function useAuthz() {
  const { user } = useAuth();
  
  const hasRole = (role: string): boolean => {
    // Se non c'è un utente autenticato, non ha alcun ruolo
    if (!user) {
      console.log("useAuthz: Nessun utente autenticato");
      return false;
    }
    
    // 🔧 CORREZIONE: user.username invece di user.email
    console.log(`useAuthz: Verifica ruolo '${role}' per utente ${user.username}, ruolo attuale: ${user.role}`);
    return user.role === role;
  };
  
  const isAdmin = (): boolean => {
    const result = hasRole('admin');
    console.log(`useAuthz: isAdmin() => ${result} per utente: ${user?.username || 'non autenticato'}`);
    return result;
  };
  
  // 🔧 Funzioni aggiuntive per autorizzazioni più granulari
  const canAccess = (resource: string): boolean => {
    if (!user) return false;
    
    // Logica di autorizzazione per risorse specifiche
    const permissions: Record<string, string[]> = {
      'admin-panel': ['admin'],
      'user-management': ['admin'],
      'settings': ['admin', 'user'],
      'crm': ['admin', 'user'],
      'reports': ['admin', 'user'],
      'calendar': ['admin', 'user'],
      'sales-funnel': ['admin', 'user']
    };
    
    const allowedRoles = permissions[resource] || [];
    return allowedRoles.includes(user.role);
  };
  
  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };
  
  const isUser = (): boolean => {
    return hasRole('user');
  };
  
  // 🔧 Getter per informazioni utente (per debug/display)
  const getCurrentUser = () => ({
    id: user?.id || null,
    username: user?.username || null,
    name: user?.name || null,
    role: user?.role || null,
    lastLogin: user?.lastLogin || null,
    isAuthenticated: !!user
  });
  
  return {
    hasRole,
    isAdmin,
    isUser,
    canAccess,
    hasAnyRole,
    getCurrentUser,
    // 🔧 Proprietà di comodo per template/JSX
    user,
    isAuthenticated: !!user
  };
}

export default useAuthz;

// 🔧 Hook aggiuntivo per protezione componenti
export function useRequireAuth(requiredRole?: string) {
  const { user, isInitialized } = useAuth();
  const { hasRole } = useAuthz();
  
  const isAuthorized = !requiredRole || hasRole(requiredRole);
  const canRender = isInitialized && user && isAuthorized;
  
  return {
    canRender,
    isLoading: !isInitialized,
    isAuthenticated: !!user,
    isAuthorized,
    user
  };
}

// 🔧 Type guards per TypeScript
export function isAdmin(user: any): user is { role: 'admin' } {
  return user && user.role === 'admin';
}

export function isUser(user: any): user is { role: 'user' } {
  return user && user.role === 'user';
}