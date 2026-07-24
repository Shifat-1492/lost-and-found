/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Item, AppStats } from '../types';
import { Check, X, ShieldAlert, Folder, Tag, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  onSelectItem: (item: Item) => void;
  triggerRefresh: boolean;
  onRefreshTrigger: () => void;
}

export default function AdminPanel({ onSelectItem, triggerRefresh, onRefreshTrigger }: AdminPanelProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<AppStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadAdminMetrics = async () => {
    setLoading(true);
    try {
      // Load and apply list items
      const itemsResponse = await fetch(`/api/items?status=${activeTab}`);
      if (!itemsResponse.ok) throw new Error();
      const itemsData = await itemsResponse.json();
      setItems(itemsData);

      // Load quick metrics
      const statsResponse = await fetch('/api/items/stats');
      if (!statsResponse.ok) throw new Error();
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch {
      setErrorText('Could not load administrative console information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, [activeTab, triggerRefresh]);

  const handleUpdateStatus = async (itemId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        throw new Error();
      }
      onRefreshTrigger();
    } catch {
      setErrorText('Failed to update item moderation status.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      onRefreshTrigger();
    } catch {
      setErrorText('Failed to delete item listing.');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total reports</span>
          <span className="text-3xl font-display font-black text-indigo-400 mt-2">{stats.total}</span>
        </div>
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col justify-between shadow-md border-amber-500/20">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Approval</span>
          <span className="text-3xl font-display font-black text-amber-400 mt-2">{stats.pending}</span>
        </div>
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col justify-between shadow-md border-emerald-500/20">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved Feed</span>
          <span className="text-3xl font-display font-black text-emerald-400 mt-2">{stats.approved}</span>
        </div>
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col justify-between shadow-md border-red-500/20">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rejected Logs</span>
          <span className="text-3xl font-display font-black text-red-400 mt-2">{stats.rejected}</span>
        </div>
      </div>

      {errorText && (
        <div className="p-3 bg-red-400/10 border border-red-500/20 text-red-300 text-sm rounded-xl">
          {errorText}
        </div>
      )}

      {/* Tabs list selecting */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <div className="flex space-x-2">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => {
            const active = activeTab === tab;
            let theme = 'text-slate-400 hover:text-white';
            if (active) {
              if (tab === 'pending') theme = 'bg-amber-500/10 text-amber-300 border-b-2 border-amber-500';
              if (tab === 'approved') theme = 'bg-emerald-500/10 text-emerald-300 border-b-2 border-emerald-500';
              if (tab === 'rejected') theme = 'bg-red-500/10 text-red-300 border-b-2 border-red-500';
            }
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setErrorText('');
                }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all focus:outline-hidden cursor-pointer ${theme}`}
              >
                {tab} ({(stats as any)[tab]})
              </button>
            );
          })}
        </div>

        <button
          onClick={loadAdminMetrics}
          className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Data items display list */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="h-6 w-6 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
          <span>Retrieving records metrics...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 text-center bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl text-slate-400">
          <Check className="h-8 w-8 mx-auto text-slate-500 bg-slate-900/40 border border-slate-700 p-1.5 rounded-full mb-2" />
          <p className="text-xs font-semibold">No {activeTab} item records present</p>
          <p className="text-[10px] text-slate-400 mt-1">Excellent job! All files have been processed by moderation filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="p-4 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col md:flex-row md:items-center justify-between hover:border-slate-600 transition-all cursor-pointer gap-4"
            >
              <div className="flex items-start space-x-3 min-w-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-14 w-14 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-sm font-bold text-white truncate">{item.title}</span>
                    <span className={`px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase text-white ${
                      item.type === 'lost' ? 'bg-red-500' : 'bg-emerald-500'
                    }`}>
                      {item.type}
                    </span>
                    <span className="px-1.5 py-0.2 bg-slate-900 rounded-xs text-[9px] uppercase font-bold text-slate-400 border border-slate-700">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1">{item.description}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Reporter: <strong className="text-indigo-300">{item.userName}</strong> ({item.userEmail}) • Posted {formatDate(item.datePosted)}
                  </p>
                </div>
              </div>

              {/* Moderation Controls */}
              <div className="flex items-center space-x-2 justify-end self-end md:self-center shrink-0">
                {activeTab === 'pending' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(item.id, 'approved');
                      }}
                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(item.id, 'rejected');
                      }}
                      className="px-3 py-1.5 bg-red-500/15 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {activeTab === 'approved' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(item.id, 'rejected');
                    }}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:border-amber-500 text-amber-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Move to Rejected
                  </button>
                )}

                {activeTab === 'rejected' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(item.id, 'approved');
                    }}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-600 hover:border-emerald-500 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold border border-emerald-500/20 cursor-pointer"
                  >
                    Re-approve Listing
                  </button>
                )}

                {/* Permanent Delete */}
                {confirmDeleteId === item.id ? (
                  <div className="flex items-center space-x-1.5 bg-red-950/40 border border-red-500/20 px-2 py-1 rounded-lg animate-in fade-in zoom-in-95 duration-100">
                    <span className="text-[10px] text-red-300 font-bold uppercase">Sure?</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                      className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-bold cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(item.id);
                    }}
                    title="Permanently Delete Listing"
                    className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-red-500 hover:text-white text-slate-400 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
