// app/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Componente per le linee animate del circuito
function AnimatedCircuitLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Linee orizzontali */}
      <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent opacity-60">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent animate-pulse shadow-[0_0_10px_#FF6B00]"></div>
        <div className="absolute top-0 left-0 w-2 h-2 -mt-[3px] bg-[#FF6B00] rounded-full shadow-[0_0_8px_#FF6B00] animate-ping"></div>
        <div className="absolute top-0 right-1/3 w-1 h-1 -mt-[2px] bg-[#FF6B00] rounded-full animate-pulse"></div>
      </div>
      
      <div className="absolute top-3/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6B00]/40 to-transparent opacity-40">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B00]/60 to-transparent animate-pulse shadow-[0_0_6px_#FF6B00]"></div>
        <div className="absolute top-0 right-0 w-2 h-2 -mt-[3px] bg-[#FF6B00] rounded-full shadow-[0_0_8px_#FF6B00] animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Linee verticali */}
      <div className="absolute left-1/4 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#FF6B00]/50 to-transparent opacity-50">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF6B00]/70 to-transparent animate-pulse shadow-[0_0_8px_#FF6B00]"></div>
        <div className="absolute left-0 top-1/3 w-2 h-2 -ml-[3px] bg-[#FF6B00] rounded-full shadow-[0_0_8px_#FF6B00] animate-ping" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="absolute right-1/4 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#FF6B00]/30 to-transparent opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF6B00]/50 to-transparent animate-pulse shadow-[0_0_6px_#FF6B00]"></div>
        <div className="absolute left-0 bottom-1/4 w-1 h-1 -ml-[2px] bg-[#FF6B00] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Connessioni angolari */}
      <div className="absolute top-1/4 left-1/4 w-4 h-4">
        <div className="absolute inset-0 border-l border-t border-[#FF6B00]/60 rounded-tl-sm shadow-[0_0_6px_#FF6B00] animate-pulse"></div>
      </div>
      
      <div className="absolute top-3/4 right-1/4 w-4 h-4">
        <div className="absolute inset-0 border-r border-b border-[#FF6B00]/40 rounded-br-sm shadow-[0_0_4px_#FF6B00] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Effetti di movimento per simulare dati che scorrono */}
      <div className="absolute top-1/4 left-0 w-full h-[1px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent w-20 animate-pulse-move shadow-[0_0_10px_#FF6B00]"></div>
      </div>
      
      <div className="absolute left-1/4 top-0 w-[1px] h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF6B00] to-transparent h-20 animate-pulse-move-vertical shadow-[0_0_8px_#FF6B00]" style={{ animationDelay: '3s' }}></div>
      </div>
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
      
      {/* Linee animate del circuito */}
      <AnimatedCircuitLines />
      
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
        @keyframes pulse-move {
          0% { transform: translateX(-100px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(calc(100vw + 100px)); opacity: 0; }
        }
        
        @keyframes pulse-move-vertical {
          0% { transform: translateY(-100px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(calc(100vh + 100px)); opacity: 0; }
        }
        
        .animate-pulse-move {
          animation: pulse-move 8s infinite linear;
        }
        
        .animate-pulse-move-vertical {
          animation: pulse-move-vertical 10s infinite linear;
        }
        
        .bg-radial-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(255, 107, 0, 0.1) 0%, transparent 70%);
        }
      `}</style>
    </div>
  );
}