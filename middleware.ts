import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('desk_session')?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET!));
      valid = true;
    } catch {}
  }
  const isPublic = PUBLIC.includes(pathname);
  if (!valid && !isPublic) return NextResponse.redirect(new URL('/login', req.url));
  if (valid && isPublic) {
    // A valid token whose user no longer exists is sent here with ?expired=1: drop the stale cookie instead of looping back to "/".
    if (req.nextUrl.searchParams.has('expired')) {
      const res = NextResponse.next();
      res.cookies.delete('desk_session');
      return res;
    }
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
