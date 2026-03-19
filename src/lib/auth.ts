import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import type { NextAuthConfig } from "next-auth";

export const GOOGLE_OAUTH_SCOPE =
  "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: GOOGLE_OAUTH_SCOPE,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ account }) {
      // Encrypt tokens before storing
      if (account) {
        if (account.access_token) {
          account.encrypted_access_token = encrypt(account.access_token);
        }
        if (account.refresh_token) {
          account.encrypted_refresh_token = encrypt(account.refresh_token);
        }
        if (account.expires_at) {
          account.token_expires_at = new Date(account.expires_at * 1000);
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false; // Redirect to /login
      }

      return true;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
