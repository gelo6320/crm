// app/sales-funnel/page.tsx
"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import CustomFunnelBoard from "@/components/sales-funnel/FunnelBoard";
import FunnelStats from "@/components/sales-funnel/FunnelStats";
import { FunnelData, FunnelStats as FunnelStatsType } from "@/types";
import { fetchFunnelData } from "@/lib/api/funnel";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DeviceDetectionInitializer from "@/app/_device";

export default function SalesFunnelPage() {
  const [funnelData, setFunnelData] = useState<FunnelData>({
    new: [],
    contacted: [],
    qualified: [],
    opportunity: [],
    proposal: [],
    customer: [],
    lost: [],
  });
  
  const [funnelStats, setFunnelStats] = useState<FunnelStatsType>({
    totalLeads: 0,
    conversionRate: 0,
    potentialValue: 0,
    realizedValue: 0,
    lostValue: 0,
    serviceDistribution: {},
    conversionRateTrend: undefined,
    realizedValueTrend: undefined
  });

  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);

  
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leadId = params.get('id');
    
    if (leadId && !isLoading && Object.keys(funnelData).length > 0) {
      // Cerca la lead in tutte le colonne del funnel
      let foundLead = false;
      let columnId = '';
      
      // Itera su tutte le colonne del funnel
      for (const column in funnelData) {
        const foundLeadInColumn = funnelData[column].find(
          (lead) => lead._id === leadId || lead.leadId === leadId
        );
        
        if (foundLeadInColumn) {
          foundLead = true;
          columnId = column;
          break;
        }
      }
      
      if (foundLead) {
        // Imposta l'ID della lead evidenziata
        setHighlightedLeadId(leadId);
        
        // Trova e scorri all'elemento dopo un breve ritardo 
        // per permettere al DOM di renderizzare
        setTimeout(() => {
          // Il formato dell'ID nel dnd-kit è "lead-ID:COLUMN"
          const elementId = `lead-${leadId}:${columnId}`;
          const element = document.getElementById(elementId);
          
          if (element) {
            // Scorri alla colonna
            const columnElement = document.querySelector(`[data-column-id="${columnId}"]`);
            if (columnElement) {
              columnElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            // Poi scorri all'elemento specifico
            setTimeout(() => {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Aggiungi una classe di evidenziazione temporanea
              element.classList.add('bg-primary/10');
              element.classList.add('ring-2');
              element.classList.add('ring-primary');
              element.classList.add('z-10');
              
              // Rimuovi l'evidenziazione dopo 3 secondi
              setTimeout(() => {
                element.classList.remove('bg-primary/10');
                element.classList.remove('ring-2');
                element.classList.remove('ring-primary');
                element.classList.remove('z-10');
                setHighlightedLeadId(null);
                
                // Pulisci i parametri URL
                if (window.history.replaceState) {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('id');
                  window.history.replaceState({}, document.title, url.toString());
                }
              }, 3000);
            }, 300);
          } else {
            // Se l'elemento non è stato trovato, pulisci comunque l'URL
            if (window.history.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('id');
              window.history.replaceState({}, document.title, url.toString());
            }
            setHighlightedLeadId(null);
          }
        }, 500);
      } else {
        // Se la lead non è stata trovata nei dati attuali, pulisci l'URL
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('id');
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    }
  }, [funnelData, isLoading]);
  
  useEffect(() => {
    loadFunnelData();
  }, []);
  
  // app/sales-funnel/page.tsx (continuazione)
  const loadFunnelData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchFunnelData();
      setFunnelData(data.funnelData);
      setFunnelStats(data.funnelStats);
    } catch (error) {
      console.error("Error loading funnel data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <>
      {/* Device detection per migliorare l'esperienza mobile */}
      <DeviceDetectionInitializer />
      
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-end">
          <button 
            onClick={loadFunnelData}
            className="btn btn-outline p-1.5"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="w-full shrink-0">
            <FunnelStats stats={funnelStats} />
          </div>
          <div className="flex-1 overflow-hidden">
          <CustomFunnelBoard 
            funnelData={funnelData} 
            setFunnelData={setFunnelData} 
            onLeadMove={loadFunnelData}
            highlightedLeadId={highlightedLeadId}
          />
          </div>
        </div>
      </div>
    </>
  );
}