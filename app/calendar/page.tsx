// app/calendar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Menu } from "lucide-react";
import { fetchAppointments } from "@/lib/api/calendar";
import { CalendarEvent } from "@/types";
import CalendarView from "@/components/calendar/CalendarView";
import CalendarSidebar from "@/components/calendar/CalendarSidebar";
import AppointmentModal from "@/components/calendar/AppointmentModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "day" | "list">("day");
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
    if (isMobile && filtered.length > 0 && view === "day") {
      setShowSidebar(true);
    }
  };
  
  const navigateCalendar = (direction: "prev" | "next" | "today") => {
    const newDate = new Date(selectedDate);
    
    if (direction === "prev") {
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
    } else if (direction === "next") {
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    } else if (direction === "today") {
      return setSelectedDate(new Date());
    }
    
    setSelectedDate(newDate);
  };
  
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    if (view === "month") {
      setView("day");
    }
  };
  
  const handleNewAppointment = (start?: Date, end?: Date) => {
    const now = new Date();
    let newStart: Date;
    let newEnd: Date;
    
    if (start && end) {
      // Usa i parametri forniti
      newStart = new Date(start);
      newEnd = new Date(end);
    } else {
      // Usa la logica predefinita
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
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  if (isLoading && events.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="h-[calc(100vh-60px)] sm:h-[calc(100vh-100px)] flex flex-col animate-fade-in w-full">
      <div className="flex items-center justify-between mb-2 px-1 sm:px-0">
        <h1 className="text-lg font-medium flex items-center">
          <CalendarIcon className="mr-2 hidden md:inline" size={20} />
          Calendario
        </h1>
        
        <div className="flex">
          {/* Desktop navigation controls */}
          <div className="bg-zinc-800 rounded-lg hidden md:flex mr-4">
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
          
          <div className="mr-4 hidden md:block text-lg font-medium">
            {formatMonthTitle(selectedDate)}
          </div>
          
          <div className="bg-zinc-800 rounded-lg hidden md:flex mr-4">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-2 text-sm font-medium ${
                view === "month" ? "bg-primary text-white rounded-lg" : ""
              }`}
            >
              Mese
            </button>
            
            <button
              onClick={() => setView("day")}
              className={`px-3 py-2 text-sm font-medium ${
                view === "day" ? "bg-primary text-white rounded-lg" : ""
              }`}
            >
              Giorno
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
          
          {/* Mobile view toggle */}
          <div className="mr-2 bg-zinc-800 rounded-lg flex md:hidden">
            <button
              onClick={toggleSidebar}
              className={`p-2 ${selectedEvents.length > 0 ? 'text-primary' : 'text-zinc-400'}`}
            >
              <Menu size={18} />
            </button>
          </div>
          
          <button
            onClick={() => handleNewAppointment()}
            className="btn btn-primary"
          >
            <Plus size={18} className="mr-1" />
            <span className="hidden sm:inline">Nuovo</span>
          </button>
        </div>
      </div>
      
      {/* Mobile view selector */}
      <div className="flex md:hidden bg-zinc-800 rounded-lg mb-2 overflow-hidden">
        <button
          onClick={() => setView("month")}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            view === "month" ? "bg-primary text-white" : ""
          }`}
        >
          Mese
        </button>
        
        <button
          onClick={() => setView("day")}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            view === "day" ? "bg-primary text-white" : ""
          }`}
        >
          Giorno
        </button>
        
        <button
          onClick={() => setView("list")}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            view === "list" ? "bg-primary text-white" : ""
          }`}
        >
          Lista
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-0 md:gap-4 flex-1 overflow-hidden relative w-full">
        {/* Calendar View */}
        <div className={`flex-1 bg-zinc-800 md:bg-zinc-800 bg-black rounded-lg overflow-hidden min-h-[500px] ${
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
        />
      )}
    </div>
  );
}