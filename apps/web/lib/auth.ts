import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        totpCode: { label: 'Código 2FA', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              totpCode: credentials.totpCode || undefined,
            }),
          });

          if (!res.ok) return null;

          const tokens = await res.json();

          const meRes = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          if (!meRes.ok) return null;

          const me = await meRes.json();

          return {
            id: me.id,
            ...tokens,
            role: me.role,
            firstName: me.firstName,
            lastName: me.lastName,
            tenantId: me.tenantId,
            doctorId: me.doctorId ?? null,
            patientId: me.patientId ?? null,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.tenantId = (user as any).tenantId;
        token.doctorId = (user as any).doctorId;
        token.patientId = (user as any).patientId;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.role = token.role as string;
      session.user.doctorId = (token.doctorId as string | null) ?? null;
      session.user.patientId = (token.patientId as string | null) ?? null;
      session.user.name = token.firstName
        ? `${token.firstName} ${token.lastName}`
        : session.user.name;
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60,
  },
};
