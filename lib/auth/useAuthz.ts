// lib/auth/useAuthz.ts
import { useAuth } from "./AuthContext";

/**
 * Custom hook per verificare le autorizzazioni utente
 */
// In lib/auth/useAuthz.ts
export function useAuthz() {
    const { user } = useAuth();
    
    const hasRole = (role: string): boolean => {
      // Se non c'è un utente autenticato, non ha alcun ruolo
      if (!user) {
        console.log("useAuthz: Nessun utente autenticato");
        return false;
      }
      
      console.log(`useAuthz: Verifica ruolo '${role}' per utente ${user.email}, ruolo attuale: ${user.role}`);
      return user.role === role;
    };
    
    const isAdmin = (): boolean => {
      const result = hasRole('admin');
      console.log(`useAuthz: isAdmin() => ${result}`);
      return result;
    };
    
    return {
      hasRole,
      isAdmin
    };
  }

export default useAuthz;