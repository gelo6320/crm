// app/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Componente client separato che usa useSearchParams
function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  
  // Ottieni il parametro redirectTo se presente
  // Usiamo direttamente l'URL invece di useSearchParams per evitare l'errore
  const redirectTo = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('redirectTo') || "/"
    : "/";
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Inserisci username e password");
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      await login(username, password);
      // Il reindirizzamento è gestito nel metodo login
    } catch (err: any) {
      setError(err.message || "Errore durante il login");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-md text-sm text-danger">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="input w-full mt-1"
            placeholder="Inserisci il tuo username"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input w-full mt-1"
            placeholder="Inserisci la tua password"
          />
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full py-2"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Accesso in corso...
            </span>
          ) : (
            "Accedi"
          )}
        </button>
      </div>
    </form>
  );
}

// Componente principale con Suspense
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 px-4">
      <div className="max-w-md w-full space-y-8 p-6 bg-zinc-800 rounded-lg shadow-lg">
        <div className="text-center">
          <Image 
            src="/logosito.webp" 
            width={120} 
            height={60} 
            alt="Logo" 
            className="mx-auto"
          />
          <h2 className="mt-6 text-3xl font-bold text-white">
            Accedi al CRM
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Inserisci le tue credenziali per accedere al pannello di controllo
          </p>
        </div>
        
        <Suspense fallback={<div className="mt-8 text-center">Caricamento...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}