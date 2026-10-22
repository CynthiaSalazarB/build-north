// Which client the app uses, from app/.env (Expo inlines EXPO_PUBLIC_* when it bundles, so nothing
// secret goes in them). No EXPO_PUBLIC_API_URL: the app replays the democracy fixture with no API.
import { createApiClient } from "./api-client.ts";
import type { SessionClient } from "./client.ts";
import { createFixtureClient } from "./fixture-client.ts";

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

/** Clerk's publishable key (#22). Without it nobody signs in, and API calls carry the dev headers. */
export const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || null;

/** With Clerk, `getToken` gives every API call the signed-in learner's session token instead. */
export function createClient(getToken?: () => Promise<string | null>): SessionClient {
  if (!apiUrl) return createFixtureClient();
  if (getToken) return createApiClient({ baseUrl: apiUrl, getToken });
  return createApiClient({
    baseUrl: apiUrl,
    // local dev only; never set EXPO_PUBLIC_DEV_KEY for the deployed web build
    devUser: process.env.EXPO_PUBLIC_DEV_USER?.trim() || "dev",
    devKey: process.env.EXPO_PUBLIC_DEV_KEY?.trim() || null,
  });
}
