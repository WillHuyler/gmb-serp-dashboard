'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        setErrorMsg('Supabase environment variables are not configured.');
        setLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.session) {
        setErrorMsg(error?.message || 'Authentication failed. Check your credentials.');
        setLoading(false);
        return;
      }

      const syncRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        }),
      });

      if (!syncRes.ok) {
        setErrorMsg('Failed to establish server session.');
        setLoading(false);
        return;
      }

      router.push('/clients');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-8 space-y-6 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-[#D99614]/20 border border-[#D99614] rounded-lg flex items-center justify-center font-mono font-bold text-sm text-[#D99614]">
              PL
            </div>
            <span className="font-bold tracking-wider text-base text-white">PORCHLIGHT</span>
          </div>
          <h1 className="text-xl font-bold text-white pt-3">Agency Sign In</h1>
          <p className="text-xs text-slate-400">
            Authenticate with your authorized agency credentials to access client intelligence workspaces.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D99614]"
              placeholder="you@agency.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D99614]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#D99614] hover:bg-[#B97A08] disabled:opacity-50 text-[#0B0F17] font-semibold text-sm rounded-lg transition-all"
          >
            {loading ? 'Verifying Credentials...' : 'Sign In to PorchLight'}
          </button>
        </form>
      </div>
    </div>
  );
}
