// Which client the app uses, from app/.env (Expo inlines EXPO_PUBLIC_* when it bundles, so nothing
// secret goes in them). No EXPO_PUBLIC_API_URL: the app replays the democracy fixture with no API.
import { createApiClient } from "./api-client.ts";
import type { SessionClient } from "./client.ts";
import { createFixtureClient } from "./fixture-client.ts";

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const client: SessionClient = apiUrl
  ? createApiClient({
      baseUrl: apiUrl,
      // local dev only, until Clerk (#22); never set EXPO_PUBLIC_DEV_KEY for the deployed web build
      devUser: process.env.EXPO_PUBLIC_DEV_USER?.trim() || "dev",
      devKey: process.env.EXPO_PUBLIC_DEV_KEY?.trim() || null,
    })
  : createFixtureClient();
