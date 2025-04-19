// components/calendar/AppointmentModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CalendarEvent } from "@/types";

interface AppointmentModalProps {
  appointment: CalendarEvent;
  isEditing: boolean;
  onClose: () => void;
  onSave: (appointment: CalendarEvent) => void;
  onDelete: (appointment: CalendarEvent) => void;
}

export default function AppointmentModal({
  appointment,
  isEditing,
  onClose,
  onSave,
  onDelete,
}: AppointmentModalProps) {
  // components/calendar/AppointmentModal.tsx (continuazione)
  const [title, setTitle] = useState(appointment.title);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [status, setStatus] = useState(appointment.status);
  const [location, setLocation] = useState(appointment.location || "");
  const [clientId, setClientId] = useState(appointment.clientId || "");
  const [description, setDescription] = useState(appointment.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // On mount, set the date and time
  useEffect(() => {
    const start = new Date(appointment.start);
    
    // Format date for input
    const dateStr = start.toISOString().split('T')[0];
    setDate(dateStr);
    
    // Format time for input
    const hours = start.getHours().toString().padStart(2, '0');
    const minutes = start.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    
    // Calculate duration in minutes
    const end = new Date(appointment.end);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    setDuration(durationMinutes.toString());
  }, [appointment]);
  
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
      // Show error
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
    
    // Create appointment object
    const updatedAppointment: CalendarEvent = {
      ...appointment,
      title,
      start,
      end,
      status,
      location,
      clientId,
      description,
    };
    
    onSave(updatedAppointment);
  };
  
  const handleDelete = () => {
    if (confirm("Sei sicuro di voler eliminare questo appuntamento?")) {
      onDelete(appointment);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="absolute inset-0"
        onClick={onClose}
      ></div>
      
      <div className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-md mx-4 z-10 animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h3 className="text-base font-medium">
            {isEditing ? "Modifica Appuntamento" : "Nuovo Appuntamento"}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Titolo
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
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
                className="input w-full"
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
                className="input w-full"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-1">
                Durata
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input w-full"
              >
                <option value="30">30 minuti</option>
                <option value="60">1 ora</option>
                <option value="90">1 ora e 30 min</option>
                <option value="120">2 ore</option>
                <option value="180">3 ore</option>
                <option value="240">4 ore</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Stato
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="input w-full"
              >
                <option value="pending">In attesa</option>
                <option value="confirmed">Confermato</option>
                <option value="completed">Completato</option>
                <option value="cancelled">Cancellato</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">
                Luogo
              </label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input w-full"
              >
                <option value="">Seleziona</option>
                <option value="office">Ufficio</option>
                <option value="client">Cliente</option>
                <option value="remote">Remoto</option>
                <option value="site">Cantiere</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium mb-1">
              Cliente
            </label>
            <select
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="input w-full"
            >
              <option value="">Seleziona un cliente</option>
              <option value="1">Mario Rossi</option>
              <option value="2">Giuseppe Bianchi</option>
              <option value="3">Anna Verdi</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Note
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input w-full"
            ></textarea>
          </div>
        </form>
        
        <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-700 bg-zinc-900/30">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-outline border-danger text-danger hover:bg-danger/10"
              >
                Elimina
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Annulla
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !date || !time}
              className="btn btn-primary"
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
                isEditing ? "Aggiorna" : "Salva"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}