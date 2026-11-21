import React from 'react';
import { Globe, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';

export default function StatsOverview({ stats }) {
  const cards = [
    {
      label: 'Monitored Websites',
      value: stats?.total_monitored ?? 0,
      icon: Globe,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: 'Online Websites',
      value: stats?.online_count ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Offline Websites',
      value: stats?.offline_count ?? 0,
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
    {
      label: 'Avg Response Time',
      value: stats ? `${stats.avg_response_time_ms} ms` : '0 ms',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Overall Uptime',
      value: stats ? `${stats.uptime_percentage}%` : '100%',
      icon: Zap,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border bg-slate-800/40 backdrop-blur-sm ${card.border} transition hover:bg-slate-800/60`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
}
