import React, { useEffect, useState } from 'react';
import { X, History, CheckCircle, XCircle, Clock } from 'lucide-react';
import { fetchWebsiteHistory } from '../api';

export default function HistoryModal({ website, onClose }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!website) return;
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchWebsiteHistory(website.id, 30);
        if (isMounted) setHistory(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load history');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [website]);

  if (!website) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Check History: {website.name}</h3>
              <p className="text-xs text-slate-400 truncate max-w-sm">{website.url}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs">Loading check history...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!isLoading && !error && history.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No check history recorded yet.
            </div>
          )}

          {!isLoading && !error && history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">HTTP Code</th>
                    <th className="pb-3 px-3">Response Time</th>
                    <th className="pb-3 px-3">Timestamp</th>
                    <th className="pb-3 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((item) => {
                    const isUp = item.status === 'UP';
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                              isUp
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-300">
                          {item.status_code || '---'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {item.response_time_ms !== null && item.response_time_ms !== undefined
                            ? `${item.response_time_ms} ms`
                            : '---'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {new Date(item.checked_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-400 truncate max-w-xs">
                          {item.error_message || 'OK'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
