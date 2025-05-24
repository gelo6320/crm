// app/calendar/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Calendar as CalendarIcon, Plus, Menu, X, Clock, MapPin, 
  Bell, Bookmark, Filter, Download, Upload, Search,
  ChevronLeft, ChevronRight, Grid3X3, CalendarDays, 
  CalendarRange, List, PanelLeftClose, PanelLeft
} from "lucide-react";
import FullCalendar from '@fullcalendar/react';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventResizeDoneArg } from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/api/calendar";
import { CalendarEvent } from "@/types";
import EventModal from "@/components/calendar/EventModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CalendarSidebar from "@/components/calendar/CalendarSidebar";
import ExternalEventsPanel from "@/components/calendar/ExternalEventsPanel";
import { toast } from "react-hot-toast";
import itLocale from '@fullcalendar/core/locales/it';
import { formatDate, formatTime } from "@/lib/utils/date";
import { getEventColor } from "@/lib/utils/calendar";

// Custom CSS for FullCalendar dark theme
const calendarStyles = `
  /* Base styles */
  .fc {
    --fc-border-color: #27272a;
    --fc-button-bg-color: #3f3f46;
    --fc-button-border-color: transparent;
    --fc-button-hover-bg-color: #52525b;
    --fc-button-hover-border-color: transparent;
    --fc-button-active-bg-color: #2563eb;
    --fc-button-active-border-color: transparent;
    --fc-neutral-bg-color: #18181b;
    --fc-page-bg-color: #09090b;
    --fc-neutral-text-color: #e4e4e7;
    --fc-today-bg-color: rgba(37, 99, 235, 0.1);
    --fc-now-indicator-color: #2563eb;
    --fc-event-border-color: transparent;
  }

  /* Typography */
  .fc {
    font-family: inherit;
    font-size: 0.875rem;
    color: var(--fc-neutral-text-color);
  }

  /* Toolbar styling */
  .fc .fc-toolbar {
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .fc .fc-toolbar-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f4f4f5;
    text-transform: capitalize;
  }

  /* Button styling */
  .fc .fc-button {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.375rem 1rem;
    text-transform: capitalize;
    transition: all 0.2s;
    border-radius: 0.5rem;
  }

  .fc .fc-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background-color: var(--fc-button-active-bg-color);
    color: white;
  }

  /* View specific styles */
  .fc .fc-view-harness {
    background: var(--fc-neutral-bg-color);
    border-radius: 0.75rem;
    padding: 0.75rem;
  }

  /* Table headers */
  .fc .fc-col-header-cell {
    font-weight: 600;
    padding: 0.75rem 0;
    background: rgba(24, 24, 27, 0.5);
  }

  .fc .fc-col-header-cell-cushion {
    color: #a1a1aa;
    text-decoration: none;
  }

  /* Day cells */
  .fc .fc-daygrid-day {
    transition: background-color 0.2s;
  }

  .fc .fc-daygrid-day:hover {
    background-color: rgba(63, 63, 70, 0.3);
  }

  .fc .fc-daygrid-day-number {
    color: #e4e4e7;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem;
  }

  .fc .fc-day-today {
    background-color: var(--fc-today-bg-color) !important;
  }

  .fc .fc-day-today .fc-daygrid-day-number {
    background-color: #2563eb;
    color: white;
    border-radius: 9999px;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0.25rem;
  }

  /* Events */
  .fc-event {
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none !important;
  }

  .fc-event:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .fc-event-main {
    color: white;
  }

  .fc-event-title {
    font-weight: 500;
  }

  .fc-event-time {
    font-weight: 400;
    opacity: 0.9;
  }

  /* Time grid styles */
  .fc .fc-timegrid-slot {
    height: 3rem;
  }

  .fc .fc-timegrid-slot-label {
    color: #71717a;
    font-size: 0.75rem;
  }

  .fc .fc-timegrid-axis {
    color: #71717a;
  }

  .fc .fc-timegrid-now-indicator-line {
    border-color: var(--fc-now-indicator-color);
    border-width: 2px;
  }

  /* List view styles */
  .fc .fc-list {
    background: transparent;
  }

  .fc .fc-list-day-cushion {
    background: #18181b;
    padding: 0.75rem 1rem;
    font-weight: 600;
    color: #e4e4e7;
  }

  .fc .fc-list-event {
    background: #27272a;
    margin: 0.25rem 0;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fc .fc-list-event:hover {
    background: #3f3f46;
  }

  .fc .fc-list-event-dot {
    border-radius: 9999px;
  }

  .fc .fc-list-event-title {
    color: #e4e4e7;
  }

  .fc .fc-list-event-time {
    color: #a1a1aa;
  }

  /* Scrollbar */
  .fc-scroller::-webkit-scrollbar {
    width: 0.5rem;
    height: 0.5rem;
  }

  .fc-scroller::-webkit-scrollbar-track {
    background: #18181b;
    border-radius: 0.25rem;
  }

  .fc-scroller::-webkit-scrollbar-thumb {
    background: #3f3f46;
    border-radius: 0.25rem;
  }

  .fc-scroller::-webkit-scrollbar-thumb:hover {
    background: #52525b;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .fc .fc-toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .fc .fc-toolbar-chunk {
      display: flex;
      justify-content: center;
      margin: 0.25rem 0;
    }

    .fc .fc-button-group {
      width: 100%;
      display: flex;
    }

    .fc .fc-button {
      flex: 1;
      padding: 0.5rem;
    }

    .fc-event {
      font-size: 0.7rem;
      padding: 0.125rem 0.25rem;
    }

    .fc .fc-daygrid-day-number {
      font-size: 0.75rem;
    }

    .fc .fc-col-header-cell {
      font-size: 0.75rem;
      padding: 0.5rem 0;
    }
  }

  /* Custom event colors */
  .fc-event-confirmed { background-color: #10b981; }
  .fc-event-pending { background-color: #f59e0b; }
  .fc-event-completed { background-color: #6b7280; }
  .fc-event-cancelled { background-color: #ef4444; opacity: 0.7; }
  
  .fc-event-appointment { border-left: 3px solid rgba(255, 255, 255, 0.3) !important; }
  .fc-event-reminder { border-left: 3px solid rgba(255, 255, 255, 0.5) !important; }

  /* Dragging styles */
  .fc-event.fc-event-dragging {
    opacity: 0.75;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  /* Selection styles */
  .fc-highlight {
    background: rgba(37, 99, 235, 0.2);
  }

  /* Multi-month view */
  .fc .fc-multimonth-month {
    background: var(--fc-neutral-bg-color);
    border-radius: 0.5rem;
    margin: 0.5rem;
    padding: 0.5rem;
  }

  .fc .fc-multimonth-title {
    background: transparent;
    padding: 0.5rem;
    font-weight: 600;
  }

  /* Popover */
  .fc-popover {
    background: #27272a;
    border: 1px solid #3f3f46;
    border-radius: 0.5rem;
  }

  .fc-popover-header {
    background: #18181b;
    padding: 0.5rem;
  }

  .fc-popover-body {
    padding: 0.5rem;
  }

  /* More events link */
  .fc-more-link {
    color: #2563eb;
    font-weight: 500;
  }
`;

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showExternalEvents, setShowExternalEvents] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      // Auto-switch to list view on mobile
      if (isMobileDevice && calendarRef.current) {
        const api = calendarRef.current.getApi();
        api.changeView('listWeek');
        setCurrentView('listWeek');
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    loadEvents();
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    
    if (eventId && events.length > 0) {
      const selectedEvent = events.find(e => e.id === eventId);
      
      if (selectedEvent && calendarRef.current) {
        const api = calendarRef.current.getApi();
        api.gotoDate(selectedEvent.start);
        
        handleEditEvent(selectedEvent);
        
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('id');
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    }
  }, [events]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCalendarEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Errore nel caricamento degli eventi");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert our events to FullCalendar format
  const fullCalendarEvents = events
    .filter(event => {
      if (filterStatus !== "all" && event.status !== filterStatus) return false;
      if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      backgroundColor: getEventColor(event.status, event.eventType),
      borderColor: getEventColor(event.status, event.eventType),
      extendedProps: {
        description: event.description,
        location: event.location,
        status: event.status,
        eventType: event.eventType,
      },
      classNames: [
        `fc-event-${event.status}`,
        `fc-event-${event.eventType}`
      ]
    }));

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    const newEvent: CalendarEvent = {
      id: "",
      title: "",
      start: selectInfo.start,
      end: selectInfo.end,
      status: "pending",
      eventType: "appointment",
      description: ""
    };
    
    setCurrentEvent(newEvent);
    setIsEditing(false);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      handleEditEvent(event);
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const event = events.find(e => e.id === dropInfo.event.id);
    if (event) {
      const updatedEvent = {
        ...event,
        start: dropInfo.event.start!,
        end: dropInfo.event.end || dropInfo.event.start!
      };
      
      try {
        await updateCalendarEvent(event.id, updatedEvent);
        await loadEvents();
        toast.success("Evento spostato con successo");
      } catch (error) {
        dropInfo.revert();
        toast.error("Errore nello spostamento dell'evento");
      }
    }
  };

  const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
    const event = events.find(e => e.id === resizeInfo.event.id);
    if (event) {
      const updatedEvent = {
        ...event,
        start: resizeInfo.event.start!,
        end: resizeInfo.event.end!
      };
      
      try {
        await updateCalendarEvent(event.id, updatedEvent);
        await loadEvents();
        toast.success("Durata evento aggiornata");
      } catch (error) {
        resizeInfo.revert();
        toast.error("Errore nell'aggiornamento della durata");
      }
    }
  };

  const handleNewEvent = () => {
    const now = new Date();
    const start = new Date(selectedDate);
    start.setHours(now.getHours() + 1, 0, 0, 0);
    
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    
    const newEvent: CalendarEvent = {
      id: "",
      title: "",
      start,
      end,
      status: "pending",
      eventType: "appointment",
      description: ""
    };
    
    setCurrentEvent(newEvent);
    setIsEditing(false);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setCurrentEvent(event);
    setIsEditing(true);
  };

  const handleSaveEvent = async (event: CalendarEvent) => {
    try {
      if (isEditing) {
        await updateCalendarEvent(event.id, event);
        toast.success("Evento aggiornato con successo");
      } else {
        await createCalendarEvent(event);
        toast.success("Evento creato con successo");
      }
      
      await loadEvents();
      setCurrentEvent(null);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(isEditing ? "Errore nell'aggiornamento dell'evento" : "Errore nella creazione dell'evento");
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      await deleteCalendarEvent(event.id);
      await loadEvents();
      setCurrentEvent(null);
      toast.success("Evento eliminato con successo");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Errore nell'eliminazione dell'evento");
    }
  };

  const handleViewChange = (view: string) => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.changeView(view);
      setCurrentView(view);
    }
  };

  const customButtons = {
    customPrev: {
      text: '<',
      click: () => {
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          api.prev();
        }
      }
    },
    customNext: {
      text: '>',
      click: () => {
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          api.next();
        }
      }
    },
    customToday: {
      text: 'Oggi',
      click: () => {
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          api.today();
          setSelectedDate(new Date());
        }
      }
    },
    monthView: {
      text: 'Mese',
      click: () => handleViewChange('dayGridMonth')
    },
    weekView: {
      text: 'Settimana',
      click: () => handleViewChange('timeGridWeek')
    },
    dayView: {
      text: 'Giorno',
      click: () => handleViewChange('timeGridDay')
    },
    listView: {
      text: 'Lista',
      click: () => handleViewChange('listWeek')
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Filter events for selected date
  useEffect(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const filtered = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= startOfDay && eventDate <= endOfDay;
    });
    
    setSelectedEvents(filtered);
  }, [selectedDate, events]);

  if (isLoading && events.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <style jsx global>{calendarStyles}</style>
      
      <div className="h-[calc(100vh-60px)] sm:h-[calc(100vh-100px)] flex flex-col animate-fade-in w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 px-2 sm:px-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <Menu size={20} />
              </button>
            )}
            
            {/* Search bar */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Cerca eventi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>
            
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                filterStatus !== "all" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              <Filter size={20} />
            </button>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Toggle external events panel - Desktop only */}
            {!isMobile && (
              <button
                onClick={() => setShowExternalEvents(!showExternalEvents)}
                className={`p-2 rounded-lg transition-colors ${
                  showExternalEvents ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
                title={showExternalEvents ? "Nascondi eventi rapidi" : "Mostra eventi rapidi"}
              >
                {showExternalEvents ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
              </button>
            )}
            
            {/* View toggle for desktop */}
            {!isMobile && (
              <div className="flex bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => handleViewChange('dayGridMonth')}
                  className={`p-1.5 rounded transition-colors ${
                    currentView === 'dayGridMonth' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Vista mensile"
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => handleViewChange('timeGridWeek')}
                  className={`p-1.5 rounded transition-colors ${
                    currentView === 'timeGridWeek' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Vista settimanale"
                >
                  <CalendarRange size={18} />
                </button>
                <button
                  onClick={() => handleViewChange('timeGridDay')}
                  className={`p-1.5 rounded transition-colors ${
                    currentView === 'timeGridDay' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Vista giornaliera"
                >
                  <CalendarDays size={18} />
                </button>
                <button
                  onClick={() => handleViewChange('listWeek')}
                  className={`p-1.5 rounded transition-colors ${
                    currentView === 'listWeek' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Vista lista"
                >
                  <List size={18} />
                </button>
              </div>
            )}
            
            {/* New event button */}
            <button
              onClick={handleNewEvent}
              className="bg-blue-600 hover:bg-blue-500 text-white inline-flex items-center justify-center py-2 px-3 text-sm rounded-lg transition-colors"
            >
              <Plus size={18} className="mr-1.5" />
              <span className="hidden sm:inline">Nuovo evento</span>
              <span className="sm:hidden">Nuovo</span>
            </button>
          </div>
        </div>
        
        {/* Filters panel */}
        {showFilters && (
          <div className="bg-zinc-800 rounded-lg p-4 mb-4 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterStatus === "all" ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterStatus === "pending" ? "bg-amber-600 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                In attesa
              </button>
              <button
                onClick={() => setFilterStatus("confirmed")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterStatus === "confirmed" ? "bg-green-600 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                Confermati
              </button>
              <button
                onClick={() => setFilterStatus("completed")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterStatus === "completed" ? "bg-gray-600 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                Completati
              </button>
              <button
                onClick={() => setFilterStatus("cancelled")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterStatus === "cancelled" ? "bg-red-600 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                Cancellati
              </button>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* External events panel - Desktop only */}
          {!isMobile && showExternalEvents && (
            <div className="w-64 bg-zinc-800 rounded-lg overflow-y-auto animate-fade-in">
              <ExternalEventsPanel />
            </div>
          )}
          
          {/* Calendar container */}
          <div className={`flex-1 bg-zinc-900 rounded-lg overflow-hidden ${
            isMobile && showSidebar ? 'hidden' : ''
          }`}>
            <FullCalendar
              ref={calendarRef}
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
                multiMonthPlugin
              ]}
              initialView={isMobile ? "listWeek" : "dayGridMonth"}
              locale={itLocale}
              headerToolbar={{
                left: isMobile ? 'customPrev,customNext' : 'customPrev,customNext customToday',
                center: 'title',
                right: isMobile ? '' : 'monthView,weekView,dayView,listView'
              }}
              customButtons={customButtons}
              events={fullCalendarEvents}
              editable={true}
              droppable={true}
              eventReceive={async (info) => {
                // Handle external event drops
                const newEvent: CalendarEvent = {
                  id: "",
                  title: info.event.title,
                  start: info.event.start!,
                  end: info.event.end || info.event.start!,
                  status: info.event.extendedProps.status || "pending",
                  eventType: info.event.extendedProps.eventType || "appointment",
                  location: info.event.extendedProps.location || "",
                  description: info.event.extendedProps.description || ""
                };
                
                try {
                  await createCalendarEvent(newEvent);
                  await loadEvents();
                  toast.success("Evento creato con successo");
                } catch (error) {
                  info.revert();
                  toast.error("Errore nella creazione dell'evento");
                }
              }}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={isMobile ? 2 : 3}
              height="100%"
              weekends={true}
              nowIndicator={true}
              eventDisplay="block"
              displayEventTime={true}
              displayEventEnd={false}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="00:30:00"
              slotLabelInterval="01:00:00"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventClick={handleEventClick}
              select={handleDateSelect}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              dateClick={(info) => {
                setSelectedDate(info.date);
                if (isMobile && selectedEvents.length > 0) {
                  setShowSidebar(true);
                }
              }}
              eventMouseEnter={(info) => {
                info.el.style.zIndex = '1000';
              }}
              eventMouseLeave={(info) => {
                info.el.style.zIndex = '';
              }}
              views={{
                listWeek: {
                  buttonText: 'Lista'
                },
                dayGridMonth: {
                  dayMaxEventRows: 3
                }
              }}
              eventContent={(arg) => {
                const isListView = arg.view.type.includes('list');
                const eventType = arg.event.extendedProps.eventType;
                const location = arg.event.extendedProps.location;
                
                if (isListView) {
                  return (
                    <div className="flex items-center gap-2 p-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0`} 
                        style={{ backgroundColor: arg.event.backgroundColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{arg.event.title}</div>
                        {location && (
                          <div className="text-xs text-zinc-400 flex items-center mt-0.5">
                            <MapPin size={10} className="mr-1" />
                            {location === 'office' ? 'Ufficio' : 
                             location === 'client' ? 'Cliente' :
                             location === 'remote' ? 'Remoto' : 
                             location === 'site' ? 'Cantiere' : location}
                          </div>
                        )}
                      </div>
                      {eventType === 'reminder' && <Bell size={14} className="text-purple-400" />}
                      {eventType === 'appointment' && <Bookmark size={14} className="text-blue-400" />}
                    </div>
                  );
                }
                
                return (
                  <div className="p-1 overflow-hidden">
                    <div className="flex items-center gap-1">
                      {arg.timeText && (
                        <span className="text-xs font-medium">{arg.timeText}</span>
                      )}
                      {eventType === 'reminder' && <Bell size={10} />}
                    </div>
                    <div className="text-xs font-medium truncate">{arg.event.title}</div>
                  </div>
                );
              }}
            />
          </div>
          
          {/* Sidebar */}
          {(!isMobile || showSidebar) && (
            <div className={`
              ${isMobile ? 'absolute inset-0 z-30 bg-zinc-900' : 'w-80'} 
              bg-zinc-800 rounded-lg overflow-hidden animate-fade-in
            `}>
              <CalendarSidebar
                selectedDate={selectedDate}
                events={selectedEvents}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
                onClose={isMobile ? toggleSidebar : undefined}
              />
            </div>
          )}
        </div>
        
        {/* Event Modal */}
        {currentEvent && (
          <EventModal
            event={currentEvent}
            isEditing={isEditing}
            onClose={() => setCurrentEvent(null)}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
            isMobile={isMobile}
          />
        )}
      </div>
    </>
  );
}