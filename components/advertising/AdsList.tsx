import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
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
      <div className="bg-zinc-700/30 p-3 border-b border-zinc-700/50 flex justify-between items-center">
        <div className="text-xs text-zinc-400 font-medium">
          INSERZIONI ATTIVE ({ads.length})
        </div>
        
        {/* Ricerca inserzioni (implementazione futura) */}
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-zinc-500" />
          <input 
            type="text"
            placeholder="Cerca inserzione..."
            className="bg-zinc-800 text-xs rounded-md pl-7 pr-2 py-1 w-40 border border-zinc-700 focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      
      {ads.length === 0 ? (
        <div className="p-8 text-center text-zinc-500">
          <p>Nessuna inserzione attiva trovata</p>
        </div>
      ) : (
        <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 p-2">
          {ads.map((ad) => (
            <motion.div
              key={ad.id}
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className={`p-3 cursor-pointer hover:bg-zinc-700/20 transition-colors rounded-lg
                ${selectedAdId === ad.id ? 'bg-zinc-700/30 border-l-2 border-primary' : 'bg-zinc-800/50'}
              `}
              onClick={() => onSelectAd(ad.id)}
            >
              <div className="flex flex-col h-full">
                <div className="font-medium text-sm line-clamp-2 mb-1 flex-grow">{ad.name}</div>
                <div className="flex flex-col text-xs mt-1">
                  <span className={`${getStatusClass(ad.status)} mb-1`}>
                    {ad.status}
                  </span>
                  <span className="text-zinc-400 flex justify-between">
                    <span>Spesa:</span>
                    <span className="font-medium">{formatCurrency(ad.spend)}</span>
                  </span>
                  <span className="text-zinc-400 flex justify-between">
                    <span>Lead:</span>
                    <span className="font-medium">{ad.leads}</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}