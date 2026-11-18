import type { QueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/** Only same-origin paths survive a sign-in redirect. */
export function safeRedirect(value: unknown, fallback = "/overview"): string {
  if (typeof value !== "string") return fallback;
  try {
    const url = new URL(value, "http://local");
    if (url.origin !== "http://local") return fallback;
    const path = `${url.pathname}${url.search}`;
    if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/auth")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

export async function signOut(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}

export function authErrorMessage(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "";
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again or reset your password.";
  if (/email not confirmed/i.test(message)) return "Confirm your email first — check your inbox for the link we sent.";
  if (/already registered|already exists/i.test(message)) return "An account with this email already exists. Sign in instead.";
  if (/password/i.test(message) && /characters|weak|short/i.test(message)) return "Use a stronger password with at least 8 characters.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  return message || "Something went wrong. Please try again.";
}
