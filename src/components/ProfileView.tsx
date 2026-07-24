/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Item } from '../types';
import { Tag, Calendar, MapPin, AlertCircle, Trash2, ShieldCheck, HelpCircle } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  onSelectItem: (item: Item) => void;
  triggerRefresh: boolean;
  onRefreshTrigger: () => void;
}

interface Stats {
  totalPosts: number;
  lostItems: number;
  foundItems: number;
}

export default function ProfileView({
  currentUser,
  onSelectItem,
  triggerRefresh,
  onRefreshTrigger
}: ProfileViewProps) {
  const [stats, setStats] = useState<Stats>({ totalPosts: 0, lostItems: 0, foundItems: 0 });
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorValue, setErrorValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadProfileInfo = async () => {
    setLoading(true);
    try {
      // stats
      const statsRes = await fetch(`/api/users/${currentUser.id}/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);

      // items created by userId
      const itemsRes = await fetch(`/api/items?userId=${currentUser.id}`);
      const itemsData = await itemsRes.json();
      setItems(itemsData);
    } catch {
      setErrorValue('Could not load profile statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileInfo();
  }, [currentUser.id, triggerRefresh]);

  const handleDeleteItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // prevent opening details
    try {
      const response = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error();
      }
      onRefreshTrigger();
    } catch {
      setErrorValue('Delete request failed.');
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
    <div className="space-y-8 font-sans">
      
      {/* Profile info cards */}
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=profiler'}
            alt="avatar"
            className="h-16 w-16 rounded-full border-2 border-indigo-400 p-0.5 bg-slate-900"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=user';
            }}
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-display font-black text-white">{currentUser.name}</h2>
              {currentUser.role === 'admin' ? (
                <span className="bg-violet-500/10 text-violet-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-violet-500/30 flex items-center space-x-1">
                  <ShieldCheck className="h-3 w-3 inline" />
                  <span>Admin Mode</span>
                </span>
              ) : (
                <span className="bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/20">
                  General User
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        {/* Big counters layout */}
        <div className="grid grid-cols-3 gap-6 text-center w-full md:w-auto border-t md:border-t-0 border-slate-700/50 pt-4 md:pt-0">
          <div className="px-4">
            <span className="text-2xl font-display font-black text-white">{stats.totalPosts}</span>
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Total Posts</span>
          </div>
          <div className="px-4 border-x border-slate-700/50">
            <span className="text-2xl font-display font-black text-red-400">{stats.lostItems}</span>
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Lost Items</span>
          </div>
          <div className="px-4">
            <span className="text-2xl font-display font-black text-emerald-400">{stats.foundItems}</span>
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Found Items</span>
          </div>
        </div>
      </div>

      {errorValue && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl">
          {errorValue}
        </div>
      )}

      {/* User's own items lists with admin state indicators */}
      <div className="space-y-4">
        <h3 className="text-lg font-display font-bold text-white flex items-center space-x-2">
          <span>My Reporting History</span>
          <span className="text-xs font-normal text-slate-400">({items.length} items submitted)</span>
        </h3>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="h-6 w-6 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
            <span>Fetching private logs...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl text-slate-400">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs font-medium">You haven't reported any items yet!</p>
            <p className="text-[10px] text-slate-400 mt-1">Report lost/found belongings using the header "Post Item" button.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group p-4 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between hover:border-slate-600 cursor-pointer transition-all gap-4"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-12 w-12 rounded-xl object-cover bg-slate-900 border border-slate-700 grow-0 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {item.title}
                      </p>
                      <span className={`px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase inline ${
                        item.type === 'lost' ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {item.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400 font-medium mt-1">
                      <span className="truncate">{item.location}</span>
                      <span>•</span>
                      <span>{formatDate(item.datePosted)}</span>
                    </div>
                  </div>
                </div>

                {/* Badges controls side */}
                <div className="flex items-center space-x-3 shrink-0">
                  {/* Status Indicator */}
                  {item.status === 'pending' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Pending Approval
                    </span>
                  )}
                  {item.status === 'approved' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Approved
                    </span>
                  )}
                  {item.status === 'rejected' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-300 border border-red-500/20">
                      Rejected
                    </span>
                  )}

                  {/* Manual Delete action button */}
                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center space-x-1.5 bg-red-950/40 border border-red-500/20 px-2 py-1 rounded-lg animate-in fade-in zoom-in-95 duration-100">
                      <span className="text-[10px] text-red-300 font-bold uppercase">Sure?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(e, item.id);
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
                        className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded text-[10px] font-bold cursor-pointer"
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
                      title="Delete permanently"
                      className="p-1 px-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
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

    </div>
  );
}
