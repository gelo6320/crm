// components/calendar/CalendarView.tsx
"use client";

import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { CalendarEvent } from "@/types";
import MonthView from "./MonthView";
import DayView from "./DayView";
import ListView from "./ListView";
import { isTouchDevice } from "@/lib/utils/device";

interface CalendarViewProps {
  view: "month" | "day" | "list";
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEvent?: (start: Date, end: Date) => void; // Nuova prop per creare eventi
}

export default function CalendarView({
  view,
  selectedDate,
  events,
  onSelectDate,
  onSelectEvent,
  onCreateEvent
}: CalendarViewProps) {
  const [isDndReady, setIsDndReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Set up the correct backend based on device type
  const backendForDND = isTouchDevice() ? TouchBackend : HTML5Backend;
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // When the component mounts, we mark DnD as ready (client-side only)
  useEffect(() => {
    setIsDndReady(true);
  }, []);
  
  return (
    <div className={`h-full transition-all duration-300 ${view === "day" && isMobile ? "bg-black" : ""} w-full`}>
      {isDndReady ? (
        <DndProvider backend={backendForDND}>
          {view === "month" && (
            <MonthView
              selectedDate={selectedDate}
              events={events}
              onSelectDate={onSelectDate}
              onSelectEvent={onSelectEvent}
            />
          )}
          
          {view === "day" && (
            <DayView
              selectedDate={selectedDate}
              events={events}
              onSelectEvent={onSelectEvent}
              onChangeDate={onSelectDate}
              onCreateEvent={onCreateEvent}
            />
          )}
          
          {view === "list" && (
            <ListView
              selectedDate={selectedDate}
              events={events}
              onSelectEvent={onSelectEvent}
            />
          )}
        </DndProvider>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-t-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}