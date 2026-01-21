"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { TrendingUp, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    try {
      await register(email, password, name || undefined);
      router.push("/ticker/ABUS");
    } catch {
      // Error is handled by the store
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#131722] to-[#0d1117] p-4">
      <div className="w-full max-w-md bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl">
        <div className="p-6 space-y-1 text-center border-b border-[#2a2e39]">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#2962ff]/10 rounded-full">
              <TrendingUp className="h-8 w-8 text-[#2962ff]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#d1d4dc]">Create an Account</h1>
          <p className="text-sm text-[#787b86]">
            Start analyzing gap patterns today
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {displayError && (
              <div className="p-3 text-sm text-[#ef5350] bg-[#ef5350]/10 rounded-md border border-[#ef5350]/20">
                {displayError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-[#d1d4dc]">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-[#131722] border border-[#2a2e39] rounded-md text-[#d1d4dc] placeholder-[#787b86] focus:outline-none focus:ring-2 focus:ring-[#2962ff] focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[#d1d4dc]">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 bg-[#131722] border border-[#2a2e39] rounded-md text-[#d1d4dc] placeholder-[#787b86] focus:outline-none focus:ring-2 focus:ring-[#2962ff] focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[#d1d4dc]">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 bg-[#131722] border border-[#2a2e39] rounded-md text-[#d1d4dc] placeholder-[#787b86] focus:outline-none focus:ring-2 focus:ring-[#2962ff] focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#d1d4dc]">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 bg-[#131722] border border-[#2a2e39] rounded-md text-[#d1d4dc] placeholder-[#787b86] focus:outline-none focus:ring-2 focus:ring-[#2962ff] focus:border-transparent disabled:opacity-50"
              />
            </div>
          </div>

          <div className="p-6 pt-0 space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#2962ff] hover:bg-[#1e53e4] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-sm text-[#787b86] text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-[#2962ff] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
