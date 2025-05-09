export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  };
  
  export default function NotFound() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold">Pagina non trovata</h2>
        <p>La pagina che stai cercando non esiste.</p>
      </div>
    );
  }