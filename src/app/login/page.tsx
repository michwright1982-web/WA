"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Shield, ArrowLeft } from 'lucide-react';
import { useWhatsFlow } from '@/lib/whatsflow-store';

export default function LoginPage() {
  const router = useRouter();
  const { setTheme } = useWhatsFlow();

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-hidden bg-grid-pattern">
      
      {/* Decorative colored glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-800/10 rounded-full blur-[120px]" />

      {/* Header bar */}
      <header className="h-20 max-w-7xl w-full mx-auto px-8 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 bg-white text-black rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Zap className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="font-semibold text-xl tracking-wider bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            WhatsFlow
          </span>
        </Link>
        <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </header>

      {/* Main Login Area */}
      <main className="max-w-7xl w-full mx-auto px-8 py-16 flex justify-center items-center z-10 flex-1">
        <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative">
          <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 px-2 py-0.5 rounded-md font-mono">
            v1.0.0
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-zinc-100">Welcome back</h2>
            <p className="text-zinc-500 text-xs">Enter your details to access the SaaS admin control</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Business Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
                <input type="checkbox" className="rounded bg-zinc-950 border-zinc-800 accent-white" />
                Remember me
              </label>
              <a href="#" className="text-zinc-500 hover:text-zinc-300">Forgot password?</a>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {isSubmitting ? 'Signing in...' : 'Login with Enterprise ID'}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <span className="relative bg-zinc-900 px-3 text-[11px] text-zinc-500 font-bold uppercase">Or quick access</span>
          </div>

          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/50 text-xs font-semibold text-zinc-300 transition-all flex items-center justify-center gap-2"
          >
            <Shield className="h-4 w-4 text-zinc-400" /> Skip to Dashboard
          </button>
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="h-16 border-t border-zinc-900 bg-zinc-950/60 flex items-center justify-between px-8 max-w-7xl w-full mx-auto text-xs text-zinc-600 z-10">
        <span>© 2026 WhatsFlow Inc. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-zinc-400">Terms of Service</Link>
          <Link href="#" className="hover:text-zinc-400">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
