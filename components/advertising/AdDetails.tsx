import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, MousePointer, Globe, Eye, BarChart, FileBarChart } from 'lucide-react';
import { Ad, fetchAdPreview } from '@/lib/api/advertising';

interface AdDetailsProps {
  ad: Ad;
}

export default function AdDetails({ ad }: AdDetailsProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setIsLoading(true);
        const html = await fetchAdPreview(ad.id);
        setPreviewHtml(html);
      } catch (error) {
        console.error('Errore nel caricamento dell\'anteprima:', error);
        setPreviewHtml('<div class="text-center p-6 text-red-500">Impossibile caricare l\'anteprima. Verifica la configurazione di Facebook.</div>');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [ad.id]);

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

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div 
              key={metric.label}
              className="bg-zinc-800 rounded-lg p-4 flex flex-col"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <div className="flex items-center mb-2">
                <div className="rounded-full p-2 bg-zinc-700/70 mr-2">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="text-xs text-zinc-400">{metric.label}</div>
              </div>
              <div className="text-lg font-semibold">{metric.value}</div>
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Anteprima inserzione */}
      <motion.div 
        className="bg-zinc-800 rounded-lg overflow-hidden"
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-zinc-700/30 text-xs text-zinc-400 font-medium p-3 border-b border-zinc-700/50 flex items-center">
          <FileBarChart size={16} className="mr-2 text-primary" />
          ANTEPRIMA INSERZIONE
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
            </div>
          ) : (
            <div 
              className="preview-container h-[600px] rounded bg-white overflow-hidden"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}