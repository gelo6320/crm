// app/forms/page.tsx
"use client";

import { useState, useEffect } from "react";
import { FileText, Filter, RefreshCw } from "lucide-react";
import LeadTable from "@/components/leads/LeadTable";
import Pagination from "@/components/ui/Pagination";
import StatusFilter from "@/components/ui/StatusFilter";
import { Lead } from "@/types";
import { fetchForms } from "@/lib/api/forms";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function FormsPage() {
  const [forms, setForms] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    loadForms();
  }, [currentPage, selectedStatus, searchQuery]);
  
  const loadForms = async () => {
    try {
      setIsLoading(true);
      const response = await fetchForms(currentPage, selectedStatus, searchQuery);
      setForms(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = () => {
    loadForms();
  };
  
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };
  
  if (isLoading && forms.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Form di contatto</h1>
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
          leads={forms}
          type="form"
          isLoading={isLoading}
          onEditLead={(lead) => {}}
          onViewEvents={(lead) => {}}
        />
        
        {forms.length > 0 && (
          <div className="p-4 border-t border-zinc-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}