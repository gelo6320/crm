// app/api/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Crea un response che elimina il cookie di sessione
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout effettuato con successo' 
    });
    
    // Questo metodo varia in base a come hai configurato i tuoi cookie 
    // di sessione, ma dovresti essenzialmente cancellare il cookie che 
    // memorizza la sessione
    response.cookies.delete('connect.sid'); // Usa il nome del cookie di sessione corretto
    
    // Puoi anche cancellare altri cookie potenzialmente sensibili
    response.cookies.delete('user'); 
    
    return response;
  } catch (error) {
    console.error('Errore durante il logout:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Errore durante il logout' 
    }, { status: 500 });
  }
}