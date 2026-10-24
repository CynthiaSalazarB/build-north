#!/usr/bin/env node
// Fail closed before EAS Hosting deploys the live site: Clerk's test instance shows a development
// banner and cannot serve production sign-in. The matching CLERK_JWT_KEY must also be configured on the API.
const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
if (!key || !/^pk_live_[A-Za-z0-9]+\$$/.test(key)) {
  console.error("Production deploy blocked: set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to the live Clerk instance's pk_live_ key in the EAS production environment.");
  console.error("Also set the matching CLERK_JWT_KEY on the API before shipping production sign-in.");
  process.exitCode = 1;
} else {
  console.log("Production Clerk publishable key is configured.");
}
