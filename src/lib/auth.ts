import NextAuth, { type NextAuthConfig } from 'next-auth'
import { NeonAdapter } from './auth-adapter'
import { AUTH_SECRET } from './auth-cookie'

/**
 * Auth.js (next-auth v5) configuration.
 *
 * The portal uses a custom magic-link flow (no built-in providers): tokens are
 * minted directly in /api/auth/magic via `encode()`. NextAuth here mainly powers
 * the session endpoint (`useSession`) and sign-out. `secret` is pinned to the
 * existing NEXTAUTH_SECRET and `trustHost` is enabled for Vercel.
 */
export const authConfig: NextAuthConfig = {
  adapter: NeonAdapter(),
  session: { strategy: 'jwt' },
  // If unset, Auth.js throws a clear MissingSecretError on the first request;
  // we don't throw at import so build-time page-data collection still runs.
  secret: AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: '/client/login',
    error: '/client/login?error=1',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.clientId = user.id
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.clientId as string
      }
      return session
    },
    async redirect() {
      return '/client/dashboard'
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
