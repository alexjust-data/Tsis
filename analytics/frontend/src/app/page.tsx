"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    // Redirect based on authentication status
    if (token) {
      router.push("/ticker/ABUS");
    } else {
      router.push("/login");
    }
  }, [router, token]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2962ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#787b86]">Loading...</p>
      </div>
    </div>
  );
}
