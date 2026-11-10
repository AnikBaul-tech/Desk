import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { sql, type Row } from './db';

const COOKIE = 'desk_session';
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setExpirationTime('30d')
    .sign(key());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export type User = { id: string; email: string; name: string; avatar: string; palette: string };

/**
 * Memoised per request: the root layout, the desk layout and the page all ask for the user,
 * which used to be three database round trips on every navigation.
 * A bad/expired token means "logged out"; a database failure is NOT treated as logged out
 * (that used to bounce people to the login page for no reason) and is left to the error boundary.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  let sub: string | undefined;
  try {
    sub = (await jwtVerify(token, key())).payload.sub;
  } catch {
    return null;
  }
  if (!sub) return null;
  const rows: Row[] = await sql`select id, email, name, avatar, palette from users where id = ${sub}`;
  return (rows[0] as User) ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  // `expired` lets the middleware clear a cookie that points at a user that no longer exists (avoids a redirect loop).
  if (!user) redirect('/login?expired=1');
  return user;
}
