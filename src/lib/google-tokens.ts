import "server-only";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Get valid Google API tokens for a user.
 * If the access token has expired, refresh it using the refresh token.
 */
export async function getGoogleTokens(userId: string): Promise<TokenData | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
    select: {
      encrypted_access_token: true,
      encrypted_refresh_token: true,
      token_expires_at: true,
    },
  });

  if (!account?.encrypted_access_token || !account?.encrypted_refresh_token) {
    return null;
  }

  const accessToken = decrypt(account.encrypted_access_token);
  const refreshToken = decrypt(account.encrypted_refresh_token);
  const expiresAt = account.token_expires_at ?? new Date(0);

  // If token is still valid (with 5 min buffer), return it
  if (expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return { accessToken, refreshToken, expiresAt };
  }

  // Token expired — refresh it
  const refreshed = await refreshGoogleToken(refreshToken);
  if (!refreshed) {
    return null;
  }

  // Update encrypted tokens in DB
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await prisma.account.updateMany({
    where: {
      userId,
      provider: "google",
    },
    data: {
      encrypted_access_token: encrypt(refreshed.access_token),
      token_expires_at: newExpiresAt,
      access_token: refreshed.access_token,
      expires_at: Math.floor(newExpiresAt.getTime() / 1000),
    },
  });

  return {
    accessToken: refreshed.access_token,
    refreshToken,
    expiresAt: newExpiresAt,
  };
}

async function refreshGoogleToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh Google token:", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return null;
  }
}
