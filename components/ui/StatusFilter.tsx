// components/ui/StatusFilter.tsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface StatusFilterProps {
    selectedStatus: string;
    onChange: (status: string) => void;
    icon: React.ReactNode;
    options?: Array<{ value: string; label: string }>; // Aggiungi questa riga
  }
  
  export default function StatusFilter({ 
    selectedStatus, 
    onChange, 
    icon, 
    options: customOptions 
  }: StatusFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const defaultOptions = [
      { value: "", label: "Tutti" },
      { value: "new", label: "Nuovi" },
      { value: "contacted", label: "Contattati" },
      { value: "qualified", label: "Qualificati" },
      { value: "opportunity", label: "Opportunità" },
      { value: "customer", label: "Clienti" },
      { value: "lost", label: "Persi" },
    ];
    
    // Usa customOptions se fornito, altrimenti usa defaultOptions
    const options = customOptions || defaultOptions;
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline flex items-center space-x-1 px-2 py-1.5"
      >
        {icon}
        <span className="hidden sm:block">Filtra</span>
        <ChevronDown size={14} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-zinc-800 border border-zinc-700 z-10 animate-fade-in">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm ${
                  selectedStatus === option.value
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-zinc-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}