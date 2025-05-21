"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Facebook, RefreshCw } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdsList from "@/components/advertising/AdsList";
import AdDetails from "@/components/advertising/AdDetails";
import { fetchActiveAds, Ad } from "@/lib/api/advertising";

export default function AdvertisingPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      setIsLoading(true);
      const adsData = await fetchActiveAds();
      setAds(adsData);
      
      // Seleziona la prima inserzione di default se c'è
      if (adsData.length > 0 && !selectedAdId) {
        setSelectedAdId(adsData[0].id);
      }
    } catch (error) {
      console.error("Errore durante il caricamento delle inserzioni:", error);
      // Mostra un messaggio di errore all'utente
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAd = ads.find(ad => ad.id === selectedAdId) || null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-full p-2 sm:p-4 space-y-3 sm:space-y-4">
      {/* Header con titolo e pulsante di aggiornamento */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="p-2 mr-3 rounded-full bg-primary/10">
            <Facebook size={20} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Pubblicità</h1>
        </div>
        <motion.button 
          onClick={loadAds}
          className="btn flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 hover:border-primary hover:bg-primary/10 text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Aggiorna dati"
        >
          <RefreshCw size={16} />
          Aggiorna
        </motion.button>
      </div>
      
      {/* Lista inserzioni (full width) */}
      <div className="w-full">
        <AdsList 
          ads={ads} 
          selectedAdId={selectedAdId} 
          onSelectAd={(adId) => setSelectedAdId(adId)} 
        />
      </div>
      
      {/* Container dettagli (anteprima + statistiche) */}
      {selectedAd && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Visualizzazione mobile: prima anteprima poi statistiche */}
          <div className="lg:hidden w-full space-y-4">
            <AdDetails 
              ad={selectedAd}
              layout="mobile" 
            />
          </div>
          
          {/* Visualizzazione desktop: statistiche a sx, anteprima a dx */}
          <div className="hidden lg:block lg:col-span-1">
            <AdDetails 
              ad={selectedAd}
              layout="stats-only"
            />
          </div>
          
          <div className="hidden lg:block lg:col-span-2">
            <AdDetails 
              ad={selectedAd}
              layout="preview-only"
            />
          </div>
        </div>
      )}
      
      {/* Messaggio se nessuna inserzione selezionata */}
      {!selectedAd && (
        <motion.div 
          className="bg-zinc-800 rounded-lg p-6 flex items-center justify-center text-zinc-400 h-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Seleziona un'inserzione per visualizzare i dettagli
        </motion.div>
      )}
    </div>
  );
}