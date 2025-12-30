"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to chat (no authentication required)
      router.push("/chat");
  }, [router]);

  return null;
}
