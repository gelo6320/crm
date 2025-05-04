// app/events/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Filter, RefreshCw, Share2 } from "lucide-react";
import EventsTable from "@/components/events/EventsTable";
import Pagination from "@/components/ui/Pagination";
import { Event } from "@/types";
import { fetchEvents } from "@/lib/api/events";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EventDetailsModal from "@/components/events/EventDetailsModal";

interface StatusFilterProps {
  selectedStatus: string;
  onChange: (status: string) => void;
}

function SuccessFilter({ selectedStatus, onChange }: StatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const options = [
    { value: "", label: "Tutti" },
    { value: "true", label: "Successo" },
    { value: "false", label: "Errore" },
  ];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline flex items-center space-x-1 px-2 py-1.5"
      >
        <Filter size={16} />
        <span className="hidden sm:block">Filtra</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-zinc-800 border border-zinc-700 z-10 animate-fade-in">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm ${
                  selectedStatus === option.value
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-zinc-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  useEffect(() => {
    loadEvents();
  }, [currentPage, selectedStatus, searchQuery]);
  
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetchEvents(currentPage, selectedStatus, searchQuery);
      setEvents(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = () => {
    loadEvents();
  };
  
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };
  
  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
  };
  
  const handleRetryEvent = async () => {
    if (!selectedEvent) return;
    
    setIsRetrying(true);
    
    try {
      // In a real app, make API call to retry sending the event
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update event in the list (mark as success)
      const updatedEvents = events.map(event =>
        event._id === selectedEvent._id
          ? { ...event, success: true }
          : event
      );
      
      setEvents(updatedEvents);
      setSelectedEvent(null);
      
      // Show success toast
      // toast.success("Evento re-inviato con successo");
    } catch (error) {
      console.error("Error retrying event:", error);
      // toast.error("Impossibile re-inviare l'evento");
    } finally {
      setIsRetrying(false);
    }
  };
  
  if (isLoading && events.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            className="btn btn-outline p-1.5"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          
          <SuccessFilter
            selectedStatus={selectedStatus}
            onChange={handleStatusFilter}
          />
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <EventsTable 
          events={events}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
        />
        
        {events.length > 0 && (
          <div className="p-4 border-t border-zinc-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
      
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isRetrying={isRetrying}
          onClose={() => setSelectedEvent(null)}
          onRetry={handleRetryEvent}
        />
      )}
    </div>
  );
}