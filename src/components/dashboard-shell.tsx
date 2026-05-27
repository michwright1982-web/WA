"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWhatsFlow } from '@/lib/whatsflow-store';
import { 
  LayoutDashboard, 
  MessageSquare, 
  GitFork, 
  FileCode, 
  Users, 
  BarChart3, 
  Key, 
  Activity, 
  Sparkles, 
  LogOut, 
  Settings,
  Zap,
  Sun,
  Moon
} from 'lucide-react';

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { accounts, activeAccountId, setActiveAccountId, theme, toggleTheme } = useWhatsFlow();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Chat Inbox', href: '/chat', icon: MessageSquare, badge: 'Live' },
    { name: 'Flow Builder', href: '/workflows', icon: GitFork },
    { name: 'Templates Manager', href: '/templates', icon: FileCode },
    { name: 'CRM Contacts', href: '/contacts', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'API Credentials', href: '/credentials', icon: Key },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 bg-grid-pattern text-zinc-100">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/60 backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Logo Brand */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-800/80">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-9 w-9 bg-white text-black rounded-lg flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                <Zap className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="font-semibold text-lg tracking-wide bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                WhatsFlow
              </span>
            </Link>
          </div>

          {/* Account Selector Widget */}
          <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/20">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
              Active WA Account
            </label>
            <select
              value={activeAccountId}
              onChange={(e) => setActiveAccountId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-2 text-xs font-medium text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.status})
                </option>
              ))}
            </select>

            {/* Micro Badge indicator */}
            <div className="mt-2.5 flex items-center gap-2 text-[10px] text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>API Connection Status: Connected</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]' 
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-white/10 text-white border border-white/10">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile / Status Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-300 flex items-center justify-center font-bold text-black text-sm">
                AD
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-200">Admin User</span>
                <span className="text-[10px] text-zinc-500">Enterprise Plan</span>
              </div>
            </div>
            <button className="text-zinc-500 hover:text-zinc-200 transition-colors">
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>

          {showProfileDropdown && (
            <div className="absolute bottom-16 left-4 right-4 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-3 py-1.5 border-b border-zinc-800/80 mb-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Role: Super Admin</p>
              </div>
              <Link href="/credentials" className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-zinc-800 text-zinc-300">
                <Key className="h-3.5 w-3.5" /> Credentials
              </Link>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-red-950/30 text-red-400 text-left">
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel Frame */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-md px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-zinc-400 capitalize">
              {pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </h1>
            <span className="text-zinc-700">|</span>
            <span className="text-xs text-zinc-500">
              ID: {activeAccount?.phoneNumberId || 'N/A'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick action buttons */}
            <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <span className="text-[11px] px-2.5 py-1 text-zinc-400 font-medium">Meta Status:</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Live
              </span>
            </div>

            <Link href="/chat" className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:text-white transition-all">
              <MessageSquare className="h-3.5 w-3.5" /> Inbox
            </Link>

            {/* Premium Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-yellow-450" />}
            </button>
          </div>
        </header>

        {/* Page Inner Canvas */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </main>
      
    </div>
  );
};
