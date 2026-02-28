"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Briefcase, TrendingUp, Building2, Loader2 } from "lucide-react";

function getSupabase() {
  return createClient();
}

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<
    "investor" | "borrower" | null
  >(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function getClient() {
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabase();
    }
    return supabaseRef.current;
  }

  useEffect(() => {
    async function checkUser() {
      const supabase = getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // If user already has a profile, redirect to their dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        router.push(`/${profile.role}/dashboard`);
        return;
      }

      // Pre-fill name from auth metadata if available
      const meta = user.user_metadata;
      if (meta?.full_name) setFullName(meta.full_name);
      else if (meta?.name) setFullName(meta.name);

      setCheckingAuth(false);
    }

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email!,
        role: selectedRole,
        full_name: fullName || null,
        company_name: companyName || null,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push(`/${selectedRole}/dashboard`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a2b4a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1a2b4a] mb-4">
              <Briefcase className="h-6 w-6 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a2b4a]">
              Welcome to Requity Group
            </h1>
            <p className="text-muted-foreground mt-2">
              Set up your account to get started
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Company Name (optional)
              </label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                I am a...
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("investor")}
                  className={`flex flex-col items-center gap-3 p-5 rounded-lg border-2 transition-all ${
                    selectedRole === "investor"
                      ? "border-[#1a2b4a] bg-[#1a2b4a]/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <TrendingUp
                    className={`h-8 w-8 ${
                      selectedRole === "investor"
                        ? "text-[#1a2b4a]"
                        : "text-slate-400"
                    }`}
                  />
                  <div className="text-center">
                    <p
                      className={`font-medium ${
                        selectedRole === "investor"
                          ? "text-[#1a2b4a]"
                          : "text-slate-700"
                      }`}
                    >
                      Investor
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      View funds, capital calls &amp; distributions
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("borrower")}
                  className={`flex flex-col items-center gap-3 p-5 rounded-lg border-2 transition-all ${
                    selectedRole === "borrower"
                      ? "border-[#1a2b4a] bg-[#1a2b4a]/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Building2
                    className={`h-8 w-8 ${
                      selectedRole === "borrower"
                        ? "text-[#1a2b4a]"
                        : "text-slate-400"
                    }`}
                  />
                  <div className="text-center">
                    <p
                      className={`font-medium ${
                        selectedRole === "borrower"
                          ? "text-[#1a2b4a]"
                          : "text-slate-700"
                      }`}
                    >
                      Borrower
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manage loans, draws &amp; payments
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedRole}
              className="w-full h-10 px-4 py-2 bg-[#1a2b4a] text-white rounded-md text-sm font-medium hover:bg-[#243a5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {loading ? "Setting up..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
