import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, MousePointer, Globe, Eye, BarChart, FileBarChart } from 'lucide-react';
import { Ad, fetchAdPreview } from '@/lib/api/advertising';

interface AdDetailsProps {
  ad: Ad;
  layout?: 'full' | 'mobile' | 'stats-only' | 'preview-only';
}

export default function AdDetails({ ad, layout = 'full' }: AdDetailsProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carica l'anteprima solo se necessario in base al layout
    if (layout === 'full' || layout === 'mobile' || layout === 'preview-only') {
      const loadPreview = async () => {
        try {
          setIsLoading(true);
          const html = await fetchAdPreview(ad.id);
          // Pulisci l'HTML rimuovendo script e popup problematici
          const cleanedHtml = cleanPreviewHtml(html);
          setPreviewHtml(cleanedHtml);
        } catch (error) {
          console.error('Errore nel caricamento dell\'anteprima:', error);
          setPreviewHtml('<div class="text-center p-6 text-red-500">Impossibile caricare l\'anteprima. Verifica la configurazione di Facebook.</div>');
        } finally {
          setIsLoading(false);
        }
      };
      loadPreview();
    }
  }, [ad.id, layout]);

  // Funzione per pulire l'HTML dell'anteprima
  const cleanPreviewHtml = (html: string): string => {
    // Rimuovi script tags per evitare popup JavaScript
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Rimuovi elementi che potrebbero causare popup di cookie
    cleaned = cleaned.replace(/data-cookiebanner="[^"]*"/gi, '');
    cleaned = cleaned.replace(/class="[^"]*cookie[^"]*"/gi, '');
    
    // Rimuovi attributi onclick e altri event handler
    cleaned = cleaned.replace(/on\w+="[^"]*"/gi, '');
    
    return cleaned;
  };

  // Formatta valuta
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Formatta numeri con separatore delle migliaia
  const formatNumber = (value: number) => {
    return value.toLocaleString('it-IT');
  };

  // Metriche da visualizzare
  const metrics = [
    { icon: DollarSign, label: 'Spesa', value: formatCurrency(ad.spend) },
    { icon: Users, label: 'Lead', value: formatNumber(ad.leads) },
    { icon: DollarSign, label: 'Costo per Lead', value: formatCurrency(ad.costPerLead) },
    { icon: MousePointer, label: 'Click', value: formatNumber(ad.clicks) },
    { icon: DollarSign, label: 'Costo per Click', value: formatCurrency(ad.costPerClick) },
    { icon: Globe, label: 'Copertura', value: formatNumber(ad.reach) },
    { icon: Eye, label: 'Impressioni', value: formatNumber(ad.impressions) },
    { icon: BarChart, label: 'CPM', value: formatCurrency(ad.cpm) }
  ];

  // Renderizza solo le statistiche
  const renderStats = () => {
    return (
      <motion.div 
        className={`bg-zinc-800 rounded-lg p-3 sm:p-4 ${layout === 'mobile' ? 'mt-4' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-base font-semibold mb-3 flex items-center">
          <BarChart size={18} className="mr-2 text-primary" />
          Statistiche
        </h2>
        
        <div className={`grid ${layout === 'mobile' ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-3'}`}>
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const isMobile = layout === 'mobile';
            
            return (
              <motion.div 
                key={metric.label}
                className={`bg-zinc-800/70 ${isMobile ? 'p-2' : 'p-3'} rounded-lg border border-zinc-700/50`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              >
                <div className="flex items-center mb-1">
                  <div className={`rounded-full ${isMobile ? 'p-1.5' : 'p-2'} bg-zinc-700/70 mr-2`}>
                    <Icon size={isMobile ? 12 : 16} className="text-primary" />
                  </div>
                  <div className={`text-xs text-zinc-400 ${isMobile ? 'text-xs' : ''}`}>{metric.label}</div>
                </div>
                <div className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold`}>{metric.value}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Renderizza solo l'anteprima
  const renderPreview = () => {
    return (
      <motion.div 
        className="bg-zinc-800 rounded-lg overflow-hidden h-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-zinc-700/30 text-xs text-zinc-400 font-medium p-3 border-b border-zinc-700/50 flex items-center justify-between">
          <div className="flex items-center">
            <FileBarChart size={16} className="mr-2 text-primary" />
            ANTEPRIMA INSERZIONE
          </div>
          <div className="text-xs">{ad.name}</div>
        </div>
        
        <div className="p-3">
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
            </div>
          ) : (
            <div className="relative">
              <div 
                className="preview-container rounded bg-white overflow-hidden w-full relative"
                style={{ 
                  height: layout === 'mobile' ? '400px' : '600px',
                  // Importante: contieni tutto all'interno
                  position: 'relative',
                  isolation: 'isolate'
                }}
              >
                {/* Iframe per isolare il contenuto (opzione alternativa) */}
                {/* 
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                  style={{ backgroundColor: 'white' }}
                />
                */}
                
                {/* Versione con HTML pulito */}
                <div 
                  className="w-full h-full overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  style={{
                    // Nascondi overflow per evitare che popup escano dal container
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                />
                
                {/* Overlay per bloccare interazioni problematiche */}
                <div 
                  className="absolute inset-0 bg-transparent pointer-events-none"
                  style={{ zIndex: 999 }}
                />
              </div>
              
              {/* CSS personalizzato per nascondere popup di Facebook */}
              <style jsx>{`
                .preview-container {
                  /* Nascondi elementi di cookie/popup di Facebook */
                }
                .preview-container [data-cookiebanner],
                .preview-container [class*="cookie"],
                .preview-container [class*="Cookie"],
                .preview-container [class*="modal"],
                .preview-container [class*="popup"],
                .preview-container [class*="overlay"] {
                  display: none !important;
                  visibility: hidden !important;
                  opacity: 0 !important;
                  position: absolute !important;
                  left: -9999px !important;
                }
                
                /* Assicurati che il contenuto rimanga nel container */
                .preview-container * {
                  max-width: 100% !important;
                  max-height: 100% !important;
                  position: relative !important;
                }
                
                /* Nascondi eventuali elementi fixed/absolute che potrebbero uscire */
                .preview-container [style*="position: fixed"],
                .preview-container [style*="position: absolute"] {
                  position: relative !important;
                }
              `}</style>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Layout mobile: prima anteprima, poi statistiche
  if (layout === 'mobile') {
    return (
      <div className="space-y-3">
        {/* Header con nome inserzione */}
        <motion.div 
          className="bg-zinc-800 rounded-lg p-3"
          initial={{ y: -10 }}
          animate={{ y: 0 }}
        >
          <h2 className="text-base font-semibold">{ad.name}</h2>
          <div className="text-xs text-zinc-400">ID: {ad.id}</div>
        </motion.div>
        
        {renderPreview()}
        {renderStats()}
      </div>
    );
  }
  
  // Solo statistiche (per layout desktop)
  if (layout === 'stats-only') {
    return (
      <div className="space-y-3">
        {/* Header con nome inserzione */}
        <motion.div 
          className="bg-zinc-800 rounded-lg p-3"
          initial={{ y: -10 }}
          animate={{ y: 0 }}
        >
          <h2 className="text-base font-semibold">{ad.name}</h2>
          <div className="text-xs text-zinc-400">ID: {ad.id}</div>
        </motion.div>
        
        {renderStats()}
      </div>
    );
  }
  
  // Solo anteprima (per layout desktop)
  if (layout === 'preview-only') {
    return renderPreview();
  }
  
  // Layout completo predefinito
  return (
    <div className="space-y-4">
      {/* Header con nome inserzione */}
      <motion.div 
        className="bg-zinc-800 rounded-lg p-4"
        initial={{ y: -10 }}
        animate={{ y: 0 }}
      >
        <h2 className="text-lg font-semibold">{ad.name}</h2>
        <div className="text-sm text-zinc-400">ID: {ad.id}</div>
      </motion.div>
      
      {/* Griglia delle metriche */}
      {renderStats()}
      
      {/* Anteprima inserzione */}
      {renderPreview()}
    </div>
  );
}