'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useClient } from '../../lib/client-context';

export default function LoginPage() {
  const router = useRouter();
  const { refreshClients } = useClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setErrorMessage('Supabase environment configuration is missing.');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data?.session?.access_token) {
        setErrorMessage(error?.message || 'Invalid email or password.');
        return;
      }

      // Establish server-side HTTP-only session cookies
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });

      if (!sessionRes.ok) {
        const errPayload = await sessionRes.json().catch(() => null);
        setErrorMessage(
          errPayload?.error?.message || 'Failed to establish server session.'
        );
        return;
      }

      // CR-023 Requirement #2: Synchronously update shared ClientContext before navigation
      const loadedClients = await refreshClients();
      const firstClientId = loadedClients[0]?.id;

      router.push(
        firstClientId
          ? `/command-center?clientId=${encodeURIComponent(firstClientId)}`
          : '/command-center'
      );
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected authentication error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F7FB] flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-[#DCE5EF] rounded-2xl shadow-lg p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-[#DCE5EF] pb-5">
          <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] flex items-center justify-center shadow-sm shrink-0">
            <svg
              className="w-5 h-5 text-[#D99614]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#0B1F3A] tracking-tight">
              PORCHLIGHT SEARCH INTELLIGENCE
            </h1>
            <p className="text-xs font-semibold text-[#D99614] uppercase tracking-wider">
              OtterWatch SERP & Multi-Tenant Telemetry
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-[#0B1F3A]">
            Administrator & Agency Sign In
          </h2>
          <p className="text-xs text-slate-600">
            Authenticate with your Supabase credentials to access authorized tenant portfolios.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-bold text-[#0B1F3A] mb-1.5"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.com"
              className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1F3A] font-medium focus:outline-none focus:ring-2 focus:ring-[#D99614]"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-[#0B1F3A] mb-1.5"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1F3A] font-medium focus:outline-none focus:ring-2 focus:ring-[#D99614]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-[#0B1F3A] hover:bg-[#16325B] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
          >
            {submitting ? 'Verifying Session & Tenant Access...' : 'Sign In to Workspace →'}
          </button>
        </form>
      </div>
    </div>
  );
}
