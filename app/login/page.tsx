// app/login/page.tsx
"use client";

import { useState, Suspense, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Componente per il pattern esagonale tecnologico animato
function TechHexagonalPattern() {
  const [activeCells, setActiveCells] = useState<Set<string>>(new Set());

  // Genera le celle esagonali attive con animazione casuale
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCells(prev => {
        const newActiveCells = new Set(prev);
        
        // Rimuovi alcune celle casuali (fade out)
        if (newActiveCells.size > 0 && Math.random() < 0.3) {
          const cellsArray = Array.from(newActiveCells);
          const randomCell = cellsArray[Math.floor(Math.random() * cellsArray.length)];
          newActiveCells.delete(randomCell);
        }
        
        // Aggiungi nuove celle casuali (fade in) - max 8-12 attive
        if (newActiveCells.size < 10 && Math.random() < 0.4) {
          const row = Math.floor(Math.random() * 20);
          const col = Math.floor(Math.random() * 20);
          newActiveCells.add(`${row}-${col}`);
        }
        
        return newActiveCells;
      });
    }, 800 + Math.random() * 1200); // Intervallo variabile per naturalezza
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {/* Pattern esagonale base con CSS */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 20%, transparent 80%),
            conic-gradient(from 30deg, transparent 60deg, #FF6B00 60deg, #FF6B00 120deg, transparent 120deg, transparent 180deg, #FF6B00 180deg, #FF6B00 240deg, transparent 240deg, transparent 300deg, #FF6B00 300deg, #FF6B00 360deg, transparent 360deg)
          `,
          backgroundSize: '40px 35px, 40px 35px',
          backgroundPosition: '0 0, 20px 17.5px',
          mask: 'radial-gradient(circle at center, transparent 3px, black 4px)',
          WebkitMask: 'radial-gradient(circle at center, transparent 3px, black 4px)'
        }}
      />
      
      {/* Overlay con celle attive animate */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }, (_, row) => 
          Array.from({ length: 20 }, (_, col) => {
            const cellKey = `${row}-${col}`;
            const isActive = activeCells.has(cellKey);
            const offsetX = (col % 2) * 20; // Offset per pattern esagonale
            
            return (
              <div
                key={cellKey}
                className={`absolute transition-all duration-1000 ${
                  isActive ? 'opacity-80 scale-110' : 'opacity-0 scale-95'
                }`}
                style={{
                  left: `${col * 40 + offsetX}px`,
                  top: `${row * 35}px`,
                  width: '40px',
                  height: '35px',
                  background: isActive
                    ? `radial-gradient(circle at center, #FF6B00 0%, rgba(255, 107, 0, 0.3) 70%, transparent 100%)`
                    : 'transparent',
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 107, 0, 0.6))' : 'none',
                }}
              />
            );
          })
        )}
      </div>
      
      {/* Pattern di connessione sottile */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(60deg, transparent 45%, #FF6B00 50%, transparent 55%),
            linear-gradient(-60deg, transparent 45%, #FF6B00 50%, transparent 55%)
          `,
          backgroundSize: '120px 104px',
          backgroundPosition: '0 0, 60px 52px'
        }}
      />
      
      {/* Punti di riferimento tecnologici */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF6B00]/40 rounded-full animate-pulse" 
           style={{ animationDelay: '0s', animationDuration: '3s' }} />
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-[#FF6B00]/60 rounded-full animate-pulse" 
           style={{ animationDelay: '1s', animationDuration: '2s' }} />
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-[#FF6B00]/50 rounded-full animate-pulse" 
           style={{ animationDelay: '2s', animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-[#FF6B00]/70 rounded-full animate-pulse" 
           style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
    </div>
  );
}

// Componente client separato che usa useSearchParams
function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  
  // Ottieni il parametro redirectTo se presente
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 backdrop-blur-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-5">
        <div className="group">
          <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 transition-all duration-200 backdrop-blur-sm hover:bg-white/10 hover:border-white/20"
            placeholder="Il tuo username"
          />
        </div>
        
        <div className="group">
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 transition-all duration-200 backdrop-blur-sm hover:bg-white/10 hover:border-white/20"
            placeholder="La tua password"
          />
        </div>
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:from-[#FF8533] hover:to-[#FF6B00] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Accesso in corso...
            </span>
          ) : (
            "Accedi al CRM"
          )}
        </button>
      </div>
    </form>
  );
}

// Pagina di login principale
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 relative overflow-hidden">
      {/* Background dotted pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FF6B00_1px,transparent_1px)]" style={{ backgroundSize: '30px 30px' }}></div>
      
      {/* Pattern esagonale tecnologico */}
      <TechHexagonalPattern />
      
      {/* Gradiente radiale per effetto depth */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20"></div>
      
      {/* Container principale con frosted glass */}
      <div className="max-w-md w-full relative z-10">
        <div className="bg-zinc-100/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 relative overflow-hidden">
          {/* Effetto glow interno */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl"></div>
          
          {/* Contenuto */}
          <div className="relative z-10">
            {/* Logo e titolo */}
            <div className="text-center mb-8">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <Image 
                    src="/logosito.webp" 
                    width={140} 
                    height={70} 
                    alt="Logo CRM" 
                    className="relative z-10"
                  />
                  {/* Glow effect dietro il logo */}
                  <div className="absolute inset-0 bg-[#FF6B00]/20 blur-xl rounded-full scale-150 opacity-50"></div>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                Accedi al CRM
              </h1>
              <p className="text-white/60 text-sm leading-relaxed">
                Inserisci le tue credenziali per accedere<br />
                al pannello di controllo avanzato
              </p>
            </div>
            
            {/* Form di login */}
            <Suspense fallback={
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin mx-auto"></div>
                <p className="text-white/60 text-sm mt-3">Caricamento...</p>
              </div>
            }>
              <LoginForm />
            </Suspense>
          </div>
        </div>
        
        {/* Elementi decorativi aggiuntivi */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-[#FF6B00]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-16 h-16 bg-[#FF6B00]/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Stili CSS personalizzati */}
      <style jsx>{`
        .bg-radial-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(255, 107, 0, 0.1) 0%, transparent 70%);
        }
      `}</style>
    </div>
  );
}