// components/calendar/EventModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Bookmark, Clock, MapPin, Trash2, Check } from "lucide-react";
import { CalendarEvent } from "@/types/calendar";

interface EventModalProps {
  event: CalendarEvent;
  isEditing: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  isMobile?: boolean;
}

export default function EventModal({
  event,
  isEditing,
  onClose,
  onSave,
  onDelete,
  isMobile = false
}: EventModalProps) {
  const [title, setTitle] = useState(event.title || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [eventType, setEventType] = useState(event.eventType || "appointment");
  const [location, setLocation] = useState(event.location || "");
  const [description, setDescription] = useState(event.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // On mount, set the date and time
  useEffect(() => {
    const start = new Date(event.start || new Date());
    
    // Format date for input
    const dateStr = start.toISOString().split('T')[0];
    setDate(dateStr);
    
    // Format time for input
    const hours = start.getHours().toString().padStart(2, '0');
    const minutes = start.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    
    // Calculate duration in minutes - usa event.duration se disponibile
    if (event.duration) {
      setDuration(event.duration.toString());
    } else if (event.end) {
      const end = new Date(event.end);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      setDuration(durationMinutes.toString());
    }
  }, [event]);
  
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !time) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Parse date and time
    const [hours, minutes] = time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    
    // Calculate end time using duration
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + parseInt(duration || "60"));
    
    // Create event object
    const updatedEvent: CalendarEvent = {
      ...event,
      title,
      start,
      end,
      status: "pending",
      eventType,
      location,
      description,
    };
    
    onSave(updatedEvent);
  };
  
  const handleDelete = () => {
    if (confirm("Sei sicuro di voler eliminare questo elemento?")) {
      onDelete(event);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-0">
      <div
        className="absolute inset-0"
        onClick={onClose}
      ></div>
      
      <div className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-md z-10 animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h3 className="text-base font-medium">
            {isEditing ? "Modifica Evento" : "Nuovo Evento"}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Tipo di evento */}
          <div className="grid grid-cols-2 gap-1 bg-zinc-900 rounded-lg p-1">
            <button
              type="button"
              className={`flex items-center justify-center py-2 px-3 rounded text-sm transition-colors ${
                eventType === 'appointment' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
              onClick={() => setEventType('appointment')}
            >
              <Bookmark size={18} className="mr-2" />
              Appuntamento
            </button>
            
            <button
              type="button"
              className={`flex items-center justify-center py-2 px-3 rounded text-sm transition-colors ${
                eventType === 'reminder' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
              onClick={() => setEventType('reminder')}
            >
              <Clock size={18} className="mr-2" />
              Promemoria
            </button>
          </div>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Titolo
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={eventType === 'appointment' ? "Titolo appuntamento" : "Titolo promemoria"}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                Data
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium mb-1">
                Ora
              </label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {eventType === 'appointment' && (
              <div>
                <label htmlFor="duration" className="block text-sm font-medium mb-1">
                  Durata
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="15">15 minuti</option>
                  <option value="30">30 minuti</option>
                  <option value="45">45 minuti</option>
                  <option value="60">1 ora</option>
                  <option value="75">1 ora e 15 min</option>
                  <option value="90">1 ora e 30 min</option>
                  <option value="105">1 ora e 45 min</option>
                  <option value="120">2 ore</option>
                  <option value="150">2 ore e 30 min</option>
                  <option value="180">3 ore</option>
                  <option value="240">4 ore</option>
                  <option value="300">5 ore</option>
                  <option value="360">6 ore</option>
                  <option value="420">7 ore</option>
                  <option value="480">8 ore</option>
                </select>
              </div>
            )}
          </div>
          
          {eventType === 'appointment' && (
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">
                Luogo
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Inserisci il luogo dell'appuntamento"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              {eventType === 'appointment' ? 'Note' : 'Descrizione'}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={eventType === 'appointment' ? "Inserisci dettagli aggiuntivi..." : "Descrivi il promemoria..."}
            ></textarea>
          </div>
        </form>
        
        <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-700 bg-zinc-900/30">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                title="Elimina"
              >
                <Trash2 size={18} className="mr-1.5" />
                Elimina
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium bg-zinc-700 hover:bg-zinc-600 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !date || !time}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Elaborazione...
                </span>
              ) : (
                <>
                  <Check size={18} className="mr-1.5" />
                  {isEditing ? "Aggiorna" : "Salva"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}