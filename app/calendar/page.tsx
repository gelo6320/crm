// app/calendar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Menu, 
  X, List, GridIcon, Bookmark, Bell, FileText, Check } from "lucide-react";
import { fetchAppointments } from "@/lib/api/calendar";
import { CalendarEvent } from "@/types";
import CalendarView from "@/components/calendar/CalendarView";
import CalendarSidebar from "@/components/calendar/CalendarSidebar";
import AppointmentModal from "@/components/calendar/AppointmentModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "list">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAppointment, setCurrentAppointment] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      // Set view to "list" on mobile automatically
      if (isMobileDevice) {
        setView("list");
      }
      
      // Close sidebar automatically on mobile when changing to mobile view
      if (isMobileDevice && showSidebar) {
        setShowSidebar(false);
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    loadEvents();
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  useEffect(() => {
    // Filter events for the selected date
    filterEventsForSelectedDate();
  }, [selectedDate, events]);
  
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAppointments();
      setEvents(data);
      filterEventsForSelectedDate();
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterEventsForSelectedDate = () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const filtered = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= startOfDay && eventDate <= endOfDay;
    });
    
    setSelectedEvents(filtered);
    
    // Auto show sidebar if there are events and we're on mobile
    if (isMobile && filtered.length > 0 && view === "list") {
      setShowSidebar(true);
    }
  };
  
  const navigateCalendar = (direction: "prev" | "next" | "today") => {
    const newDate = new Date(selectedDate);
    
    if (direction === "prev") {
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        // In list view, navigate by day
        newDate.setDate(newDate.getDate() - 1);
      }
    } else if (direction === "next") {
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        // In list view, navigate by day
        newDate.setDate(newDate.getDate() + 1);
      }
    } else if (direction === "today") {
      return setSelectedDate(new Date());
    }
    
    setSelectedDate(newDate);
  };
  
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleNewAppointment = (start?: Date, end?: Date) => {
    const now = new Date();
    let newStart: Date;
    let newEnd: Date;
    
    if (start && end) {
      // Use provided parameters
      newStart = new Date(start);
      newEnd = new Date(end);
    } else {
      // Use default logic
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 15) * 15;
      
      now.setMinutes(roundedMinutes === 60 ? 0 : roundedMinutes);
      now.setHours(roundedMinutes === 60 ? hours + 1 : hours);
      
      // Create default appointment starting from selected date
      newStart = new Date(selectedDate);
      newStart.setHours(now.getHours(), now.getMinutes());
      
      newEnd = new Date(newStart);
      newEnd.setMinutes(newEnd.getMinutes() + 60);
    }
    
    const newAppointment: CalendarEvent = {
      id: "",
      title: "",
      start: newStart,
      end: newEnd,
      status: "pending",
      description: ""
    };
    
    setCurrentAppointment(newAppointment);
    setIsEditing(false);
  };
  
  const handleEditAppointment = (event: CalendarEvent) => {
    setCurrentAppointment(event);
    setIsEditing(true);
  };
  
  const handleSaveAppointment = async (event: CalendarEvent) => {
    try {
      // In a real app, make API call to save the appointment
      if (isEditing) {
        // Update existing event
        const updatedEvents = events.map(e => 
          e.id === event.id ? event : e
        );
        setEvents(updatedEvents);
      } else {
        // Add new event with a mock id
        const newEvent = {
          ...event,
          id: `appointment-${Date.now()}`
        };
        setEvents([...events, newEvent]);
      }
      
      setCurrentAppointment(null);
      filterEventsForSelectedDate();
    } catch (error) {
      console.error("Error saving appointment:", error);
    }
  };
  
  const handleDeleteAppointment = async (event: CalendarEvent) => {
    try {
      // In a real app, make API call to delete the appointment
      const filteredEvents = events.filter(e => e.id !== event.id);
      setEvents(filteredEvents);
      setCurrentAppointment(null);
      filterEventsForSelectedDate();
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };
  
  const formatMonthTitle = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric'
    };
    return date.toLocaleDateString('it-IT', options);
  };
  
  const formatDayTitle = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    };
    return date.toLocaleDateString('it-IT', options);
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  if (isLoading && events.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="h-[calc(100vh-60px)] sm:h-[calc(100vh-100px)] flex flex-col animate-fade-in w-full calendar-page-container no-scroll"
    style={{ WebkitTouchCallout: "none" }}
    >
      <div className="flex flex-col space-y-2 mb-2 sm:space-y-0 sm:mb-2 sm:flex-row sm:justify-end sm:items-center">
        <div className="flex items-center justify-between sm:justify-end">
          {/* Mobile navigation for list view */}
          {isMobile && (
            <div className="flex items-center bg-zinc-800 rounded-lg mr-auto">
              <button
                onClick={() => navigateCalendar("prev")}
                className="p-1.5 text-zinc-400 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              
              <button
                onClick={() => navigateCalendar("today")}
                className="px-2 py-1 text-xs font-medium"
              >
                Oggi
              </button>
              
              <button
                onClick={() => navigateCalendar("next")}
                className="p-1.5 text-zinc-400 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          
          {/* Desktop navigation controls */}
          <div className="hidden sm:flex bg-zinc-800 rounded-lg mr-4">
            <button
              onClick={() => navigateCalendar("prev")}
              className="p-2 text-zinc-400 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button
              onClick={() => navigateCalendar("today")}
              className="px-3 py-2 text-sm font-medium"
            >
              Oggi
            </button>
            
            <button
              onClick={() => navigateCalendar("next")}
              className="p-2 text-zinc-400 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          
          {/* Desktop month/year title */}
          <div className="hidden sm:block mr-4 text-lg font-medium">
            {view === "month" ? formatMonthTitle(selectedDate) : formatDayTitle(selectedDate)}
          </div>
          
          {/* Desktop view toggle */}
          <div className="hidden sm:flex bg-zinc-800 rounded-lg mr-4">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-2 text-sm font-medium ${
                view === "month" ? "bg-primary text-white rounded-lg" : ""
              }`}
            >
              Mese
            </button>
            
            <button
              onClick={() => setView("list")}
              className={`px-3 py-2 text-sm font-medium ${
                view === "list" ? "bg-primary text-white rounded-lg" : ""
              }`}
            >
              Lista
            </button>
          </div>
          
          {/* Mobile sidebar toggle */}
          {isMobile && selectedEvents.length > 0 && (
            <div className="bg-zinc-800 rounded-lg flex sm:hidden mr-2">
              <button
                onClick={toggleSidebar}
                className={`p-1.5 relative ${selectedEvents.length > 0 ? 'text-primary' : 'text-zinc-400'}`}
              >
                <Menu size={16} />
                {selectedEvents.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {selectedEvents.length}
                  </span>
                )}
              </button>
            </div>
          )}
          
          {/* Button nuovo appuntamento */}
          <button
            onClick={() => handleNewAppointment()}
            className="btn btn-primary inline-flex items-center justify-center py-1.5 px-2.5 sm:py-1.5 sm:px-3 text-xs sm:text-sm rounded-full"
          >
            <Plus size={isMobile ? 14 : 18} className="sm:mr-1" />
            <span className="hidden sm:inline">Nuovo</span>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-0 md:gap-4 flex-1 overflow-hidden relative w-full mobile-calendar-container">
        {/* Calendar View */}
        <div className={`flex-1 bg-zinc-900 md:bg-zinc-800 rounded-lg overflow-hidden min-h-[500px] ${
          isMobile && showSidebar ? 'hidden' : ''
        }`}>
          <CalendarView
            view={view}
            selectedDate={selectedDate}
            events={events}
            onSelectDate={handleSelectDate}
            onSelectEvent={handleEditAppointment}
            onCreateEvent={handleNewAppointment}
          />
        </div>
        
        {/* Sidebar with day events */}
        <div className={`
          w-full md:w-80 bg-zinc-800 rounded-lg overflow-hidden
          ${isMobile ? 'absolute inset-0 z-30' : ''}
          ${isMobile && !showSidebar ? 'hidden' : ''}
          ${isMobile && showSidebar ? 'animate-slide-in' : ''}
        `}>
          <CalendarSidebar
            selectedDate={selectedDate}
            events={selectedEvents}
            onEditEvent={handleEditAppointment}
            onDeleteEvent={handleDeleteAppointment}
            onClose={isMobile ? toggleSidebar : undefined}
          />
        </div>
      </div>
      
      {currentAppointment && (
        <AppointmentModal
          appointment={currentAppointment}
          isEditing={isEditing}
          onClose={() => setCurrentAppointment(null)}
          onSave={handleSaveAppointment}
          onDelete={handleDeleteAppointment}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}