// components/ui/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <img 
        src="/logosito.webp" 
        alt="Loading" 
        className="h-16 w-16 animate-spin"
      />
    </div>
  );
}