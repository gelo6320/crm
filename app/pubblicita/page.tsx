"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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