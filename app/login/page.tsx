// app/login/page.tsx - Versione aggiornata con fix del flash
"use client";

import { useState, Suspense, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Tipi per i nodi della rete blockchain
interface NetworkNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  connections: string[];
}

// Componente per il pattern blockchain/network nodes animato
function AnimatedNetworkNodes() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [connections, setConnections] = useState<Array<{from: NetworkNode, to: NetworkNode, opacity: number}>>([]);

  useEffect(() => {
    const initialNodes: NetworkNode[] = Array.from({ length: 25 }, (_, i) => ({
      id: `node-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.4 + 0.3,
      connections: []
    }));
    setNodes(initialNodes);
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;

    const interval = setInterval(() => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => {
          let newX = node.x + node.vx;
          let newY = node.y + node.vy;
          let newVx = node.vx;
          let newVy = node.vy;

          if (newX <= 0 || newX >= 100) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(100, newX));
          }
          if (newY <= 0 || newY >= 100) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(100, newY));
          }

          if (Math.random() < 0.01) {
            newVx += (Math.random() - 0.5) * 0.002;
            newVy += (Math.random() - 0.5) * 0.002;
          }

          const maxSpeed = 0.03;
          if (Math.abs(newVx) > maxSpeed) newVx = Math.sign(newVx) * maxSpeed;
          if (Math.abs(newVy) > maxSpeed) newVy = Math.sign(newVy) * maxSpeed;

          return {
            ...node,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        });

        const newConnections: Array<{from: NetworkNode, to: NetworkNode, opacity: number}> = [];
        const maxDistance = 15;

        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const nodeA = newNodes[i];
            const nodeB = newNodes[j];
            const distance = Math.sqrt(
              Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2)
            );

            if (distance < maxDistance) {
              const opacity = Math.max(0, (maxDistance - distance) / maxDistance) * 0.6;
              newConnections.push({
                from: nodeA,
                to: nodeB,
                opacity
              });
            }
          }
        }

        setConnections(newConnections);
        return newNodes;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [nodes.length]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FF8533" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.8" />
          </linearGradient>
          <filter id="connectionGlow">
            <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {connections.map((connection, index) => (
          <line
            key={`connection-${connection.from.id}-${connection.to.id}`}
            x1={connection.from.x}
            y1={connection.from.y}
            x2={connection.to.x}
            y2={connection.to.y}
            stroke="url(#connectionGradient)"
            strokeWidth="0.1"
            opacity={connection.opacity}
            filter="url(#connectionGlow)"
            className="transition-opacity duration-300"
          >
            <animate
              attributeName="opacity"
              values={`${connection.opacity * 0.3};${connection.opacity};${connection.opacity * 0.3}`}
              dur="3s"
              repeatCount="indefinite"
            />
          </line>
        ))}
      </svg>

      <div className="absolute inset-0">
        {nodes.map(node => (
          <div
            key={node.id}
            className="absolute transition-all duration-100 ease-linear"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="rounded-full bg-[#FF6B00] shadow-lg transition-all duration-300"
              style={{
                width: `${node.size * 2}px`,
                height: `${node.size * 2}px`,
                opacity: node.opacity,
                boxShadow: `0 0 ${node.size * 3}px rgba(255, 107, 0, ${node.opacity * 0.6})`,
              }}
            />
            
            <div
              className="absolute inset-0 rounded-full border border-[#FF6B00]/40 animate-ping"
              style={{
                width: `${node.size * 4}px`,
                height: `${node.size * 4}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                animationDuration: `${2 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />

            {node.size > 2 && (
              <div
                className="absolute inset-0 rounded-full bg-[#FF6B00]/20 animate-pulse"
                style={{
                  width: `${node.size * 6}px`,
                  height: `${node.size * 6}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  animationDuration: `${3 + Math.random()}s`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#FF6B00]/5 to-transparent" />
        
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={`static-${i}`}
            className="absolute w-0.5 h-0.5 bg-[#FF6B00]/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// 🔧 Componente LoginForm migliorato con validazione avanzata
function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  
  // 🔧 Validazione in tempo reale
  const validateForm = () => {
    if (!username.trim()) {
      setError("Username è obbligatorio");
      return false;
    }
    if (username.length < 3) {
      setError("Username deve essere di almeno 3 caratteri");
      return false;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      setError("Username contiene caratteri non ammessi");
      return false;
    }
    if (!password) {
      setError("Password è obbligatoria");
      return false;
    }
    if (password.length < 6) {
      setError("Password deve essere di almeno 6 caratteri");
      return false;
    }
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError("");
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(username.trim().toLowerCase(), password);
    } catch (err: any) {
      const errorMessage = err.message || "Errore durante il login";
      setError(errorMessage);
      
      // 🔧 Focus automatico per UX migliore
      const usernameInput = document.getElementById('username') as HTMLInputElement;
      if (usernameInput) {
        usernameInput.focus();
        usernameInput.select();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔧 Gestione Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };
  
  return (
    <form className="space-y-6" onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
      {/* 🔧 Messaggio di errore migliorato */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 backdrop-blur-sm animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <div className="space-y-5">
        <div className="group">
          <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
            Username
          </label>
          <div className="relative">
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              disabled={isLoading}
              maxLength={50}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 transition-all duration-200 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Il tuo username"
            />
            {/* 🔧 Indicatore di validazione */}
            {username && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {username.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(username) ? (
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
          </div>
          {/* 🔧 Feedback di validazione */}
          {username && (
            <div className="mt-1 text-xs">
              {username.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(username) ? (
                <span className="text-green-400">✓ Username valido</span>
              ) : (
                <span className="text-yellow-400">
                  {username.length < 3 ? "Minimo 3 caratteri" : "Solo lettere, numeri, . _ -"}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="group">
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoading}
              maxLength={128}
              className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00]/50 transition-all duration-200 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="La tua password"
            />
            {/* 🔧 Toggle visualizzazione password */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors duration-200"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.05 8.05m1.828 1.828L12 12m0 0l2.122 2.122M12 12L9.878 9.878m2.122 2.122l2.121-2.122" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {/* 🔧 Indicatore sicurezza password */}
          {password && (
            <div className="mt-1 text-xs">
              {password.length >= 6 ? (
                <span className="text-green-400">✓ Password valida</span>
              ) : (
                <span className="text-yellow-400">Minimo 6 caratteri</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading || !username || !password}
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

      {/* 🔧 Informazioni di supporto */}
      <div className="text-center text-xs text-white/40 space-y-1">
        <p>Usa il tuo username e password del CRM</p>
        <p>Problemi di accesso? Contatta l'amministratore</p>
      </div>
    </form>
  );
}

// 🔧 Pagina di login con controllo di redirect migliorato
export default function LoginPage() {
  const { user, isInitialized } = useAuth();
  const router = useRouter();
  
  // 🔧 Effetto per gestire redirect se già autenticato
  useEffect(() => {
    if (isInitialized && user) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo') || '/';
      router.replace(redirectTo);
    }
  }, [isInitialized, user, router]);
  
  // 🔧 Non renderizzare nulla se già autenticato
  if (isInitialized && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Reindirizzamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 relative overflow-hidden">
      {/* Background dotted pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FF6B00_1px,transparent_1px)]" style={{ backgroundSize: '30px 30px' }}></div>
      
      {/* Pattern blockchain/network nodes animato */}
      <AnimatedNetworkNodes />
      
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
                    priority
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
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}