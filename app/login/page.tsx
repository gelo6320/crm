// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { BarChart, CheckCircle, Clock, XCircle, FileText, Bookmark, Share2 } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentEventsTable from "@/components/dashboard/RecentEventsTable";
import { fetchDashboardStats, fetchRecentEvents } from "@/lib/api/dashboard";
import { Stat, Event } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Definizione dei valori predefiniti per gli stats
const defaultStats = {
  forms: { total: 0, converted: 0, conversionRate: 0 },
  bookings: { total: 0, converted: 0, conversionRate: 0 },
  events: { total: 0, success: 0, successRate: 0 },
};

export default function Dashboard() {
  // Inizializza con i valori predefiniti
  const [stats, setStats] = useState(defaultStats);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Carica prima le statistiche della dashboard
        const statsData = await fetchDashboardStats();
        
        // Verifica che i dati abbiano la struttura attesa
        if (!statsData || !statsData.forms || !statsData.bookings || !statsData.events) {
          console.error("Invalid stats data structure:", statsData);
          // Imposta i valori predefiniti se la struttura è invalida
          setStats(defaultStats);
        } else {
          setStats(statsData);
        }
        
        // Carica gli eventi recenti
        const eventsData = await fetchRecentEvents();
        setRecentEvents(Array.isArray(eventsData) ? eventsData : []);
        
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Impossibile caricare i dati della dashboard. Riprova più tardi.");
        // Imposta i valori predefiniti in caso di errore
        setStats(defaultStats);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="alert alert-danger">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Form di contatto"
          icon={<FileText size={18} className="text-primary" />}
          value={stats?.forms?.total ?? 0}
          rate={`${stats?.forms?.conversionRate ?? 0}%`}
          href="/forms"
          color="primary"
        />
        
        <StatCard 
          title="Prenotazioni"
          icon={<Bookmark size={18} className="text-success" />}
          value={stats?.bookings?.total ?? 0}
          rate={`${stats?.bookings?.conversionRate ?? 0}%`}
          href="/bookings"
          color="success"
        />
        
        <StatCard 
          title="Eventi Facebook"
          icon={<Share2 size={18} className="text-info" />}
          value={stats?.events?.total ?? 0}
          rate={`${stats?.events?.successRate ?? 0}%`}
          href="/events"
          color="info"
        />
      </div>
      
      {/* Recent events */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-sm font-semibold">Ultimi eventi CRM inviati a Facebook</h2>
          <button 
            className="btn btn-outline p-1.5"
            onClick={() => {
              setIsLoading(true);
              fetchRecentEvents()
                .then(data => setRecentEvents(Array.isArray(data) ? data : []))
                .catch(err => console.error("Error refreshing events:", err))
                .finally(() => setIsLoading(false));
            }}
          >
            <Clock size={16} />
          </button>
        </div>
        <div className="p-4">
          {recentEvents.length > 0 ? (
            <RecentEventsTable events={recentEvents} />
          ) : (
            <div className="text-center py-4 text-zinc-500">
              Nessun evento recente trovato
            </div>
          )}
        </div>
      </div>
    </div>
  );
}