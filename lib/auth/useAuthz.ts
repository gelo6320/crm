// lib/auth/useAuthz.ts
import { useAuth } from "./AuthContext";

/**
 * Custom hook per verificare le autorizzazioni utente
 */
export function useAuthz() {
  const { user } = useAuth();
  
  /**
   * Verifica se l'utente ha un determinato ruolo
   * @param role Ruolo richiesto (es. 'admin')
   * @returns true se l'utente ha il ruolo specificato
   */
  const hasRole = (role: string): boolean => {
    // Se non c'è un utente autenticato, non ha alcun ruolo
    if (!user) return false;
    
    // Verifica se l'utente ha il ruolo richiesto
    return user.role === role;
  };
  
  /**
   * Verifica se l'utente è un amministratore
   * @returns true se l'utente è un amministratore
   */
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };
  
  return {
    hasRole,
    isAdmin
  };
}

export default useAuthz;