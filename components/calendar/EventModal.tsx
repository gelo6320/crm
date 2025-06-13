// components/calendar/EventModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Bookmark, Clock, MapPin, Trash2, Check, Bell } from "lucide-react";
import { motion } from "motion/react";
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
  
  useEffect(() => {
    const start = new Date(event.start || new Date());
    
    const dateStr = start.toISOString().split('T')[0];
    setDate(dateStr);
    
    const hours = start.getHours().toString().padStart(2, '0');
    const minutes = start.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    
    if (event.duration) {
      setDuration(event.duration.toString());
    } else if (event.end) {
      const end = new Date(event.end);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      setDuration(durationMinutes.toString());
    }
  }, [event]);
  
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
    
    const [hours, minutes] = time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + parseInt(duration || "60"));
    
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
    if (confirm("Sei sicuro di voler eliminare questo evento?")) {
      onDelete(event);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        className="absolute inset-0"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      <motion.div
        className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
          mass: 0.8,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {isEditing ? "Modifica Evento" : "Nuovo Evento"}
          </h3>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Event Type Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tipo di evento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-700 rounded-xl">
              <motion.button
                type="button"
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  eventType === 'appointment' 
                    ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
                onClick={() => setEventType('appointment')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Appuntamento
              </motion.button>
              
              <motion.button
                type="button"
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  eventType === 'reminder' 
                    ? 'bg-white dark:bg-zinc-600 text-purple-600 dark:text-purple-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
                onClick={() => setEventType('reminder')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bell className="w-4 h-4 mr-2" />
                Promemoria
              </motion.button>
            </div>
          </div>
          
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Titolo
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={eventType === 'appointment' ? "Titolo appuntamento" : "Titolo promemoria"}
              required
            />
          </div>
          
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Data
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="time" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Ora
              </label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
          
          {/* Duration for appointments */}
          {eventType === 'appointment' && (
            <div className="space-y-2">
              <label htmlFor="duration" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Durata
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="15">15 minuti</option>
                <option value="30">30 minuti</option>
                <option value="45">45 minuti</option>
                <option value="60">1 ora</option>
                <option value="90">1 ora e 30 min</option>
                <option value="120">2 ore</option>
                <option value="180">3 ore</option>
                <option value="240">4 ore</option>
                <option value="480">8 ore</option>
              </select>
            </div>
          )}
          
          {/* Location for appointments */}
          {eventType === 'appointment' && (
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Luogo
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Inserisci il luogo"
                />
              </div>
            </div>
          )}
          
          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {eventType === 'appointment' ? 'Note' : 'Descrizione'}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder={eventType === 'appointment' ? "Dettagli aggiuntivi..." : "Descrivi il promemoria..."}
            />
          </div>
        </form>
        
        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-700/30">
          <div>
            {isEditing && (
              <motion.button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </motion.button>
            )}
          </div>
          
          <div className="flex gap-3">
            <motion.button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Annulla
            </motion.button>
            <motion.button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !date || !time}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? (
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Salvataggio...
                </motion.div>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isEditing ? "Aggiorna" : "Salva"}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}