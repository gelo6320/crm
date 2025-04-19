// app/facebook-leads/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Facebook, Filter, RefreshCw } from "lucide-react";
import LeadTable from "@/components/leads/LeadTable";
import Pagination from "@/components/ui/Pagination";
import StatusFilter from "@/components/ui/StatusFilter";
import { Lead } from "@/types";
import { fetchFacebookLeads } from "@/lib/api/facebook-leads";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EditLeadModal from "@/components/leads/EditLeadModal";

export default function FacebookLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  useEffect(() => {
    loadLeads();
  }, [currentPage, selectedStatus, searchQuery]);
  
  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const response = await fetchFacebookLeads(currentPage, selectedStatus, searchQuery);
      setLeads(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error("Error loading Facebook leads:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = () => {
    loadLeads();
  };
  
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };
  
  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
  };
  
  const handleViewDetails = (lead: Lead) => {
    // In a real app, this would open a modal or navigate to a details page
    console.log("View details for lead:", lead);
  };
  
  if (isLoading && leads.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Lead Facebook</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            className="btn btn-outline p-1.5"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          
          <StatusFilter
            selectedStatus={selectedStatus}
            onChange={handleStatusFilter}
            icon={<Filter size={16} />}
          />
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <LeadTable 
          leads={leads}
          type="facebook"
          isLoading={isLoading}
          onEditLead={handleEditLead}
          onViewEvents={handleViewDetails}
        />
        
        {leads.length > 0 && (
          <div className="p-4 border-t border-zinc-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
      
      {editingLead && (
        <EditLeadModal 
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSave={() => {
            setEditingLead(null);
            loadLeads();
          }}
          type="facebook"
        />
      )}
    </div>
  );
}