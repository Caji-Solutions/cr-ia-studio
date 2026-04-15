import { NextResponse } from 'next/server'

// Sem autenticação — uso interno direto
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)'],
}
