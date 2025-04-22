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
  const isAdminUser = isAdmin();
  
  console.log(`AdminOnly: L'utente ${isAdminUser ? 'è' : 'non è'} un amministratore - ${isAdminUser ? 'mostrando' : 'nascondendo'} il contenuto riservato`);
  
  // Se l'utente è un amministratore, mostra il contenuto
  if (isAdminUser) {
    return <>{children}</>;
  }
  
  // Altrimenti, mostra il contenuto alternativo o nulla
  return <>{fallback}</>;
}