"use client";

import { useEffect, useState } from "react";

import { isAuthenticated } from "@/lib/auth";
import { hydrateSessionFromCookies } from "@/lib/auth-session";

export function useLandingAuth() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    hydrateSessionFromCookies();
    setAuthed(isAuthenticated());
  }, []);

  return authed;
}
