// app/my-sites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Plus } from "lucide-react";
import { fetchUserSites } from "@/lib/api/sites"; 
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { Site } from "@/types";
import SiteCard from "@/components/sites/SiteCard";
import AddSiteModal from "@/components/sites/AddSiteModal";

export default function MySitesPage() { 
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  useEffect(() => {
    loadSites();
  }, []);
  
  const loadSites = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUserSites();
      setSites(data);
    } catch (error) {
      console.error("Error loading sites:", error);
      toast("error", "Errore", "Impossibile caricare i siti");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = () => {
    loadSites();
  };
  
  const handleAddSite = (newSite: Site) => {
    setSites([...sites, newSite]);
    setShowAddModal(false);
    toast("success", "Sito aggiunto", `${newSite.domain} è stato aggiunto con successo`);
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">I tuoi siti</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            className="btn btn-outline p-1.5"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} className="mr-1" />
            Aggiungi sito
          </button>
        </div>
      </div>
      
      {sites.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-zinc-400 mb-4">Nessun sito configurato</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} className="mr-1" />
            Aggiungi il tuo primo sito
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sites.map((site) => (
            <SiteCard key={site._id} site={site} onRefresh={loadSites} />
          ))}
        </div>
      )}
      
      {showAddModal && (
        <AddSiteModal 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddSite}
        />
      )}
    </div>
  );
}