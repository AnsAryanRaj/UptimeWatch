import React from 'react';
import { Activity, Plus, RefreshCw, BarChart2 } from 'lucide-react';
import { METRICS_URL } from '../api';

export default function Navbar({ onOpenAdd, onCheckAll, isCheckingAll }) {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">UptimeWatch</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">DevOps Website Uptime Monitoring System</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={METRICS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
            title="Prometheus Metrics Endpoint"
          >
            <BarChart2 className="w-4 h-4 mr-1.5 text-indigo-400" />
            /metrics
          </a>

          <button
            onClick={onCheckAll}
            disabled={isCheckingAll}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-medium transition disabled:opacity-50"
            title="Trigger check for all websites"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-slate-300 ${isCheckingAll ? 'animate-spin' : ''}`} />
            Check All
          </button>

          <button
            onClick={onOpenAdd}
            className="inline-flex items-center px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Website
          </button>
        </div>
      </div>
    </header>
  );
}
