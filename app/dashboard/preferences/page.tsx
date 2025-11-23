"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PreferencesIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the first stage (themes)
    router.push("/dashboard/preferences/themes");
  }, [router]);

  return null; // No UI needed since we're redirecting
}
