import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import WebsiteCard from './components/WebsiteCard';
import AddWebsiteModal from './components/AddWebsiteModal';
import HistoryModal from './components/HistoryModal';
import { fetchStats, fetchWebsites, createWebsite, deleteWebsite, checkWebsite, checkAllWebsites } from './api';
import { Search, Plus, Filter, ShieldCheck, RefreshCw } from 'lucide-react';

export default function App() {
  const [websites, setWebsites] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [checkingIds, setCheckingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, UP, DOWN
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [historyTargetWebsite, setHistoryTargetWebsite] = useState(null);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const [websitesData, statsData] = await Promise.all([
        fetchWebsites(),
        fetchStats(),
      ]);
      setWebsites(websitesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
    // Poll every 15 seconds to keep dashboard fresh
    const interval = setInterval(() => {
      loadData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAddWebsite = async (formData) => {
    const newSite = await createWebsite(formData);
    showToast(`Added ${newSite.name} to monitoring!`, 'success');
    await loadData(false);
  };

  const handleDeleteWebsite = async (id, name) => {
    if (!window.confirm(`Are you sure you want to stop monitoring "${name}"?`)) {
      return;
    }
    try {
      await deleteWebsite(id);
      showToast(`Removed "${name}" from monitoring.`, 'info');
      await loadData(false);
    } catch (err) {
      showToast(err.message || 'Failed to delete website', 'error');
    }
  };

  const handleCheckSingle = async (id) => {
    setCheckingIds((prev) => new Set(prev).add(id));
    try {
      await checkWebsite(id);
      await loadData(false);
      showToast('Website checked successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Check failed', 'error');
    } finally {
      setCheckingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleCheckAll = async () => {
    setIsCheckingAll(true);
    try {
      const res = await checkAllWebsites();
      await loadData(false);
      showToast(`Refreshed ${res.count || 'all'} monitored websites.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to check all websites', 'error');
    } finally {
      setIsCheckingAll(false);
    }
  };

  const filteredWebsites = websites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.url.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    return site.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        onOpenAdd={() => setIsAddModalOpen(true)}
        onCheckAll={handleCheckAll}
        isCheckingAll={isCheckingAll}
      />

      {/* Floating toast notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-xl border shadow-xl flex items-center space-x-2.5 text-xs font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                : notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
                : 'bg-indigo-950/90 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top metrics summary cards */}
        <section>
          <StatsOverview stats={stats} />
        </section>

        {/* Controls: Search, Status filter, Total count */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search websites by name or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({websites.length})
              </button>
              <button
                onClick={() => setFilterStatus('UP')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'UP'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Online ({stats?.online_count ?? 0})
              </button>
              <button
                onClick={() => setFilterStatus('DOWN')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'DOWN'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Offline ({stats?.offline_count ?? 0})
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs text-slate-400">
            <span>Showing {filteredWebsites.length} of {websites.length} websites</span>
            <button
              onClick={() => loadData(false)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Websites Grid */}
        <section>
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs">Loading monitored websites...</p>
            </div>
          ) : filteredWebsites.length === 0 ? (
            <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">
                {searchQuery || filterStatus !== 'ALL' ? 'No matching websites found' : 'No websites monitored yet'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                {searchQuery || filterStatus !== 'ALL'
                  ? 'Try adjusting your search query or status filter.'
                  : 'Start monitoring your websites and APIs by clicking the button below.'}
              </p>
              {!searchQuery && filterStatus === 'ALL' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Website
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredWebsites.map((site) => (
                <WebsiteCard
                  key={site.id}
                  website={site}
                  onCheck={handleCheckSingle}
                  onDelete={handleDeleteWebsite}
                  onShowHistory={(s) => setHistoryTargetWebsite(s)}
                  isChecking={checkingIds.has(site.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <p>UptimeWatch &copy; 2026 – DevOps Website Uptime Monitoring System | Prometheus & Docker Powered</p>
      </footer>

      {/* Modals */}
      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWebsite}
      />

      <HistoryModal
        website={historyTargetWebsite}
        onClose={() => setHistoryTargetWebsite(null)}
      />
    </div>
  );
}
