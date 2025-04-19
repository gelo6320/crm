// app/api/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Crea un response che elimina il cookie di sessione
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout effettuato con successo' 
    });
    
    // Elimina tutti i cookie di sessione
    response.cookies.delete('connect.sid');
    response.cookies.delete('userId');
    response.cookies.delete('user_cookie_consent');
    
    return response;
  } catch (error) {
    console.error('Errore durante il logout:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Errore durante il logout' 
    }, { status: 500 });
  }
}