// components/auth/AdminOnly.tsx
import { ReactNode } from "react";
import useAuthz from "@/lib/auth/useAuthz";

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente wrapper che mostra il contenuto solo se l'utente è un amministratore
 */
export default function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = useAuthz();
  
  // Se l'utente è un amministratore, mostra il contenuto
  if (isAdmin()) {
    return <>{children}</>;
  }
  
  // Altrimenti, mostra il contenuto alternativo o nulla
  return <>{fallback}</>;
}