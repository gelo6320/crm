// components/calendar/MonthView.tsx
import { useMemo } from "react";
import { CalendarEvent } from "@/types";
import { getEventColor } from "@/lib/utils/calendar";

interface MonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export default function MonthView({
  selectedDate,
  events,
  onSelectDate,
  onSelectEvent,
}: MonthViewProps) {
  // Generate days for the month view
  const daysInMonth = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create array for days
    const days = [];
    
    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }
    
    // Add days from current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      const isToday = day.toDateString() === today.toDateString();
      const isSelected = day.toDateString() === selectedDate.toDateString();
      
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday,
        isSelected,
      });
    }
    
    // Add days from next month to fill grid (6 rows x 7 days = 42 cells)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }
    
    return days;
  }, [selectedDate]);
  
  // Group events by date
  const eventsByDate = useMemo(() => {
    const eventMap: Record<string, CalendarEvent[]> = {};
    
    events.forEach(event => {
      const date = new Date(event.start).toISOString().split('T')[0];
      if (!eventMap[date]) {
        eventMap[date] = [];
      }
      eventMap[date].push(event);
    });
    
    return eventMap;
  }, [events]);
  
  return (
    <div className="h-full flex flex-col">
      {/* Day names (header) */}
      <div className="grid grid-cols-7 text-xs text-zinc-400 bg-zinc-900/50 font-medium uppercase">
        {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map((day, index) => (
          <div key={day} className="p-2 text-center">
            {day}
          </div>
        ))}
      </div>
      
      {/* Days grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 border-t border-l border-zinc-700">
        {daysInMonth.map((day, index) => {
          const dateKey = day.date.toISOString().split('T')[0];
          const dayEvents = eventsByDate[dateKey] || [];
          
          return (
            <div
              key={index}
              className={`
                border-r border-b border-zinc-700 p-1.5 overflow-hidden cursor-pointer hover:bg-zinc-800/40
                ${!day.isCurrentMonth ? "opacity-40" : ""}
                ${day.isToday ? "bg-blue-500/5" : ""}
                ${day.isSelected ? "bg-blue-500/10" : ""}
              `}
              onClick={() => onSelectDate(day.date)}
            >
              <div className={`
                text-xs mb-1.5 p-0.5 rounded-full w-6 h-6 flex items-center justify-center
                ${day.isToday ? "bg-blue-500 text-white" : "font-medium"}
                ${day.isSelected && !day.isToday ? "border border-blue-500 text-blue-500" : ""}
              `}>
                {day.date.getDate()}
              </div>
              
              <div className="space-y-1 overflow-hidden max-h-[calc(100%-24px)]">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-xs px-1.5 py-1 rounded truncate text-white"
                    style={{ 
                      backgroundColor: getEventColor(event.status, event.eventType),
                      opacity: event.status === 'cancelled' ? 0.5 : 1
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-xs text-zinc-400 px-1 mt-1">
                    +{dayEvents.length - 3} altri
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}