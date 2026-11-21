import React from 'react';
import { ExternalLink, RefreshCw, Trash2, History, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function WebsiteCard({ website, onCheck, onDelete, onShowHistory, isChecking }) {
  const isUp = website.status === 'UP';
  const isDown = website.status === 'DOWN';
  const isPending = website.status === 'PENDING';

  const formatLastChecked = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getLatencyColor = (ms) => {
    if (ms === null || ms === undefined) return 'text-slate-400';
    if (ms < 300) return 'text-emerald-400';
    if (ms < 800) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 backdrop-blur-sm transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base text-white truncate tracking-tight">{website.name}</h3>
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-slate-400 hover:text-indigo-400 transition truncate max-w-full mt-0.5"
            >
              <span className="truncate">{website.url}</span>
              <ExternalLink className="w-3 h-3 ml-1 shrink-0 opacity-70" />
            </a>
          </div>

          <div>
            {isUp && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                UP
              </span>
            )}
            {isDown && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
                DOWN
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-ping" />
                PENDING
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">Status Code</span>
            <span className={`text-sm font-mono font-medium ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'}`}>
              {website.status_code ? `${website.status_code}` : '---'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">Response Time</span>
            <span className={`text-sm font-mono font-medium ${getLatencyColor(website.response_time_ms)}`}>
              {website.response_time_ms !== null && website.response_time_ms !== undefined
                ? `${website.response_time_ms} ms`
                : '---'}
            </span>
          </div>
        </div>

        {website.error_message && (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2 text-rose-300 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-400" />
            <span className="truncate">{website.error_message}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 mt-2 mb-4">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-slate-500" />
            Checked: {formatLastChecked(website.last_checked_at)}
          </span>
          <span className="text-[11px] text-slate-500">
            Interval: {website.check_interval}s
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
        <button
          onClick={() => onCheck(website.id)}
          disabled={isChecking}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isChecking ? 'animate-spin' : ''}`} />
          Check Now
        </button>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onShowHistory(website)}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
            title="View History"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(website.id, website.name)}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
            title="Delete Website"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
