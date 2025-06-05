// components/ui/ImageUpload.tsx
"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  placeholder?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className = "",
  placeholder = "Trascina qui l'immagine o clicca per selezionare"
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = async (file: File) => {
    // Validazione tipo
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`Tipo di file non supportato. Usa: ${acceptedTypes.join(', ')}`);
    }

    // Validazione dimensione
    if (file.size > maxSize * 1024 * 1024) {
      throw new Error(`L'immagine deve essere inferiore a ${maxSize}MB`);
    }

    // Conversione a base64
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Errore durante la lettura del file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    try {
      const base64 = await validateAndProcessFile(file);
      onChange(base64);
    } catch (error) {
      console.error('Errore upload:', error);
      // Qui potresti mostrare un toast di errore
      alert(error instanceof Error ? error.message : 'Errore durante l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Se c'è già un'immagine, mostra preview
  if (value) {
    return (
      <div className={`relative inline-block ${className}`}>
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className="h-20 w-auto max-w-[200px] object-contain bg-zinc-800 rounded-lg p-2 border border-zinc-600"
          />
          
          {/* Overlay con azioni */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={openFileDialog}
              className="bg-primary hover:bg-primary-hover text-white rounded-full p-2 transition-colors"
              title="Cambia immagine"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              title="Rimuovi immagine"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // Area di upload
  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-105' 
            : 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/30'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-zinc-400">Caricamento...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className={`transition-colors ${isDragging ? 'text-primary' : 'text-zinc-500'}`}>
              <ImageIcon size={32} />
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">
                {placeholder}
              </p>
              <p className="text-xs text-zinc-500">
                {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} fino a {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}