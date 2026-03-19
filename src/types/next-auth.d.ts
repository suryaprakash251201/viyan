import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterAccount {
    encrypted_access_token?: string;
    encrypted_refresh_token?: string;
    token_expires_at?: Date;
  }
}
