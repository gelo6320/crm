// components/calendar/EventModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Bookmark, Clock, MapPin, Trash2, Check, Bell } from "lucide-react";
import { motion } from "motion/react";
import { SmoothCorners } from 'react-smooth-corners';
import { CalendarEvent } from "@/types/calendar";

interface EventModalProps {
  event: CalendarEvent;
  isEditing: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  isMobile?: boolean;
  triggerRect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
}

export default function EventModal({
  event,
  isEditing,
  onClose,
  onSave,
  onDelete,
  isMobile = false,
  triggerRect
}: EventModalProps) {
  const [title, setTitle] = useState(event.title || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [eventType, setEventType] = useState(event.eventType || "appointment");
  const [location, setLocation] = useState(event.location || "");
  const [description, setDescription] = useState(event.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Calcola le coordinate iniziali e finali per l'animazione
  const getAnimationCoordinates = () => {
    if (!triggerRect) {
      return {
        initial: {
          x: 0,
          y: 0,
          scale: 0.1,
          opacity: 1,
        },
        animate: {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
        }
      };
    }

    const triggerCenterX = triggerRect.left + (triggerRect.width / 2);
    const triggerCenterY = triggerRect.top + (triggerRect.height / 2);
    const finalX = window.innerWidth / 2;
    const finalY = window.innerHeight / 2;

    return {
      initial: {
        x: triggerCenterX - finalX,
        y: triggerCenterY - finalY,
        scale: 0.1,
        opacity: 1,
      },
      animate: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
      }
    };
  };

  const coords = getAnimationCoordinates();
  
  // Configurazione spring per animazione naturale stile iOS
  const springConfig = {
    type: "spring" as const,
    damping: isClosing ? 35 : 25,
    stiffness: isClosing ? 400 : 300,
    mass: 0.8,
  };

  const handleClose = () => {
    setIsClosing(true);
    onClose();
  };
  
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
        handleClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);
  
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

  // Calcola le dimensioni responsive del modale
  const getModalSize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (width < 640) { // Mobile
      return {
        width: 'calc(100vw - 32px)',
        maxWidth: '400px',
        maxHeight: 'calc(100vh - 80px)'
      };
    } else if (width < 1024) { // Tablet
      return {
        width: 'calc(100vw - 80px)',
        maxWidth: '500px',
        maxHeight: 'calc(100vh - 120px)'
      };
    } else { // Desktop
      return {
        width: 'auto',
        maxWidth: '600px',
        maxHeight: 'calc(100vh - 160px)'
      };
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      {/* Background overlay minimal */}
      <motion.div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm backdrop-saturate-150"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={springConfig}
      />
      
      {/* Modal container con animazione iOS */}
      <motion.div 
        className="relative z-10 mx-4 sm:mx-6"
        onClick={(e) => e.stopPropagation()}
        initial={coords.initial}
        animate={coords.animate}
        exit={{
          ...coords.initial,
          scale: 0.1,
          opacity: 0,
        }}
        transition={springConfig}
        style={{
          transformOrigin: "center center",
          ...getModalSize()
        }}
      >
        <SmoothCorners 
          corners="2.5"
          borderRadius="24"
        />
        
        <div className="relative bg-zinc-100/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-[24px] shadow-xl overflow-hidden backdrop-saturate-150 max-h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200/50 dark:border-zinc-700/50">
            <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white">
              {isEditing ? "Modifica Evento" : "Nuovo Evento"}
            </h3>
            <motion.button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 text-zinc-500 dark:text-zinc-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Event Type Selector */}
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tipo di evento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-200/70 dark:bg-zinc-700/70 rounded-xl">
              <motion.button
                type="button"
                className={`flex items-center justify-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm font-medium transition-all ${
                  eventType === 'appointment' 
                    ? 'bg-white/90 dark:bg-zinc-600/90 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
                onClick={() => setEventType('appointment')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bookmark className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Appuntamento</span>
                <span className="sm:hidden">App.</span>
              </motion.button>
              
              <motion.button
                type="button"
                className={`flex items-center justify-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm font-medium transition-all ${
                  eventType === 'reminder' 
                    ? 'bg-white/90 dark:bg-zinc-600/90 text-purple-600 dark:text-purple-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
                onClick={() => setEventType('reminder')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bell className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Promemoria</span>
                <span className="sm:hidden">Prom.</span>
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
              className="w-full bg-white/70 dark:bg-zinc-700/70 border border-zinc-200/50 dark:border-zinc-600/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
              placeholder={eventType === 'appointment' ? "Titolo appuntamento" : "Titolo promemoria"}
              required
            />
          </div>
          
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Data
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/70 dark:bg-zinc-700/70 border border-zinc-200/50 dark:border-zinc-600/50 rounded-xl px-3 sm:px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
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
                className="w-full bg-white/70 dark:bg-zinc-700/70 border border-zinc-200/50 dark:border-zinc-600/50 rounded-xl px-3 sm:px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
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
                className="w-full bg-white/70 dark:bg-zinc-700/70 border border-zinc-200/50 dark:border-zinc-600/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
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
                  className="w-full bg-white/70 dark:bg-zinc-700/70 border border-zinc-200/50 dark:border-zinc-600/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
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
              className="w-full bg-white/70 dark:bg-zinc-700/70 border border-zinc-200/50 dark:border-zinc-600/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none backdrop-blur-sm"
              placeholder={eventType === 'appointment' ? "Dettagli aggiuntivi..." : "Descrivi il promemoria..."}
            />
          </div>
        </form>
        
        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 border-t border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-50/70 dark:bg-zinc-700/30 gap-3 sm:gap-0">
          <div>
            {isEditing && (
              <motion.button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50/70 dark:hover:bg-red-900/30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </motion.button>
            )}
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <motion.button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-200/70 dark:bg-zinc-600/70 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300/70 dark:hover:bg-zinc-500/70 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Annulla
            </motion.button>
            <motion.button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !date || !time}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/90 hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors backdrop-blur-sm"
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
                  <span className="hidden sm:inline">Salvataggio...</span>
                  <span className="sm:hidden">Salvo...</span>
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
        </div>
      </motion.div>
    </div>
  );
}