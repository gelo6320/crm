// app/calendar/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import FullCalendar from '@fullcalendar/react';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventResizeDoneArg } from '@fullcalendar/interaction';
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/api/calendar";
import { CalendarEvent } from "@/types/calendar";
import EventModal from "@/components/calendar/EventModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "react-hot-toast";
import itLocale from '@fullcalendar/core/locales/it';
import { getEventColor } from "@/lib/utils/calendar";

// Stili Apple-like per FullCalendar
const appleCalendarStyles = `
  /* Base styling */
  .fc {
    --fc-border-color: rgba(0, 0, 0, 0.08);
    --fc-button-bg-color: transparent;
    --fc-button-border-color: transparent;
    --fc-button-hover-bg-color: rgba(0, 0, 0, 0.05);
    --fc-button-active-bg-color: #007AFF;
    --fc-neutral-bg-color: #ffffff;
    --fc-page-bg-color: #f8f9fa;
    --fc-neutral-text-color: #1d1d1f;
    --fc-today-bg-color: rgba(0, 122, 255, 0.05);
    --fc-now-indicator-color: #007AFF;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    background: transparent;
  }

  @media (prefers-color-scheme: dark) {
    .fc {
      --fc-border-color: rgba(255, 255, 255, 0.1);
      --fc-button-hover-bg-color: rgba(255, 255, 255, 0.05);
      --fc-neutral-bg-color: #1c1c1e;
      --fc-page-bg-color: #000000;
      --fc-neutral-text-color: #ffffff;
      --fc-today-bg-color: rgba(0, 122, 255, 0.15);
    }
  }

  /* Toolbar minimalista */
  .fc .fc-toolbar {
    margin-bottom: 1rem;
    padding: 0;
  }

  .fc .fc-toolbar-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--fc-neutral-text-color);
    margin: 0;
  }

  @media (max-width: 768px) {
    .fc .fc-toolbar-title {
      font-size: 1.25rem;
    }
  }

  /* Pulsanti minimali */
  .fc .fc-button {
    background: transparent;
    border: none;
    color: #007AFF;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .fc .fc-button:hover:not(:disabled) {
    background: var(--fc-button-hover-bg-color);
    transform: none;
  }

  .fc .fc-button:focus {
    box-shadow: none;
  }

  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background-color: var(--fc-button-active-bg-color);
    color: white;
  }

  /* Vista calendario */
  .fc .fc-view-harness {
    background: var(--fc-neutral-bg-color);
    border-radius: 16px;
    padding: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .fc .fc-view-harness {
      border-radius: 12px;
      box-shadow: none;
    }
  }

  /* Header giorni */
  .fc .fc-col-header-cell {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--fc-border-color);
    font-weight: 600;
    padding: 1rem 0.5rem;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media (max-width: 768px) {
    .fc .fc-col-header-cell {
      padding: 0.75rem 0.25rem;
      font-size: 10px;
    }
  }

  .fc .fc-col-header-cell-cushion {
    color: #8e8e93;
    text-decoration: none;
  }

  /* Celle giorno */
  .fc .fc-daygrid-day {
    border: none;
    border-right: 1px solid var(--fc-border-color);
    border-bottom: 1px solid var(--fc-border-color);
    transition: background-color 0.2s ease;
  }

  .fc .fc-daygrid-day:hover {
    background-color: rgba(0, 122, 255, 0.03);
  }

  .fc .fc-daygrid-day-number {
    color: var(--fc-neutral-text-color);
    text-decoration: none;
    font-weight: 500;
    padding: 0.75rem;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    .fc .fc-daygrid-day-number {
      padding: 0.5rem;
      font-size: 12px;
    }
  }

  .fc .fc-day-today {
    background-color: var(--fc-today-bg-color) !important;
  }

  .fc .fc-day-today .fc-daygrid-day-number {
    background-color: #007AFF;
    color: white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0.25rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .fc .fc-day-today .fc-daygrid-day-number {
      width: 24px;
      height: 24px;
      font-size: 11px;
    }
  }

  /* Eventi */
  .fc-event {
    border: none !important;
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 1px 2px;
  }

  @media (max-width: 768px) {
    .fc-event {
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 4px;
      margin: 0.5px 1px;
    }
  }

  .fc-event:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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

  /* Vista settimana/giorno */
  .fc .fc-timegrid-slot {
    height: 2.5rem;
    border-color: var(--fc-border-color);
  }

  @media (max-width: 768px) {
    .fc .fc-timegrid-slot {
      height: 2rem;
    }
  }

  .fc .fc-timegrid-slot-label {
    color: #8e8e93;
    font-size: 11px;
    font-weight: 500;
  }

  .fc .fc-timegrid-axis {
    border-color: var(--fc-border-color);
  }

  .fc .fc-timegrid-now-indicator-line {
    border-color: var(--fc-now-indicator-color);
    border-width: 2px;
  }

  /* Vista lista */
  .fc .fc-list {
    background: transparent;
  }

  .fc-theme-standard .fc-list {
    border: none !important;
  }

  .fc .fc-list-day-cushion {
    background: var(--fc-neutral-bg-color);
    padding: 1rem;
    font-weight: 600;
    color: var(--fc-neutral-text-color);
    border-bottom: 1px solid var(--fc-border-color);
  }

  .fc .fc-list-event {
    background: var(--fc-neutral-bg-color);
    border: none;
    border-bottom: 1px solid var(--fc-border-color);
    cursor: pointer;
    transition: background-color 0.2s ease;
    padding: 0.75rem 1rem;
  }

  .fc .fc-list-event:hover {
    background: rgba(0, 122, 255, 0.03);
  }

  .fc .fc-list-event-dot {
    border-radius: 50%;
    width: 8px;
    height: 8px;
  }

  .fc .fc-list-event-title {
    color: var(--fc-neutral-text-color);
    font-weight: 500;
  }

  .fc .fc-list-event-time {
    color: #8e8e93;
    font-weight: 500;
  }

  /* Rimuovi bordi inutili */
  .fc-theme-standard .fc-scrollgrid {
    border: none;
  }

  .fc-theme-standard td, .fc-theme-standard th {
    border-color: var(--fc-border-color);
  }

  /* Popover */
  .fc-popover {
    background: var(--fc-neutral-bg-color);
    border: 1px solid var(--fc-border-color);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .fc-popover-header {
    background: transparent;
    padding: 0.75rem;
    border-bottom: 1px solid var(--fc-border-color);
  }

  .fc-popover-body {
    padding: 0.75rem;
  }

  /* More events link */
  .fc-more-link {
    color: #007AFF;
    font-weight: 500;
    font-size: 11px;
  }

  /* Scrollbar */
  .fc-scroller::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  .fc-scroller::-webkit-scrollbar-track {
    background: transparent;
  }

  .fc-scroller::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }

  @media (prefers-color-scheme: dark) {
    .fc-scroller::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }
  }
`;

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [eventTriggerRect, setEventTriggerRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      // Auto-switch to appropriate view on mobile
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
      const normalizedData = data.map(event => ({
        ...event,
        start: event.start instanceof Date ? event.start : new Date(event.start),
        end: event.end instanceof Date ? event.end : new Date(event.end),
        eventType: event.eventType || "appointment",
        status: event.status || "pending"
      }));
      setEvents(normalizedData);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Errore nel caricamento degli eventi");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert events to FullCalendar format
  const fullCalendarEvents = events.map(event => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('Date non valide per evento:', event);
      return null;
    }
    
    return {
      id: event.id || (event as any)._id,
      title: event.title,
      start: startDate,
      end: endDate,
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
    };
  }).filter(event => event !== null);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    const durationMs = selectInfo.end.getTime() - selectInfo.start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    const newEvent: CalendarEvent = {
      id: "",
      title: "",
      start: selectInfo.start,
      end: selectInfo.end,
      status: "pending",
      eventType: "appointment",
      description: "",
      duration: durationMinutes
    };
    
    setCurrentEvent(newEvent);
    setIsEditing(false);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;
    const event = events.find(e => e.id === eventId || (e as any)._id === eventId);
    if (event) {
      // Cattura le coordinate dell'elemento cliccato
      const domRect = clickInfo.el.getBoundingClientRect();
      const rect = {
        left: domRect.left,
        top: domRect.top,
        width: domRect.width,
        height: domRect.height
      };
      setEventTriggerRect(rect);
      handleEditEvent(event);
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const eventId = dropInfo.event.id;
    const event = events.find(e => e.id === eventId || (e as any)._id === eventId);
    if (event) {
      const updatedEvent = {
        ...event,
        start: dropInfo.event.start!,
        end: dropInfo.event.end || dropInfo.event.start!
      };
      
      try {
        await updateCalendarEvent(event.id || (event as any)._id, updatedEvent);
        await loadEvents();
        toast.success("Evento spostato con successo");
      } catch (error) {
        dropInfo.revert();
        toast.error("Errore nello spostamento dell'evento");
      }
    }
  };

  const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
    const eventId = resizeInfo.event.id;
    const event = events.find(e => e.id === eventId || (e as any)._id === eventId);
    if (event) {
      const updatedEvent = {
        ...event,
        start: resizeInfo.event.start!,
        end: resizeInfo.event.end!
      };
      
      try {
        await updateCalendarEvent(event.id || (event as any)._id, updatedEvent);
        await loadEvents();
        toast.success("Durata evento aggiornata");
      } catch (error) {
        resizeInfo.revert();
        toast.error("Errore nell'aggiornamento della durata");
      }
    }
  };

  const handleNewEvent = (event?: React.MouseEvent) => {
    if (event) {
      // Cattura le coordinate del bottone "Nuovo" cliccato
      const domRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const rect = {
        left: domRect.left,
        top: domRect.top,
        width: domRect.width,
        height: domRect.height
      };
      setEventTriggerRect(rect);
    } else {
      // Fallback al centro dello schermo
      setEventTriggerRect(null);
    }
    
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
      setEventTriggerRect(null);
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
      setEventTriggerRect(null);
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

  const goToPrevious = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.prev();
    }
  };

  const goToNext = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.next();
    }
  };

  const goToToday = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.today();
      setSelectedDate(new Date());
    }
  };

  if (isLoading && events.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <style jsx global>{appleCalendarStyles}</style>
      
      <motion.div 
        className="min-h-screen bg-zinc-50 dark:bg-zinc-900 px-4 sm:px-6 py-4 sm:py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header minimalista */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              Calendario
            </h1>
          </div>
          
          {/* Navigation and new event */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <motion.button
                onClick={goToPrevious}
                className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              
              <motion.button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Oggi
              </motion.button>
              
              <motion.button
                onClick={goToNext}
                className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
            
            {/* View switcher for desktop */}
            {!isMobile && (
              <motion.div 
                className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {[
                  { key: 'dayGridMonth', label: 'Mese' },
                  { key: 'timeGridWeek', label: 'Settimana' },
                  { key: 'listWeek', label: 'Lista' }
                ].map((view) => (
                  <motion.button
                    key={view.key}
                    onClick={() => handleViewChange(view.key)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      currentView === view.key
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {view.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
            
            {/* New event button */}
            <motion.button
              onClick={handleNewEvent}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 sm:px-4 sm:py-2 rounded-full sm:rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-sm font-medium">Nuovo</span>
            </motion.button>
          </div>
        </motion.div>
        
        {/* Calendar container */}
        <motion.div 
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              listPlugin,
              interactionPlugin
            ]}
            initialView={isMobile ? "listWeek" : "dayGridMonth"}
            locale={itLocale}
            headerToolbar={false} // Rimuovi la toolbar di FullCalendar
            events={fullCalendarEvents}
            editable={true}
            droppable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={isMobile ? 2 : 4}
            height={isMobile ? "70vh" : "75vh"}
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
                dayMaxEventRows: isMobile ? 2 : 4
              }
            }}
          />
        </motion.div>
        
        {/* Event Modal */}
        <AnimatePresence mode="wait">
          {currentEvent && (
            <EventModal
              key={currentEvent.id || 'new'}
              event={currentEvent}
              isEditing={isEditing}
              onClose={() => {
                setCurrentEvent(null);
                setEventTriggerRect(null);
              }}
              onSave={handleSaveEvent}
              onDelete={handleDeleteEvent}
              isMobile={isMobile}
              triggerRect={eventTriggerRect}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}