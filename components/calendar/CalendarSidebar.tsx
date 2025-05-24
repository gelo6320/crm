// components/calendar/CalendarSidebar.tsx
import { useState } from "react";
import { 
  Trash2, Edit2, X, Clock, MapPin, Calendar, 
  ChevronDown, ChevronUp, Filter, Download,
  Bookmark, Bell, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import { CalendarEvent } from "@/types";
import { formatTime } from "@/lib/utils/date";
import { getEventColor } from "@/lib/utils/calendar";

interface CalendarSidebarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onClose?: () => void;
}

export default function CalendarSidebar({
  selectedDate,
  events,
  onEditEvent,
  onDeleteEvent,
  onClose,
}: CalendarSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['upcoming', 'today']);
  const [filterType, setFilterType] = useState<'all' | 'appointment' | 'reminder'>('all');
  
  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  // Group events by time
  const groupEvents = () => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const groups: Record<string, CalendarEvent[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      completed: [],
      cancelled: []
    };
    
    events
      .filter(event => filterType === 'all' || event.eventType === filterType)
      .forEach(event => {
        const eventDate = new Date(event.start);
        
        if (event.status === 'cancelled') {
          groups.cancelled.push(event);
        } else if (event.status === 'completed') {
          groups.completed.push(event);
        } else if (eventDate < now && !['completed', 'cancelled'].includes(event.status)) {
          groups.overdue.push(event);
        } else if (eventDate >= today && eventDate < tomorrow) {
          groups.today.push(event);
        } else {
          groups.upcoming.push(event);
        }
      });
    
    // Sort events within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => 
        new Date(a.start).getTime() - new Date(b.start).getTime()
      );
    });
    
    return groups;
  };
  
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };
  
  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'overdue': return <AlertCircle size={16} className="text-red-500" />;
      case 'today': return <Calendar size={16} className="text-blue-500" />;
      case 'upcoming': return <Clock size={16} className="text-green-500" />;
      case 'completed': return <CheckCircle size={16} className="text-gray-500" />;
      case 'cancelled': return <XCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };
  
  const getGroupTitle = (group: string) => {
    switch (group) {
      case 'overdue': return 'In ritardo';
      case 'today': return 'Oggi';
      case 'upcoming': return 'Prossimi';
      case 'completed': return 'Completati';
      case 'cancelled': return 'Cancellati';
      default: return group;
    }
  };
  
  const getEventIcon = (event: CalendarEvent) => {
    if (event.eventType === 'reminder') {
      return <Bell size={14} className="text-purple-400" />;
    }
    return <Bookmark size={14} className="text-blue-400" />;
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={12} className="text-green-500" />;
      case 'pending': return <AlertCircle size={12} className="text-amber-500" />;
      case 'completed': return <CheckCircle size={12} className="text-gray-500" />;
      case 'cancelled': return <XCircle size={12} className="text-red-500" />;
      default: return null;
    }
  };
  
  const isMobile = !!onClose;
  const groupedEvents = groupEvents();
  const totalEvents = events.filter(event => filterType === 'all' || event.eventType === filterType).length;
  
  const exportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `eventi_${selectedDate.toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  };
  
  return (
    <div className="h-full flex flex-col bg-zinc-800">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium capitalize">
            {formatSelectedDate(selectedDate)}
          </h3>
          
          <div className="flex items-center gap-2">
            {totalEvents > 0 && (
              <button
                onClick={exportEvents}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Esporta eventi"
              >
                <Download size={16} />
              </button>
            )}
            
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                aria-label="Chiudi"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1 px-2 text-xs rounded transition-colors ${
              filterType === 'all' 
                ? 'bg-zinc-700 text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tutti ({events.length})
          </button>
          <button
            onClick={() => setFilterType('appointment')}
            className={`flex-1 py-1 px-2 text-xs rounded transition-colors ${
              filterType === 'appointment' 
                ? 'bg-blue-600 text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Appuntamenti
          </button>
          <button
            onClick={() => setFilterType('reminder')}
            className={`flex-1 py-1 px-2 text-xs rounded transition-colors ${
              filterType === 'reminder' 
                ? 'bg-purple-600 text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Promemoria
          </button>
        </div>
      </div>
      
      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        {totalEvents === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm p-4 text-center">
            <div>
              <Calendar size={32} className="mx-auto mb-2 opacity-50" />
              <p>Nessun {filterType === 'all' ? 'evento' : filterType === 'appointment' ? 'appuntamento' : 'promemoria'} in questa data</p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {Object.entries(groupedEvents).map(([group, groupEvents]) => {
              if (groupEvents.length === 0) return null;
              
              const isExpanded = expandedGroups.includes(group);
              
              return (
                <div key={group} className="animate-fade-in">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {getGroupIcon(group)}
                      <span className="text-sm font-medium">{getGroupTitle(group)}</span>
                      <span className="text-xs text-zinc-500">({groupEvents.length})</span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-2 space-y-2">
                      {groupEvents.map(event => (
                        <div 
                          key={event.id}
                          className={`
                            p-3 rounded-lg border-l-4 bg-zinc-900/50
                            hover:bg-zinc-700/50 transition-all cursor-pointer
                            group animate-fade-in relative overflow-hidden
                            ${event.status === 'cancelled' ? 'opacity-60' : ''}
                          `}
                          style={{ borderLeftColor: getEventColor(event.status, event.eventType) }}
                          onClick={() => onEditEvent(event)}
                        >
                          {/* Background decoration */}
                          <div 
                            className="absolute top-0 right-0 w-16 h-16 opacity-5"
                            style={{ 
                              background: `radial-gradient(circle, ${getEventColor(event.status, event.eventType)} 0%, transparent 70%)`
                            }}
                          />
                          
                          <div className="relative">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {getEventIcon(event)}
                                <span className="font-medium text-sm">{event.title}</span>
                              </div>
                              {getStatusIcon(event.status)}
                            </div>
                            
                            <div className="text-xs text-zinc-400 space-y-1">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center">
                                  <Clock size={10} className="mr-1" />
                                  {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                                </span>
                                
                                {event.location && (
                                  <span className="flex items-center">
                                    <MapPin size={10} className="mr-1" />
                                    {event.location}
                                  </span>
                                )}
                              </div>
                              
                              {event.description && (
                                <p className="line-clamp-2 text-zinc-500">
                                  {event.description}
                                </p>
                              )}
                            </div>
                            
                            <div className={`
                              ${isMobile 
                                ? 'flex mt-3 pt-2 border-t border-zinc-700' 
                                : 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'}
                              gap-1
                            `}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditEvent(event);
                                }}
                                className={`
                                  p-1.5 rounded hover:bg-zinc-600 text-zinc-400 hover:text-white transition-colors
                                  ${isMobile ? 'flex-1 flex items-center justify-center gap-1' : ''}
                                `}
                              >
                                <Edit2 size={14} />
                                {isMobile && <span className="text-xs">Modifica</span>}
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Sei sicuro di voler eliminare questo evento?')) {
                                    onDeleteEvent(event);
                                  }
                                }}
                                className={`
                                  p-1.5 rounded hover:bg-zinc-600 text-zinc-400 hover:text-red-500 transition-colors
                                  ${isMobile ? 'flex-1 flex items-center justify-center gap-1' : ''}
                                `}
                              >
                                <Trash2 size={14} />
                                {isMobile && <span className="text-xs">Elimina</span>}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer with stats */}
      <div className="p-3 border-t border-zinc-700 bg-zinc-900/50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-zinc-800 rounded">
            <span className="text-zinc-400">Totale</span>
            <span className="font-medium">{totalEvents}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-zinc-800 rounded">
            <span className="text-zinc-400">Oggi</span>
            <span className="font-medium text-blue-500">{groupedEvents.today.length}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-zinc-800 rounded">
            <span className="text-zinc-400">In ritardo</span>
            <span className="font-medium text-red-500">{groupedEvents.overdue.length}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-zinc-800 rounded">
            <span className="text-zinc-400">Completati</span>
            <span className="font-medium text-green-500">{groupedEvents.completed.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}