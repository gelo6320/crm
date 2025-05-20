// CapiDetailsModal.tsx
import React, { useState } from 'react';
import { X, Copy, CheckCircle2, AlertCircle, Info } from 'lucide-react';

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
}

export const CapiDetailsModal: React.FC<CapiDetailsModalProps> = ({ capiData, onClose }) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
          <h2 className="text-lg font-medium flex items-center">
            {capiData.success ? (
              <CheckCircle2 size={20} className="mr-2 text-success" />
            ) : (
              <AlertCircle size={20} className="mr-2 text-danger" />
            )}
            Facebook CAPI {capiData.success ? 'Success' : 'Error'} Details
          </h2>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Status and timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-3 bg-zinc-800/50">
                <h3 className="text-sm font-medium text-zinc-400 mb-1">Status</h3>
                <p className={`flex items-center text-base ${capiData.success ? 'text-success' : 'text-danger'}`}>
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
              
              <div className="card p-3 bg-zinc-800/50">
                <h3 className="text-sm font-medium text-zinc-400 mb-1">Timestamp</h3>
                <p className="text-base">{formatDate(capiData.timestamp)}</p>
              </div>
            </div>
            
            {/* Event ID */}
            <div className="card p-3 bg-zinc-800/50">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-zinc-400 mb-1">Event ID</h3>
                {capiData.eventId && (
                  <button 
                    onClick={() => copyToClipboard(capiData.eventId || '', 'eventId')}
                    className="text-zinc-400 hover:text-white flex items-center text-xs"
                    title="Copy to clipboard"
                  >
                    {copySuccess === 'eventId' ? (
                      <>
                        <CheckCircle2 size={14} className="mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="text-base font-mono break-all text-sm">{capiData.eventId || 'N/A'}</p>
            </div>
            
            {/* Error message if present */}
            {capiData.error && (
              <div className="card p-3 bg-zinc-800/50 border-l-2 border-danger">
                <h3 className="text-sm font-medium text-zinc-400 mb-1">Error Message</h3>
                <p className="text-danger">{capiData.error.message || JSON.stringify(capiData.error)}</p>
              </div>
            )}
            
            {/* Response */}
            <div className="card p-3 bg-zinc-800/50">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-zinc-400 mb-1">Facebook Response</h3>
                {capiData.response && (
                  <button 
                    onClick={() => copyToClipboard(formatJSON(capiData.response), 'response')}
                    className="text-zinc-400 hover:text-white flex items-center text-xs"
                    title="Copy to clipboard"
                  >
                    {copySuccess === 'response' ? (
                      <>
                        <CheckCircle2 size={14} className="mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              <pre className="bg-zinc-950 rounded p-2 text-xs overflow-x-auto">
                {formatJSON(capiData.response)}
              </pre>
            </div>
            
            {/* Payload */}
            <div className="card p-3 bg-zinc-800/50">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-zinc-400 mb-1">Sent Payload</h3>
                {capiData.payload && (
                  <button 
                    onClick={() => copyToClipboard(formatJSON(capiData.payload), 'payload')}
                    className="text-zinc-400 hover:text-white flex items-center text-xs"
                    title="Copy to clipboard"
                  >
                    {copySuccess === 'payload' ? (
                      <>
                        <CheckCircle2 size={14} className="mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              <pre className="bg-zinc-950 rounded p-2 text-xs overflow-x-auto">
                {formatJSON(capiData.payload)}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-700">
          <button 
            onClick={onClose}
            className="btn btn-outline w-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced CapiStatus component with modal trigger
interface CapiStatusProps {
  capiData?: FacebookCapi;
}

export function EnhancedCapiStatus({ capiData }: CapiStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!capiData || !capiData.sent) {
    return (
      <span className="flex items-center text-zinc-500 text-xs">
        <Info size={14} className="mr-1" />
        Non inviato
      </span>
    );
  }

  return (
    <>
      <button 
        onClick={() => setShowDetails(true)}
        className={`flex items-center text-xs ${
          capiData.success ? 'text-success hover:underline' : 'text-danger hover:underline'
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
        <span className="ml-1 text-zinc-400">(Dettagli)</span>
      </button>
      
      {showDetails && (
        <CapiDetailsModal 
          capiData={capiData} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </>
  );
}