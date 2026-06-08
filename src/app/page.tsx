"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { 
  Zap, ArrowRight, MessageCircle, BarChart3, 
  GitFork, Check, Smartphone, Globe, Shield, Activity, Users, Layers
} from 'lucide-react';
import { useWhatsFlow } from '@/lib/whatsflow-store';

export default function Home() {
  const { setTheme } = useWhatsFlow();

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden bg-grid-pattern">
      
      {/* Decorative colored glow orbs */}
      <div className="absolute top-0 left-[20%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <header className="h-20 max-w-7xl w-full mx-auto px-8 flex items-center justify-between z-10 sticky top-0 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-white text-black rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Zap className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="font-semibold text-xl tracking-wider bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            WhatsFlow
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/login" className="glow-btn text-xs font-semibold px-4 py-2 rounded-lg bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col z-10">
        
        {/* Hero Section */}
        <section className="max-w-7xl w-full mx-auto px-8 pt-24 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800/80 text-[11px] font-semibold text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span>WhatsFlow 2.0 is now live</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] bg-gradient-to-b from-zinc-50 via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Centralize your <br />WhatsApp API
            </h1>

            <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
              Connect Meta credentials, design drag-and-drop automation workflows, manage support inquiries in real-time, and sync interactive templates effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
              <Link href="/login" className="glow-btn flex items-center gap-2 font-semibold text-sm px-8 py-4 rounded-xl bg-white text-black shadow-2xl w-full sm:w-auto justify-center">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="flex items-center justify-center gap-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-sm font-semibold px-8 py-4 rounded-xl transition-all w-full sm:w-auto">
                <Shield className="h-4 w-4" /> Explore Features
              </a>
            </div>
            
            <div className="pt-4 flex items-center gap-4 text-xs text-zinc-500 font-medium">
              <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-zinc-300" /> No credit card required</div>
              <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-zinc-300" /> 14-day free trial</div>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden flex items-center justify-center glow-card shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 opacity-60"></div>
            <img 
              src="/dashboard-mockup.png" 
              alt="WhatsFlow Dashboard Mockup" 
              className="absolute inset-0 w-full h-full object-cover object-left-top transform group-hover:scale-105 transition-transform duration-700 ease-in-out" 
            />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 border-t border-zinc-900 bg-zinc-950/50">
          <div className="max-w-7xl w-full mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Powerful capabilities built for scale</h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Everything you need to automate your WhatsApp Business API communication without writing a single line of code.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: GitFork, title: "Visual Node Builder", desc: "Design complex conversational flows with a simple drag-and-drop canvas." },
                { icon: MessageCircle, title: "Shared Team Inbox", desc: "Manage all customer interactions in a WhatsApp-Web-style console." },
                { icon: Layers, title: "Template Sync", desc: "Create, submit, and sync approved Meta templates instantly." },
                { icon: BarChart3, title: "Advanced Analytics", desc: "Track message delivery, read receipts, and user engagement metrics." },
                { icon: Shield, title: "Enterprise Security", desc: "End-to-end encryption and compliance with Meta's strict privacy policies." },
                { icon: Globe, title: "API Integrations", desc: "Connect with your existing CRM, payment gateways, and databases via webhooks." }
              ].map((feature, i) => (
                <div key={i} className="glow-card bg-zinc-900/40 p-8 rounded-2xl border border-zinc-800/80 flex flex-col items-start">
                  <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24">
          <div className="max-w-7xl w-full mx-auto px-8">
            <div className="mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">How it works</h2>
              <p className="text-zinc-400 text-lg max-w-2xl">Deploy enterprise-grade WhatsApp automation in minutes, not months.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-[1px] bg-gradient-to-r from-zinc-800 via-zinc-500 to-zinc-800 z-0"></div>
              
              {[
                { step: "01", title: "Connect API", desc: "Link your Meta Business Account and verify your WhatsApp number securely." },
                { step: "02", title: "Design Flows", desc: "Map out customer journeys and automate responses using our visual builder." },
                { step: "03", title: "Engage & Scale", desc: "Launch campaigns, manage support tickets, and analyze performance." }
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center gap-6">
                  <div className="h-16 w-16 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center font-bold text-xl text-white shadow-xl shadow-zinc-900/50">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 border-t border-zinc-900 bg-zinc-950/50">
          <div className="max-w-7xl w-full mx-auto px-8">
             <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Choose the perfect plan for your business scale. No hidden fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Starter */}
              <div className="glow-card bg-zinc-900/40 p-8 rounded-2xl border border-zinc-800/80 flex flex-col">
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Starter</h3>
                <p className="text-zinc-400 text-sm mb-6">Perfect for small businesses just getting started.</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$49</span>
                  <span className="text-zinc-500 text-sm">/month</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['1 WhatsApp Number', 'Up to 5,000 conversations/mo', 'Basic Visual Flow Builder', 'Email Support'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-zinc-500" /> {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="w-full py-3 rounded-lg border border-zinc-700 text-zinc-300 font-semibold text-sm hover:bg-zinc-800 transition-all text-center">
                  Start Free Trial
                </Link>
              </div>

              {/* Professional */}
              <div className="border-glow bg-zinc-900 p-8 rounded-2xl flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-white/5">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
                <p className="text-zinc-400 text-sm mb-6">For growing teams requiring advanced automation.</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$149</span>
                  <span className="text-zinc-500 text-sm">/month</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['3 WhatsApp Numbers', 'Up to 25,000 conversations/mo', 'Advanced Node Features', 'API & Webhooks', 'Priority Support'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white">
                      <Check className="h-4 w-4 text-white" /> {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="glow-btn w-full py-3 rounded-lg font-semibold text-sm text-center">
                  Get Started
                </Link>
              </div>

              {/* Enterprise */}
              <div className="glow-card bg-zinc-900/40 p-8 rounded-2xl border border-zinc-800/80 flex flex-col">
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Enterprise</h3>
                <p className="text-zinc-400 text-sm mb-6">Custom solutions for large-scale operations.</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">Custom</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Unlimited WhatsApp Numbers', 'Unlimited conversations', 'Custom Node Development', 'Dedicated Account Manager', 'SLA Guarantee'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-zinc-500" /> {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="w-full py-3 rounded-lg border border-zinc-700 text-zinc-300 font-semibold text-sm hover:bg-zinc-800 transition-all text-center">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden flex flex-col items-center">
          <div className="absolute inset-0 bg-green-500/10 blur-[120px] rounded-full max-w-2xl mx-auto pointer-events-none"></div>
          
          <div className="relative z-10 mb-10 h-48 w-48 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-green-500/20">
             <img src="/3d-icon.png" alt="WhatsApp Automation 3D" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="max-w-4xl w-full mx-auto px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">Ready to automate your communication?</h2>
            <p className="text-xl text-zinc-400 mb-10">Join thousands of businesses scaling their customer engagement with WhatsFlow.</p>
            <Link href="/login" className="glow-btn inline-flex items-center gap-2 font-semibold px-10 py-5 rounded-xl bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] text-lg">
              Start your 14-day free trial
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 pt-16 pb-8 px-8 z-10 relative">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-white text-black rounded-lg flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <Zap className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="font-semibold text-lg tracking-wider text-white">
                WhatsFlow
              </span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              The centralized platform for WhatsApp Business API automation and management.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl w-full mx-auto border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <span>© 2026 WhatsFlow Inc. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
