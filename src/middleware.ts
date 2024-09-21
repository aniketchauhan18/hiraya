import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { auth } from './auth'

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string

if (!NEXTAUTH_SECRET) {
  throw new Error('Please provide NEXTAUTH_SECRET in environment variables')
}


const protectedRoutes = ['/chat'];
// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // checking for protected routes
  const protectedRoute = protectedRoutes.find((route) =>
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    const session = await auth();
    const user = session?.user;

    console.log(user);
    if (!user) {
      // adding /signin to the the current url end like -> http://localhost:3000/signin
      const redirectUrl = new URL("/signin", request.url);
      redirectUrl.searchParams.set("redirect", protectedRoute);
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }
  return NextResponse.redirect(new URL('/', request.url))
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: '/chat',
}