// app/bookings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Filter, RefreshCw } from "lucide-react";
import BookingTable from "@/components/bookings/BookingTable";
import Pagination from "@/components/ui/Pagination";
import StatusFilter from "@/components/ui/StatusFilter";
import { Booking } from "@/types";
import { fetchBookings } from "@/lib/api/bookings";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EditLeadModal from "@/components/leads/EditLeadModal";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  
  useEffect(() => {
    loadBookings();
  }, [currentPage, selectedStatus]);
  
  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetchBookings(currentPage, selectedStatus);
      setBookings(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = () => {
    loadBookings();
  };
  
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };
  
  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
  };
  
  const handleViewEvents = (booking: Booking) => {
    // In a real app, this would open a modal or navigate to a details page
    console.log("View events for booking:", booking);
  };
  
  const getBookingStatusOptions = () => [
    { value: "", label: "Tutti" },
    { value: "pending", label: "In attesa" },
    { value: "confirmed", label: "Confermati" },
    { value: "completed", label: "Completati" },
    { value: "cancelled", label: "Cancellati" },
    { value: "qualified", label: "Qualificati" },
    { value: "opportunity", label: "Opportunità" },
    { value: "customer", label: "Clienti" },
    { value: "lost", label: "Persi" },
  ];
  
  if (isLoading && bookings.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Prenotazioni</h1>
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
        <BookingTable 
          bookings={bookings}
          isLoading={isLoading}
          onEditBooking={handleEditBooking}
          onViewEvents={handleViewEvents}
        />
        
        {bookings.length > 0 && (
          <div className="p-4 border-t border-zinc-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
      
      {editingBooking && (
        <EditLeadModal 
          lead={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSave={() => {
            setEditingBooking(null);
            loadBookings();
          }}
          type="booking"
        />
      )}
    </div>
  );
}