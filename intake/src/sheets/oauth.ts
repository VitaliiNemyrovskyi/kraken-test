import { google } from "googleapis";
import { config, hasGoogleCreds } from "../config.js";
import { oauthRepo } from "../storage/db.js";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export function makeOAuthClient() {
  return new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(): string {
  if (!hasGoogleCreds) {
    throw new Error("GOOGLE_CLIENT_ID/SECRET not configured in .env");
  }
  const client = makeOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = makeOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token || !tokens.access_token || !tokens.expiry_date) {
    throw new Error(
      "Google did not return refresh_token. Revoke previous grant at https://myaccount.google.com/permissions and retry.",
    );
  }
  oauthRepo.save({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date,
    scope: tokens.scope ?? SCOPES.join(" "),
  });
}

export function getAuthedClient() {
  const stored = oauthRepo.get();
  if (!stored) return null;
  const client = makeOAuthClient();
  client.setCredentials({
    access_token: stored.accessToken,
    refresh_token: stored.refreshToken,
    expiry_date: stored.expiryDate,
    scope: stored.scope,
  });
  client.on("tokens", (tokens) => {
    if (tokens.access_token && tokens.expiry_date) {
      oauthRepo.save({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? stored.refreshToken,
        expiryDate: tokens.expiry_date,
        scope: tokens.scope ?? stored.scope,
      });
    }
  });
  return client;
}

export function isAuthorized(): boolean {
  return oauthRepo.get() !== null;
}
