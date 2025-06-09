// app/settings/page.tsx - Versione con stile Apple-like
"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, Database, Key, MessageCircle, User, Building, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SmoothCorners } from 'react-smooth-corners';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ImageUpload from "@/components/ui/ImageUpload";
import { fetchUserSettings, saveUserSettings, UserSettings } from "@/lib/api/settings";
import { toast } from "@/components/ui/toaster";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    name: "",
    company: "",
    companyLogo: "",
    mongoDbUri: "",
    apiKeys: {
      facebookAccessToken: "",
      facebookMarketingToken: "",
      googleApiKey: "",
      facebookPixelId: "",
      facebookAccountId: ""
    },
    whatsapp: {
      accessToken: "",
      phoneNumberId: "",
      webhookToken: "",
      verifyToken: ""
    },
    webhooks: {
      callbackUrl: ""
    },
    isDevelopment: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
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
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
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
      if (name === 'mongoDbUri') {
        setSettings(prev => ({ ...prev, mongoDbUri: value }));
      } else if (name === 'isDevelopment') {
        setSettings(prev => ({ ...prev, isDevelopment: checked || false }));
      } else if (name === 'name') {
        setSettings(prev => ({ ...prev, name: value }));
      } else if (name === 'company') {
        setSettings(prev => ({ ...prev, company: value }));
      }
    }
  };

  const handleLogoChange = (logo: string) => {
    setSettings(prev => ({ ...prev, companyLogo: logo }));
  };

  const handleLogoRemove = () => {
    setSettings(prev => ({ ...prev, companyLogo: "" }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const result = await saveUserSettings(settings);
      
      if (result.success) {
        setSaveSuccess(true);
        toast("success", "Impostazioni salvate", "Le impostazioni sono state salvate con successo");
        
        // Reset success state after 2 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 2000);
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
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <motion.div 
        className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="mb-8">
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Impostazioni Sistema
          </motion.h1>
          <motion.p 
            className="text-zinc-600 dark:text-zinc-400"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Configura le tue preferenze e le integrazioni API
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sezione Profilo */}
          <motion.div 
            className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm backdrop-saturate-150 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <SmoothCorners corners="2" borderRadius="16" />
            
            <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-700/30">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center">
                <User size={20} className="mr-3 text-blue-600" />
                Informazioni Personali e Aziendali
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nome
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={settings.name || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Il tuo nome"
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Nome che apparirà nel messaggio di benvenuto della dashboard
                </p>
              </div>

              {/* Nome Azienda */}
              <div className="space-y-2">
                <label htmlFor="company" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nome Azienda
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={settings.company || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nome della tua azienda"
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Nome dell'azienda (opzionale)
                </p>
              </div>

              {/* Logo Aziendale */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Logo Aziendale
                </label>
                
                <ImageUpload
                  value={settings.companyLogo}
                  onChange={handleLogoChange}
                  onRemove={handleLogoRemove}
                  maxSize={5}
                  placeholder="Trascina qui il logo aziendale o clicca per selezionare"
                  className="mb-2"
                />
                
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Logo che apparirà nella dashboard (formato quadrato consigliato, max 5MB)
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Sezione Database */}
          <motion.div 
            className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm backdrop-saturate-150 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <SmoothCorners corners="2" borderRadius="16" />
            
            <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-700/30">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center">
                <Database size={20} className="mr-3 text-green-600" />
                Configurazione Database
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-2">
                <label htmlFor="mongoDbUri" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  MongoDB URI
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Database size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type={showToken ? "text" : "password"}
                    id="mongoDbUri"
                    name="mongoDbUri"
                    value={settings.mongoDbUri || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="mongodb://username:password@localhost:27017/database"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  URI di connessione al database MongoDB
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Sezione Facebook */}
          <motion.div 
            className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm backdrop-saturate-150 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <SmoothCorners corners="2" borderRadius="16" />
            
            <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-700/30">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 287.56 191">
                  <path fill="#0081fb" d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z"/>
                </svg>
                Configurazione Facebook
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Facebook Conversion API Token */}
              <div className="space-y-2">
                <label htmlFor="apiKeys.facebookAccessToken" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Facebook Conversion API Token (CAPI)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type={showToken ? "text" : "password"}
                    id="apiKeys.facebookAccessToken"
                    name="apiKeys.facebookAccessToken"
                    value={settings.apiKeys?.facebookAccessToken || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="EAABiLT7R4n8BAHDpZBs6jc..."
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Token di accesso a Facebook Conversion API (per tracking conversioni)
                </p>
              </div>
              
              {/* Facebook Marketing API Token */}
              <div className="space-y-2">
                <label htmlFor="apiKeys.facebookMarketingToken" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Facebook Marketing API Token
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type={showToken ? "text" : "password"}
                    id="apiKeys.facebookMarketingToken"
                    name="apiKeys.facebookMarketingToken"
                    value={settings.apiKeys?.facebookMarketingToken || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="EAABiLT7R4n8BAHDpZBs6jc..."
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Token di accesso a Facebook Marketing API (per dati campagne)
                </p>
              </div>
              
              {/* Facebook Account ID */}
              <div className="space-y-2">
                <label htmlFor="apiKeys.facebookAccountId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Facebook Account ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    id="apiKeys.facebookAccountId"
                    name="apiKeys.facebookAccountId"
                    value={settings.apiKeys?.facebookAccountId || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="123456789012345"
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  ID dell'account pubblicitario di Facebook (senza il prefisso 'act_')
                </p>
              </div>
              
              {/* Facebook Pixel ID */}
              <div className="space-y-2">
                <label htmlFor="apiKeys.facebookPixelId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Facebook Pixel ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    id="apiKeys.facebookPixelId"
                    name="apiKeys.facebookPixelId"
                    value={settings.apiKeys?.facebookPixelId || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="123456789012345"
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  ID del Pixel Facebook
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Sezione WhatsApp */}
          <motion.div 
            className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm backdrop-saturate-150 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <SmoothCorners corners="2" borderRadius="16" />
            
            <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-700/30">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center">
                <MessageCircle size={20} className="mr-3 text-green-600" />
                Configurazione WhatsApp Business API
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* WhatsApp Access Token */}
              <div className="space-y-2">
                <label htmlFor="whatsapp.accessToken" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  WhatsApp Access Token
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type={showToken ? "text" : "password"}
                    id="whatsapp.accessToken"
                    name="whatsapp.accessToken"
                    value={settings.whatsapp?.accessToken || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="EAABZXHxxX..."
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Token di accesso per WhatsApp Business API (gestione messaggi)
                </p>
              </div>
              
              {/* WhatsApp Phone Number ID */}
              <div className="space-y-2">
                <label htmlFor="whatsapp.phoneNumberId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  WhatsApp Phone Number ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MessageCircle size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    id="whatsapp.phoneNumberId"
                    name="whatsapp.phoneNumberId"
                    value={settings.whatsapp?.phoneNumberId || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="123456789012345"
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  ID del numero di telefono WhatsApp Business registrato
                </p>
              </div>
              
              {/* Altri campi WhatsApp */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="whatsapp.webhookToken" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Webhook Token
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={16} className="text-zinc-400" />
                    </div>
                    <input
                      type={showToken ? "text" : "password"}
                      id="whatsapp.webhookToken"
                      name="whatsapp.webhookToken"
                      value={settings.whatsapp?.webhookToken || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="my_webhook_secret_token"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="whatsapp.verifyToken" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Verify Token
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={16} className="text-zinc-400" />
                    </div>
                    <input
                      type={showToken ? "text" : "password"}
                      id="whatsapp.verifyToken"
                      name="whatsapp.verifyToken"
                      value={settings.whatsapp?.verifyToken || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="my_verify_token"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sezione Altre Configurazioni */}
          <motion.div 
            className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm backdrop-saturate-150 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <SmoothCorners corners="2" borderRadius="16" />
            
            <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-700/30">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center">
                <Key size={20} className="mr-3 text-purple-600" />
                Altre Configurazioni
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Google API Key */}
              <div className="space-y-2">
                <label htmlFor="apiKeys.googleApiKey" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Google API Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-zinc-400" />
                  </div>
                  <input
                    type={showToken ? "text" : "password"}
                    id="apiKeys.googleApiKey"
                    name="apiKeys.googleApiKey"
                    value={settings.apiKeys?.googleApiKey || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="AIzaSyD-9tSrke72PouQMn..."
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Chiave API per servizi Google (Analytics, Maps, ecc.)
                </p>
              </div>
              
              {/* Webhook Callback URL */}
              <div className="space-y-2">
                <label htmlFor="webhooks.callbackUrl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Webhook Callback URL
                </label>
                <input
                  type="url"
                  id="webhooks.callbackUrl"
                  name="webhooks.callbackUrl"
                  value={settings.webhooks?.callbackUrl || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="https://api.esempio.com/webhooks/callback"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  URL per le callback dei webhook esterni
                </p>
              </div>
              
              {/* Development Mode */}
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    id="isDevelopment"
                    name="isDevelopment"
                    checked={settings.isDevelopment || false}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="isDevelopment" className="font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    Modalità sviluppo
                  </label>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                    Attiva per abilitare il debug e utilizzare ambienti di test
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Pulsante Salva */}
          <motion.div 
            className="pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait">
                {isSaving ? (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2"
                  >
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Salvataggio...</span>
                  </motion.div>
                ) : saveSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2"
                  >
                    <Check size={20} />
                    <span>Salvato!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="save"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2"
                  >
                    <Save size={20} />
                    <span>Salva impostazioni</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}