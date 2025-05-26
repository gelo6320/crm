// app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Info, Save, Database, Key, MessageCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchUserSettings, saveUserSettings, UserSettings } from "@/lib/api/settings";
import { toast } from "@/components/ui/toaster";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    mongoDbUri: "",
    apiKeys: {
      facebookAccessToken: "",           // Per Facebook Conversion API (CAPI)
      facebookMarketingToken: "",        // Per Facebook Marketing API
      googleApiKey: "",
      facebookPixelId: "",
      facebookAccountId: ""
    },
    whatsapp: {
      accessToken: "",                   // Token di accesso WhatsApp Business API
      phoneNumberId: "",                 // ID del numero di telefono WhatsApp Business
      webhookToken: "",                  // Token per autenticare i webhook WhatsApp
      verifyToken: ""                    // Token di verifica per setup webhook
    },
    webhooks: {
      callbackUrl: ""
    },
    isDevelopment: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  
  // Carica le impostazioni utente all'avvio
  useEffect(() => {
    loadUserSettings();
  }, []);
  
  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUserSettings();
      setSettings(data);
    } catch (error) {
      console.error("Errore durante il caricamento delle impostazioni:", error);
      toast("error", "Errore", "Impossibile caricare le impostazioni utente");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const checked = (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    const type = (e.target as HTMLInputElement).type;
    
    // Gestisci campi nidificati (es. apiKeys.facebookAccessToken, whatsapp.accessToken)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      // Utilizziamo un tipizzazione sicura verificando che parent sia una chiave valida di UserSettings
      if (parent === 'apiKeys' || parent === 'webhooks' || parent === 'whatsapp') {
        setSettings(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === "checkbox" ? checked : value
          }
        }));
      }
    } else {
      // Gestisci campi normali utilizzando tipizzazione specifica
      if (name === 'mongoDbUri') {
        setSettings(prev => ({ ...prev, mongoDbUri: value }));
      } else if (name === 'isDevelopment') {
        setSettings(prev => ({ ...prev, isDevelopment: checked || false }));
      }
      // Aggiungi altri campi diretti se necessario
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const result = await saveUserSettings(settings);
      
      if (result.success) {
        toast("success", "Impostazioni salvate", "Le impostazioni sono state salvate con successo");
      } else {
        throw new Error(result.message || "Errore durante il salvataggio");
      }
    } catch (error) {
      console.error("Errore durante il salvataggio delle impostazioni:", error);
      toast("error", "Errore", "Si è verificato un errore durante il salvataggio delle impostazioni");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="card mb-6">
        <div className="p-4 border-b border-zinc-700">
          <h2 className="text-base font-medium">Configurazione Sistema</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* MongoDB URI */}
            <div>
              <label htmlFor="mongoDbUri" className="block text-sm font-medium mb-1">
                MongoDB URI
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Database size={16} className="text-zinc-500" />
                </div>
                <input
                  type={showToken ? "text" : "password"}
                  id="mongoDbUri"
                  name="mongoDbUri"
                  value={settings.mongoDbUri || ""}
                  onChange={handleChange}
                  className="input w-full pl-10 pr-10"
                  placeholder="mongodb://username:password@localhost:27017/database"
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
                URI di connessione al database MongoDB
              </p>
            </div>
            
            {/* Sezione Facebook */}
            <div className="pt-2 pb-1 border-t border-b border-zinc-700 mb-2">
              <h3 className="text-sm font-medium text-zinc-300">Configurazione Facebook</h3>
            </div>
            
            {/* Facebook Conversion API Token */}
            <div>
              <label htmlFor="apiKeys.facebookAccessToken" className="block text-sm font-medium mb-1">
                Facebook Conversion API Token (CAPI)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-zinc-500" />
                </div>
                <input
                  type={showToken ? "text" : "password"}
                  id="apiKeys.facebookAccessToken"
                  name="apiKeys.facebookAccessToken"
                  value={settings.apiKeys?.facebookAccessToken || ""}
                  onChange={handleChange}
                  className="input w-full pl-10 pr-10"
                  placeholder="EAABiLT7R4n8BAHDpZBs6jc..."
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
                Token di accesso a Facebook Conversion API (per tracking conversioni)
              </p>
            </div>
            
            {/* Facebook Marketing API Token */}
            <div>
              <label htmlFor="apiKeys.facebookMarketingToken" className="block text-sm font-medium mb-1">
                Facebook Marketing API Token
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-zinc-500" />
                </div>
                <input
                  type={showToken ? "text" : "password"}
                  id="apiKeys.facebookMarketingToken"
                  name="apiKeys.facebookMarketingToken"
                  value={settings.apiKeys?.facebookMarketingToken || ""}
                  onChange={handleChange}
                  className="input w-full pl-10 pr-10"
                  placeholder="EAABiLT7R4n8BAHDpZBs6jc..."
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
                Token di accesso a Facebook Marketing API (per dati campagne)
              </p>
              <p className="text-xs text-info mt-1">
                <Info size={12} className="inline mr-1" />
                Questo token è diverso da quello CAPI e richiede permessi specifici (ads_management, ads_read)
              </p>
            </div>
            
            {/* Facebook Account ID */}
            <div>
              <label htmlFor="apiKeys.facebookAccountId" className="block text-sm font-medium mb-1">
                Facebook Account ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  id="apiKeys.facebookAccountId"
                  name="apiKeys.facebookAccountId"
                  value={settings.apiKeys?.facebookAccountId || ""}
                  onChange={handleChange}
                  className="input w-full pl-10"
                  placeholder="123456789012345"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                ID dell'account pubblicitario di Facebook (senza il prefisso 'act_')
              </p>
              <p className="text-xs text-info mt-1">
                <Info size={12} className="inline mr-1" />
                Puoi trovare questo ID nella dashboard di Facebook Ads Manager nell'URL o nelle impostazioni dell'account
              </p>
            </div>
            
            {/* Facebook Pixel ID */}
            <div>
              <label htmlFor="apiKeys.facebookPixelId" className="block text-sm font-medium mb-1">
                Facebook Pixel ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  id="apiKeys.facebookPixelId"
                  name="apiKeys.facebookPixelId"
                  value={settings.apiKeys?.facebookPixelId || ""}
                  onChange={handleChange}
                  className="input w-full pl-10"
                  placeholder="123456789012345"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                ID del Pixel Facebook
              </p>
            </div>
            
            {/* Sezione WhatsApp */}
            <div className="pt-2 pb-1 border-t border-b border-zinc-700 mb-2">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                <MessageCircle size={16} className="mr-2" />
                Configurazione WhatsApp Business API
              </h3>
            </div>
            
            {/* WhatsApp Access Token */}
            <div>
              <label htmlFor="whatsapp.accessToken" className="block text-sm font-medium mb-1">
                WhatsApp Access Token
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-zinc-500" />
                </div>
                <input
                  type={showToken ? "text" : "password"}
                  id="whatsapp.accessToken"
                  name="whatsapp.accessToken"
                  value={settings.whatsapp?.accessToken || ""}
                  onChange={handleChange}
                  className="input w-full pl-10 pr-10"
                  placeholder="EAABZXHxxX..."
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
                Token di accesso per WhatsApp Business API (gestione messaggi)
              </p>
              <p className="text-xs text-info mt-1">
                <Info size={12} className="inline mr-1" />
                Genera questo token dalle impostazioni della tua app Facebook per sviluppatori
              </p>
            </div>
            
            {/* WhatsApp Phone Number ID */}
            <div>
              <label htmlFor="whatsapp.phoneNumberId" className="block text-sm font-medium mb-1">
                WhatsApp Phone Number ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MessageCircle size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  id="whatsapp.phoneNumberId"
                  name="whatsapp.phoneNumberId"
                  value={settings.whatsapp?.phoneNumberId || ""}
                  onChange={handleChange}
                  className="input w-full pl-10"
                  placeholder="123456789012345"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                ID del numero di telefono WhatsApp Business registrato
              </p>
              <p className="text-xs text-info mt-1">
                <Info size={12} className="inline mr-1" />
                Trovi questo ID nella dashboard di WhatsApp Business (non è il numero di telefono)
              </p>
            </div>
            
            {/* WhatsApp Webhook Token */}
            <div>
              <label htmlFor="whatsapp.webhookToken" className="block text-sm font-medium mb-1">
                WhatsApp Webhook Token
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-zinc-500" />
                </div>
                <input
                  type={showToken ? "text" : "password"}
                  id="whatsapp.webhookToken"
                  name="whatsapp.webhookToken"
                  value={settings.whatsapp?.webhookToken || ""}
                  onChange={handleChange}
                  className="input w-full pl-10 pr-10"
                  placeholder="my_webhook_secret_token"
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
                Token per autenticare le richieste webhook di WhatsApp
              </p>
            </div>
            
            {/* WhatsApp Verify Token */}
            <div>
              <label htmlFor="whatsapp.verifyToken" className="block text-sm font-medium mb-1">
                WhatsApp Verify Token
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-zinc-500" />
                </div>
                <input
                  type={showToken ? "text" : "password"}
                  id="whatsapp.verifyToken"
                  name="whatsapp.verifyToken"
                  value={settings.whatsapp?.verifyToken || ""}
                  onChange={handleChange}
                  className="input w-full pl-10 pr-10"
                  placeholder="my_verify_token"
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
                Token di verifica per il setup iniziale dei webhook WhatsApp
              </p>
              <p className="text-xs text-info mt-1">
                <Info size={12} className="inline mr-1" />
                Usato una sola volta durante la configurazione del webhook URL
              </p>
            </div>
            
            {/* Google API Key */}
            <div>
              <label htmlFor="apiKeys.googleApiKey" className="block text-sm font-medium mb-1">
                Google API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-zinc-500" />
                </div>
                <input
                  type={showToken ? "text" : "password"}
                  id="apiKeys.googleApiKey"
                  name="apiKeys.googleApiKey"
                  value={settings.apiKeys?.googleApiKey || ""}
                  onChange={handleChange}
                  className="input w-full pl-10 pr-10"
                  placeholder="AIzaSyD-9tSrke72PouQMn..."
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
                Chiave API per servizi Google (Analytics, Maps, ecc.)
              </p>
            </div>
            
            {/* Webhook Callback URL */}
            <div>
              <label htmlFor="webhooks.callbackUrl" className="block text-sm font-medium mb-1">
                Webhook Callback URL
              </label>
              <input
                type="url"
                id="webhooks.callbackUrl"
                name="webhooks.callbackUrl"
                value={settings.webhooks?.callbackUrl || ""}
                onChange={handleChange}
                className="input w-full"
                placeholder="https://api.esempio.com/webhooks/callback"
              />
              <p className="mt-1 text-xs text-zinc-400">
                URL per le callback dei webhook esterni
              </p>
            </div>
            
            {/* Development Mode */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="isDevelopment"
                  name="isDevelopment"
                  checked={settings.isDevelopment || false}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="isDevelopment" className="font-medium">
                  Modalità sviluppo
                </label>
                <p className="text-zinc-400 text-xs">
                  Attiva per abilitare il debug e utilizzare ambienti di test
                </p>
              </div>
            </div>
            
            <div className="flex items-start p-3 bg-info/10 text-info rounded mb-4">
              <Info size={18} className="flex-shrink-0 mt-0.5 mr-2" />
              <p className="text-sm">
                Le impostazioni di configurazione vengono caricate all'avvio dell'applicazione
                e vengono utilizzate per la connessione al database e l'autenticazione con servizi esterni.
                <br/><br/>
                <strong>Facebook Marketing API:</strong> Per accedere ai dati delle campagne pubblicitarie sono necessari sia il token specifico per Marketing API che l'ID dell'account pubblicitario.
                <br/><br/>
                <strong>WhatsApp Business API:</strong> Per l'integrazione WhatsApp sono richiesti tutti i token specifici. Il verify token viene usato solo per la configurazione iniziale dei webhook.
              </p>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className="btn btn-primary w-full py-2 flex items-center justify-center"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvataggio...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save size={16} className="mr-2" />
                    Salva impostazioni
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}