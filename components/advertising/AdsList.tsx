import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Ad } from '@/lib/api/advertising';

interface AdsListProps {
  ads: Ad[];
  selectedAdId: string | null;
  onSelectAd: (adId: string) => void;
}

export default function AdsList({ ads, selectedAdId, onSelectAd }: AdsListProps) {
  // Formatta valuta
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Ottieni la classe di stato
  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'text-emerald-400';
      case 'PAUSED':
        return 'text-amber-400';
      case 'DISABLED':
      case 'ARCHIVED':
        return 'text-zinc-400';
      default:
        return 'text-zinc-400';
    }
  };

  // Animazioni per framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div 
      className="bg-zinc-800 rounded-lg shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-zinc-700/30 text-xs text-zinc-400 font-medium p-3 border-b border-zinc-700/50">
        INSERZIONI ATTIVE
      </div>
      
      {ads.length === 0 ? (
        <div className="p-8 text-center text-zinc-500">
          <p>Nessuna inserzione attiva trovata</p>
        </div>
      ) : (
        <motion.div 
          className="divide-y divide-zinc-700/30"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {ads.map((ad) => (
            <motion.div
              key={ad.id}
              variants={itemVariants}
              className={`p-3 cursor-pointer hover:bg-zinc-700/20 transition-colors ${
                selectedAdId === ad.id ? 'bg-zinc-700/30 border-l-2 border-primary' : ''
              }`}
              onClick={() => onSelectAd(ad.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-medium text-sm">{ad.name}</div>
                  <div className="flex items-center text-xs mt-1">
                    <span className={`${getStatusClass(ad.status)}`}>
                      {ad.status}
                    </span>
                    <span className="mx-2 text-zinc-600">•</span>
                    <span className="text-zinc-400">
                      Spesa: {formatCurrency(ad.spend)}
                    </span>
                  </div>
                </div>
                <ChevronRight 
                  size={18} 
                  className={`text-zinc-500 transition-transform ${
                    selectedAdId === ad.id ? 'rotate-90 text-primary' : ''
                  }`} 
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}