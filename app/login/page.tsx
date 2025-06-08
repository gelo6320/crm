// app/login/page.tsx
"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Tipi per il sistema di linee dinamiche
interface Point {
  x: number;
  y: number;
}

interface CircuitLine {
  id: string;
  startPoint: Point;
  currentPoint: Point;
  direction: number; // 0, 90, 180, 270 gradi
  length: number;
  maxLength: number;
  speed: number;
  phase: 'growing' | 'stable' | 'shrinking' | 'dead';
  opacity: number;
  thickness: number;
  canBranch: boolean;
  parentId?: string;
  segments: Point[];
}

// Componente per le linee animate del circuito dinamiche
function DynamicCircuitLines() {
  const [lines, setLines] = useState<CircuitLine[]>([]);
  const [nextId, setNextId] = useState(0);

  // Funzione per creare una nuova linea
  const createLine = useCallback((startPoint?: Point, direction?: number, parentId?: string): CircuitLine => {
    const directions = [0, 45, 90, 135, 180, 225, 270, 315];
    const randomDirection = direction ?? directions[Math.floor(Math.random() * directions.length)];
    const randomStart = startPoint ?? {
      x: Math.random() * 100,
      y: Math.random() * 100
    };

    return {
      id: `line-${nextId}`,
      startPoint: randomStart,
      currentPoint: randomStart,
      direction: randomDirection,
      length: 0,
      maxLength: Math.random() * 30 + 10, // 10-40% dello schermo
      speed: Math.random() * 0.5 + 0.3, // velocità variabile
      phase: 'growing',
      opacity: Math.random() * 0.6 + 0.4,
      thickness: Math.random() * 2 + 1,
      canBranch: Math.random() > 0.6, // 40% di possibilità di ramificarsi
      parentId,
      segments: [randomStart]
    };
  }, [nextId]);

  // Funzione per aggiornare una linea
  const updateLine = useCallback((line: CircuitLine): CircuitLine => {
    if (line.phase === 'dead') return line;

    const newLine = { ...line };
    
    if (line.phase === 'growing') {
      // Calcola il nuovo punto basato su direzione e velocità
      const radians = (line.direction * Math.PI) / 180;
      const deltaX = Math.cos(radians) * line.speed;
      const deltaY = Math.sin(radians) * line.speed;
      
      newLine.currentPoint = {
        x: Math.max(0, Math.min(100, line.currentPoint.x + deltaX)),
        y: Math.max(0, Math.min(100, line.currentPoint.y + deltaY))
      };
      
      newLine.length += line.speed;
      newLine.segments = [...line.segments, newLine.currentPoint];
      
      // Controlla se ha raggiunto la lunghezza massima o i bordi
      if (newLine.length >= line.maxLength || 
          newLine.currentPoint.x <= 0 || newLine.currentPoint.x >= 100 ||
          newLine.currentPoint.y <= 0 || newLine.currentPoint.y >= 100) {
        newLine.phase = 'stable';
        setTimeout(() => {
          setLines(prev => prev.map(l => 
            l.id === line.id ? { ...l, phase: 'shrinking' } : l
          ));
        }, Math.random() * 2000 + 1000); // Rimane stabile per 1-3 secondi
      }
    } else if (line.phase === 'shrinking') {
      newLine.length -= line.speed * 1.5; // Si accorcia più velocemente
      newLine.opacity -= 0.02;
      
      // Rimuovi segmenti dal retro
      if (newLine.segments.length > 1) {
        newLine.segments = newLine.segments.slice(1);
      }
      
      if (newLine.length <= 0 || newLine.opacity <= 0) {
        newLine.phase = 'dead';
      }
    }
    
    return newLine;
  }, []);

  // Funzione per controllare le collisioni e interazioni
  const checkInteractions = useCallback((lines: CircuitLine[]) => {
    const newLines = [...lines];
    let addedLines: CircuitLine[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.phase !== 'growing') continue;
      
      // Possibilità di ramificazione
      if (line.canBranch && Math.random() < 0.003 && !line.parentId) { // 0.3% per frame
        const branchDirections = [line.direction + 90, line.direction - 90].filter(dir => dir !== line.direction);
        const branchDirection = branchDirections[Math.floor(Math.random() * branchDirections.length)];
        
        const branchLine = createLine(line.currentPoint, branchDirection, line.id);
        addedLines.push(branchLine);
        
        // Disabilita ulteriori ramificazioni per questa linea
        newLines[i] = { ...line, canBranch: false };
        setNextId(prev => prev + 1);
      }
      
      // Controlla collisioni con altre linee
      for (let j = i + 1; j < lines.length; j++) {
        const otherLine = lines[j];
        if (otherLine.phase !== 'growing') continue;
        
        const distance = Math.sqrt(
          Math.pow(line.currentPoint.x - otherLine.currentPoint.x, 2) +
          Math.pow(line.currentPoint.y - otherLine.currentPoint.y, 2)
        );
        
        // Se le linee si incontrano (distanza < 3%), cambiano direzione o si fermano
        if (distance < 3 && line.id !== otherLine.id) {
          if (Math.random() < 0.7) { // 70% di possibilità di cambio direzione
            const newDirection = (line.direction + 90) % 360;
            newLines[i] = { ...line, direction: newDirection };
            
            const otherNewDirection = (otherLine.direction - 90 + 360) % 360;
            newLines[j] = { ...otherLine, direction: otherNewDirection };
          } else { // 30% di possibilità di fermarsi
            newLines[i] = { ...line, phase: 'stable' };
            newLines[j] = { ...otherLine, phase: 'stable' };
          }
        }
      }
    }
    
    return [...newLines, ...addedLines];
  }, [createLine]);

  // Loop principale di animazione
  useEffect(() => {
    const interval = setInterval(() => {
      setLines(prevLines => {
        // Rimuovi linee morte
        let activeLines = prevLines.filter(line => line.phase !== 'dead');
        
        // Aggiorna tutte le linee
        activeLines = activeLines.map(updateLine);
        
        // Controlla interazioni
        activeLines = checkInteractions(activeLines);
        
        // Aggiungi nuove linee casuali (max 4-6 linee simultanee)
        if (activeLines.length < 4 && Math.random() < 0.02) { // 2% di possibilità per frame
          const newLine = createLine();
          activeLines.push(newLine);
          setNextId(prev => prev + 1);
        }
        
        return activeLines;
      });
    }, 50); // 20 FPS
    
    return () => clearInterval(interval);
  }, [updateLine, checkInteractions, createLine]);

  // Genera il path SVG per una linea
  const generatePath = (line: CircuitLine): string => {
    if (line.segments.length < 2) return '';
    
    let path = `M ${line.segments[0].x} ${line.segments[0].y}`;
    for (let i = 1; i < line.segments.length; i++) {
      path += ` L ${line.segments[i].x} ${line.segments[i].y}`;
    }
    return path;
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {lines.map(line => (
          <g key={line.id}>
            {/* Linea principale */}
            <path
              d={generatePath(line)}
              stroke="#FF6B00"
              strokeWidth={line.thickness / 10}
              fill="none"
              opacity={line.opacity}
              filter="url(#glow)"
              className="transition-opacity duration-300"
            />
            
            {/* Punti di connessione */}
            {line.segments.map((point, index) => {
              if (index === 0 || index === line.segments.length - 1) {
                return (
                  <circle
                    key={`${line.id}-point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={line.thickness / 20}
                    fill="#FF6B00"
                    opacity={line.opacity * 1.5}
                    filter="url(#glow)"
                  >
                    <animate
                      attributeName="r"
                      values={`${line.thickness / 20};${line.thickness / 10};${line.thickness / 20}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              }
              return null;
            })}
            
            {/* Effetto di movimento sulla punta */}
            {line.phase === 'growing' && line.segments.length > 0 && (
              <circle
                cx={line.currentPoint.x}
                cy={line.currentPoint.y}
                r="0.3"
                fill="#FF6B00"
                opacity="0.8"
                filter="url(#glow)"
              >
                <animate
                  attributeName="opacity"
                  values="0.8;0.2;0.8"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        ))}
      </svg>
      
      {/* Punti di riferimento fissi per dare contesto */}
      <div className="absolute top-10 left-10 w-1 h-1 bg-[#FF6B00]/30 rounded-full animate-pulse"></div>
      <div className="absolute top-20 right-20 w-1 h-1 bg-[#FF6B00]/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-1 h-1 bg-[#FF6B00]/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-10 right-10 w-1 h-1 bg-[#FF6B00]/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
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
      
      {/* Sistema di linee dinamiche */}
      <DynamicCircuitLines />
      
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