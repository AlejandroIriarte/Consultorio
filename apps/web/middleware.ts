import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const ROLE_HOME: Record<string, string> = {
  PATIENT: '/dashboard/paciente',
  DOCTOR: '/dashboard/medico',
  RECEPTIONIST: '/dashboard/recepcion',
  ADMIN: '/dashboard',
  OWNER: '/dashboard',
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Authenticated user tries to access auth pages → redirect to their dashboard
    if (token && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      const home = ROLE_HOME[token.role as string] ?? '/dashboard';
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Public paths never need a token
        if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
        // Everything else requires auth
        return !!token;
      },
    },
    pages: { signIn: '/auth/login' },
  },
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
