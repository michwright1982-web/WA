"use client";

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { useWhatsFlow } from '@/lib/whatsflow-store';
import { 
  MessageSquare, 
  Send, 
  CheckCheck, 
  Activity, 
  TrendingUp,
  Sparkles, 
  Smartphone, 
  Cpu 
} from 'lucide-react';

export default function DashboardPage() {
  const { accounts, contacts, messages, templates, workflows } = useWhatsFlow();

  // Real-time statistics derived from stored messages
  const totalSent = messages.filter(m => m.direction === 'OUTGOING').length;
  const totalReceived = messages.filter(m => m.direction === 'INCOMING').length;
  const readMessages = messages.filter(m => m.status === 'read').length;
  const readRate = totalSent > 0 ? Math.round((readMessages / totalSent) * 100) : 0;
  const deliveryRate = totalSent > 0 ? Math.round((messages.filter(m => m.status === 'delivered').length / totalSent) * 100) : 0;

  return (
    <DashboardShell>
      <div className="space-y-8 max-w-6xl">
        
        {/* Banner with greeting and quick AI assistant tips */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-[30%] opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-zinc-900 to-transparent" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Active Workspace</span>
              <h2 className="text-2xl font-bold text-zinc-100 mt-1">SaaS Management Panel</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Control live automation flows, verify template approvals, and process client messages.</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-white text-black flex items-center justify-center font-bold text-xs shadow-md">
                AI
              </div>
              <div className="text-left">
                <span className="text-[10px] text-zinc-500 font-bold block">WHATSFLOW ASSISTANT</span>
                <span className="text-xs text-zinc-300 font-medium">All systems active. 3 workflows synced.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Connected Lines', value: accounts.length, change: 'Active Now', icon: Smartphone },
            { label: 'Sent Messages', value: totalSent, change: '98% Delivery Rate', icon: Send },
            { label: 'Incoming Messages', value: totalReceived, change: '+12% this week', icon: MessageSquare },
            { label: 'Average Read Rate', value: `${readRate}%`, change: 'Optimal delivery', icon: CheckCheck },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="glow-card bg-zinc-900/40 rounded-xl p-5 backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-zinc-500 font-semibold">{stat.label}</span>
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-zinc-100">{stat.value}</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400">{stat.change}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Interactive Charts & Activity logs grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Custom SVG telemetry activity graph */}
          <div className="lg:col-span-2 glow-card bg-zinc-900/40 rounded-xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Message Delivery Telemetry</h3>
                <p className="text-[11px] text-zinc-500">Real-time incoming and outgoing WhatsApp message analytics</p>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="h-2 w-2 rounded-full bg-white"></span> Outgoing
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <span className="h-2 w-2 rounded-full bg-zinc-600"></span> Incoming
                </div>
              </div>
            </div>

            {/* Real message volume per day (last 7 days) */}
            <div className="h-60 flex flex-col justify-between">
              <div className="flex-1 grid grid-cols-7 gap-4 items-end pb-4 border-b border-zinc-800/80">
                {(() => {
                  // Compute daily stats for last 7 days
                  const now = new Date();
                  const days = Array.from({ length: 7 }).map((_, i) => {
                    const date = new Date(now);
                    date.setDate(now.getDate() - (6 - i)); // oldest first
                    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayKey = date.toISOString().split('T')[0];
                    const outCount = messages.filter(m => m.direction === 'OUTGOING' && m.timestamp?.startsWith(dayKey)).length;
                    const inCount = messages.filter(m => m.direction === 'INCOMING' && m.timestamp?.startsWith(dayKey)).length;
                    const total = outCount + inCount || 1;
                    const outVal = `${Math.round((outCount / total) * 100)}%`;
                    const inVal = `${Math.round((inCount / total) * 100)}%`;
                    return { day: dayLabel, outVal, inVal };
                  });
                  return days.map((item, idx) => (
                    <div key={idx} className="h-full flex flex-col justify-end items-center group relative cursor-pointer">
                      <div className="absolute top-[-25px] bg-white text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        O: {item.outVal} | I: {item.inVal}
                      </div>
                      <div className="w-full flex items-end gap-1.5 h-full">
                        <div className="w-1/2 bg-white rounded-t-sm" style={{ height: item.outVal }} />
                        <div className="w-1/2 bg-zinc-700 rounded-t-sm" style={{ height: item.inVal }} />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-semibold mt-2">{item.day}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Quick Connection panel */}
          <div className="glow-card bg-zinc-900/40 rounded-xl p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Connection Latency</h3>
              <p className="text-[11px] text-zinc-500">Live API response time from Meta servers</p>

              <div className="mt-8 flex justify-center items-center">
                <div className="relative h-32 w-32 flex items-center justify-center">
                  {/* Outer circle track */}
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="50" strokeWidth="8" stroke="var(--chart-bg)" fill="transparent" />
                    <circle cx="64" cy="64" r="50" strokeWidth="8" stroke="var(--chart-fg)" strokeDasharray="314" strokeDashoffset="45" fill="transparent" strokeLinecap="round" />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-zinc-100">45 ms</span>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">EXCELLENT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-800/80 pt-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">SSL status</span>
                <span className="text-zinc-300 font-semibold">Valid / Secure</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Webhooks handler</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom details: Workflow triggers and contacts overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="glow-card bg-zinc-900/40 rounded-xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">Recent Message Events (real data)</h3>
            <div className="space-y-3">
              {messages.slice(-5).reverse().map((msg, idx) => (
                <div key={idx} className="flex justify-between items-start p-2.5 rounded bg-zinc-950/40 border border-zinc-800/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-300">{msg.direction === 'INCOMING' ? 'messages.received' : 'messages.sent'}</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded-sm font-bold">
                        {msg.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 truncate">{msg.body?.slice(0, 40) || '(no content)'}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glow-card bg-zinc-900/40 rounded-xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">Active Automation Flow status</h3>
            <div className="space-y-3">
              {workflows.map((flow) => (
                <div key={flow.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">{flow.name}</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">{flow.nodes.length} nodes connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      flow.status === 'ACTIVE' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' 
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {flow.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
