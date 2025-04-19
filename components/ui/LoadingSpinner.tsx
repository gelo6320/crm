// components/ui/LoadingSpinner.tsx
export default function LoadingSpinner() {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-r-2 border-l-2 border-transparent border-opacity-50 animate-[spin_1.5s_linear_infinite]"></div>
        </div>
      </div>
    );
  }