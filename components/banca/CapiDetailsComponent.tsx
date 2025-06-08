// CapiDetailsComponent.tsx
import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { SmoothCorners } from 'react-smooth-corners';

// Define the Facebook CAPI interface
interface FacebookCapi {
  sent: boolean;
  timestamp?: string;
  success?: boolean;
  eventId?: string;
  payload?: any;
  response?: any;
  error?: any;
}

interface CapiDetailsModalProps {
  capiData: FacebookCapi;
  onClose: () => void;
  triggerRect?: DOMRect | null;
}

export const CapiDetailsModal: React.FC<CapiDetailsModalProps> = ({ capiData, onClose, triggerRect }) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Format the timestamp
  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Handle copying to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(field);
        setTimeout(() => setCopySuccess(null), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };

  // Pretty print JSON
  const formatJSON = (json: any) => {
    if (!json) return 'N/A';
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return JSON.stringify(json);
    }
  };

  // Calcola le coordinate iniziali e finali per l'animazione
  const getAnimationCoordinates = () => {
    if (!triggerRect) {
      return {
        initial: {
          x: 0,
          y: 0,
          scale: 0.1,
          opacity: 1,
        },
        animate: {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
        }
      };
    }

    const triggerCenterX = triggerRect.left + (triggerRect.width / 2);
    const triggerCenterY = triggerRect.top + (triggerRect.height / 2);
    const finalX = window.innerWidth / 2;
    const finalY = window.innerHeight / 2;

    return {
      initial: {
        x: triggerCenterX - finalX,
        y: triggerCenterY - finalY,
        scale: 0.1,
        opacity: 1,
      },
      animate: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
      }
    };
  };

  const coords = getAnimationCoordinates();

  const handleClose = () => {
    setIsClosing(true);
    onClose();
  };

  // Configurazione spring per animazione naturale stile iOS
  const springConfig = {
    type: "spring" as const,
    damping: isClosing ? 35 : 25,
    stiffness: isClosing ? 400 : 300,
    mass: 0.8,
  };

  // Chiudi la modale quando si preme ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      {/* Background overlay */}
      <motion.div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs backdrop-saturate-150"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={springConfig}
      />
      
      {/* Modal container con animazione iOS */}
      <motion.div 
        className="relative z-10 w-full max-w-2xl mx-4 sm:mx-6"
        onClick={(e) => e.stopPropagation()}
        initial={coords.initial}
        animate={coords.animate}
        exit={{
          ...coords.initial,
          scale: 0.1,
          opacity: 0,
        }}
        transition={springConfig}
        style={{
          transformOrigin: "center center"
        }}
      >
        <SmoothCorners 
          corners="2.5"
          borderRadius="24"
        />
        
        <div className="relative bg-zinc-200/85 dark:bg-zinc-700/80 rounded-[24px] shadow-lg overflow-hidden max-h-[80vh] flex flex-col">
          {/* Header minimale */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              {capiData.success ? (
                <CheckCircle2 size={20} className="text-green-600" />
              ) : (
                <AlertCircle size={20} className="text-red-600" />
              )}
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Facebook CAPI {capiData.success ? 'Success' : 'Error'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/30 dark:hover:bg-white/20 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="px-4 sm:px-6 pb-6 overflow-y-auto">
            <div className="space-y-4 sm:space-y-6">
              {/* Status e timestamp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-white/50 dark:bg-black/40 rounded-2xl">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status</h3>
                  <p className={`flex items-center text-sm sm:text-base font-medium ${
                    capiData.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {capiData.success ? (
                      <>
                        <CheckCircle2 size={16} className="mr-1.5" />
                        Success
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="mr-1.5" />
                        Error
                      </>
                    )}
                  </p>
                </div>
                
                <div className="p-3 sm:p-4 bg-white/50 dark:bg-black/40 rounded-2xl">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Timestamp</h3>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white">{formatDate(capiData.timestamp)}</p>
                </div>
              </div>
              
              {/* Event ID */}
              <div className="p-3 sm:p-4 bg-white/50 dark:bg-black/40 rounded-2xl">
                <div className="flex justify-between items-start">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Event ID</h3>
                  {capiData.eventId && (
                    <button 
                      onClick={() => copyToClipboard(capiData.eventId || '', 'eventId')}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center text-xs transition-colors"
                      title="Copy to clipboard"
                    >
                      {copySuccess === 'eventId' ? (
                        <>
                          <CheckCircle2 size={14} className="mr-1" />
                          Copiato!
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="mr-1" />
                          Copia
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-sm font-mono break-all text-gray-900 dark:text-white">
                  {capiData.eventId || 'N/A'}
                </p>
              </div>
              
              {/* Error message if present */}
              {capiData.error && (
                <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-2xl">
                  <h3 className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-400 mb-2">Messaggio di errore</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {capiData.error.message || JSON.stringify(capiData.error)}
                  </p>
                </div>
              )}
              
              {/* Response */}
              <div className="p-3 sm:p-4 bg-white/50 dark:bg-black/40 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Risposta Facebook</h3>
                  {capiData.response && (
                    <button 
                      onClick={() => copyToClipboard(formatJSON(capiData.response), 'response')}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center text-xs transition-colors"
                      title="Copy to clipboard"
                    >
                      {copySuccess === 'response' ? (
                        <>
                          <CheckCircle2 size={14} className="mr-1" />
                          Copiato!
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="mr-1" />
                          Copia
                        </>
                      )}
                    </button>
                  )}
                </div>
                <pre className="bg-gray-900 dark:bg-black text-gray-100 dark:text-gray-200 rounded-xl p-3 text-xs overflow-x-auto">
                  {formatJSON(capiData.response)}
                </pre>
              </div>
              
              {/* Payload */}
              <div className="p-3 sm:p-4 bg-white/50 dark:bg-black/40 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Payload inviato</h3>
                  {capiData.payload && (
                    <button 
                      onClick={() => copyToClipboard(formatJSON(capiData.payload), 'payload')}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center text-xs transition-colors"
                      title="Copy to clipboard"
                    >
                      {copySuccess === 'payload' ? (
                        <>
                          <CheckCircle2 size={14} className="mr-1" />
                          Copiato!
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="mr-1" />
                          Copia
                        </>
                      )}
                    </button>
                  )}
                </div>
                <pre className="bg-gray-900 dark:bg-black text-gray-100 dark:text-gray-200 rounded-xl p-3 text-xs overflow-x-auto">
                  {formatJSON(capiData.payload)}
                </pre>
              </div>
            </div>
          </div>
          
          {/* Footer con pulsante chiudi */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={handleClose}
              className="w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/50 dark:bg-white/20 hover:bg-white/70 dark:hover:bg-white/30 font-medium py-3 px-4 rounded-2xl transition-all duration-200"
            >
              Chiudi
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Enhanced CapiStatus component with modal trigger
interface CapiStatusProps {
  capiData?: FacebookCapi;
}

export function EnhancedCapiStatus({ capiData }: CapiStatusProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  if (!capiData || !capiData.sent) {
    return (
      <span className="flex items-center text-zinc-500 text-xs">
        <Info size={14} className="mr-1" />
        Non inviato
      </span>
    );
  }

  const handleClick = (event: React.MouseEvent) => {
    const targetElement = event.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    setTriggerRect(rect);
    setShowDetails(true);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className={`flex items-center text-xs transition-colors ${
          capiData.success 
            ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300' 
            : 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
        }`}
        title={capiData.success 
          ? `Evento inviato con successo: ${capiData.eventId}` 
          : `Errore: ${capiData.error?.message || 'Errore sconosciuto'}`
        }
      >
        {capiData.success ? (
          <>
            <CheckCircle2 size={14} className="mr-1" />
            Successo
          </>
        ) : (
          <>
            <AlertCircle size={14} className="mr-1" />
            Errore
          </>
        )}
        <span className="ml-1 text-gray-400 dark:text-gray-500">(Dettagli)</span>
      </button>
      
      <AnimatePresence mode="wait">
        {showDetails && (
          <CapiDetailsModal 
            key="capi-modal"
            capiData={capiData} 
            onClose={() => {
              setShowDetails(false);
              setTriggerRect(null);
            }}
            triggerRect={triggerRect}
          />
        )}
      </AnimatePresence>
    </>
  );
}