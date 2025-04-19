// app/settings/page.tsx
"use client";

import { useState } from "react";
import { Eye, EyeOff, Info } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Settings {
  facebookAccessToken: string;
  facebookPixelId: string;
  facebookTestEventCode: string;
  isDevelopment: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    facebookAccessToken: "",
    facebookPixelId: "",
    facebookTestEventCode: "",
    isDevelopment: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showEvents, setShowEvents] = useState(true);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real app, make API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert("Impostazioni salvate con successo");
    } catch (error) {
      console.error("Error saving settings:", error);
      // Show error message
      alert("Errore durante il salvataggio delle impostazioni");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-lg font-medium mb-6">Impostazioni</h1>
      
      <div className="card mb-6">
        <div className="p-4 border-b border-zinc-700">
          <h2 className="text-base font-medium">Configurazione Facebook Conversion API</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="facebookAccessToken" className="block text-sm font-medium mb-1">
                Access Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  id="facebookAccessToken"
                  name="facebookAccessToken"
                  value={settings.facebookAccessToken}
                  onChange={handleChange}
                  className="input w-full pr-10"
                  placeholder="Inserisci il token di accesso"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-white"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Il token di accesso a Facebook Conversion API
              </p>
            </div>
            
            <div>
              <label htmlFor="facebookPixelId" className="block text-sm font-medium mb-1">
                Pixel ID
              </label>
              <input
                type="text"
                id="facebookPixelId"
                name="facebookPixelId"
                value={settings.facebookPixelId}
                onChange={handleChange}
                className="input w-full"
                placeholder="Es. 1543790469631614"
                required
              />
              <p className="mt-1 text-xs text-zinc-400">
                L&apos;ID del tuo pixel Facebook (es. 1543790469631614)
              </p>
            </div>
            
            <div>
              <label htmlFor="facebookTestEventCode" className="block text-sm font-medium mb-1">
                Test Event Code
              </label>
              <input
                type="text"
                id="facebookTestEventCode"
                name="facebookTestEventCode"
                value={settings.facebookTestEventCode}
                onChange={handleChange}
                className="input w-full"
                placeholder="TEST12345"
              />
              <p className="mt-1 text-xs text-zinc-400">
                Opzionale: codice di test per l&apos;ambiente di sviluppo
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="isDevelopment"
                  name="isDevelopment"
                  checked={settings.isDevelopment}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="isDevelopment" className="font-medium">
                  Modalità sviluppo
                </label>
                <p className="text-zinc-400 text-xs">
                  Attiva per usare il codice di test e non inviare eventi reali
                </p>
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className="btn btn-primary w-full py-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvataggio...
                  </span>
                ) : (
                  "Salva impostazioni"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="card">
        <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
          <h2 className="text-base font-medium">Configurazione eventi CRM</h2>
          <button
            type="button"
            onClick={() => setShowEvents(!showEvents)}
            className="text-zinc-400 hover:text-white"
          >
            {showEvents ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {showEvents && (
          <div className="p-4">
            <div className="flex items-start p-3 bg-info/10 text-info rounded mb-4">
              <Info size={18} className="flex-shrink-0 mt-0.5 mr-2" />
              <p className="text-sm">
                Gli eventi CRM permettono di informare Facebook sulle fasi più avanzate 
                del percorso cliente, migliorando l&apos;ottimizzazione delle campagne pubblicitarie.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-zinc-500 bg-zinc-900/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Nome evento</th>
                    <th className="px-4 py-2 text-left">Descrizione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr className="hover:bg-zinc-800/50">
                    <td className="px-4 py-2.5">
                      <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded">QualifiedLead</code>
                    </td>
                    <td className="px-4 py-2.5">Lead qualificato dopo il contatto iniziale</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/50">
                    <td className="px-4 py-2.5">
                      <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded">Meeting</code>
                    </td>
                    <td className="px-4 py-2.5">Cliente ha partecipato ad un meeting/chiamata</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/50">
                    <td className="px-4 py-2.5">
                      <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded">Opportunity</code>
                    </td>
                    <td className="px-4 py-2.5">Lead trasformato in opportunità commerciale</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/50">
                    <td className="px-4 py-2.5">
                      <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded">ProposalSent</code>
                    </td>
                    <td className="px-4 py-2.5">Preventivo/proposta inviata al cliente</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/50">
                    <td className="px-4 py-2.5">
                      <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded">Purchase</code>
                    </td>
                    <td className="px-4 py-2.5">Cliente ha acquistato/sottoscritto un servizio</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}