// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { BarChart, CheckCircle, Clock, XCircle, FileText, Bookmark, Share2 } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentEventsTable from "@/components/dashboard/RecentEventsTable";
import { fetchDashboardStats, fetchRecentEvents } from "@/lib/api/dashboard";
import { Stat, Event } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Dashboard() {
  const [stats, setStats] = useState<{
    forms: Stat;
    bookings: Stat;
    events: Stat;
  }>({
    forms: { total: 0, converted: 0, conversionRate: 0 },
    bookings: { total: 0, converted: 0, conversionRate: 0 },
    events: { total: 0, success: 0, successRate: 0 },
  });
  
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [statsData, eventsData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentEvents()
        ]);
        
        setStats(statsData);
        setRecentEvents(eventsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
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
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Form di contatto"
          icon={<FileText size={18} className="text-primary" />}
          value={stats.forms.total}
          rate={`${stats.forms.conversionRate}%`}
          href="/forms"
          color="primary"
        />
        
        <StatCard 
          title="Prenotazioni"
          icon={<Bookmark size={18} className="text-success" />}
          value={stats.bookings.total}
          rate={`${stats.bookings.conversionRate}%`}
          href="/bookings"
          color="success"
        />
        
        <StatCard 
          title="Eventi Facebook"
          icon={<Share2 size={18} className="text-info" />}
          value={stats.events.total}
          rate={`${stats.events.successRate}%`}
          href="/events"
          color="info"
        />
      </div>
      
      {/* Recent events */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-sm font-semibold">Ultimi eventi CRM inviati a Facebook</h2>
          <button className="btn btn-outline p-1.5">
            <Clock size={16} />
          </button>
        </div>
        <div className="p-4">
          <RecentEventsTable events={recentEvents} />
        </div>
      </div>
    </div>
  );
}