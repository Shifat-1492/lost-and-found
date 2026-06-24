/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { MapPin, Calendar, Folder, Tag, AlertCircle, RefreshCw } from 'lucide-react';

interface HomeFeedProps {
  onSelectItem: (item: Item) => void;
  triggerRefresh: boolean;
}

const CATEGORIES = [
  'All Categories',
  'Wallet',
  'Phone',
  'Keys',
  'Card',
  'Laptop',
  'Bag',
  'Documents',
  'Watch',
  'Other'
];

export default function HomeFeed({ onSelectItem, triggerRefresh }: HomeFeedProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [itemType, setItemType] = useState<'all' | 'lost' | 'found'>('all');
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'All Categories') params.append('category', category);
      if (itemType !== 'all') params.append('type', itemType);
      
      const response = await fetch(`/api/items?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load feed items');
      }
      const data = await response.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Could not fetch items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search, category, itemType, triggerRefresh]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Hub */}
      <div className="bg-slate-800/90 border border-slate-700 md:p-6 p-4 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-56">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All Categories' ? '🎒 All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tab selectors (All, Lost, Found) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex space-x-1 p-1 bg-slate-900/60 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setItemType('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                itemType === 'all'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setItemType('lost')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                itemType === 'lost'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lost
            </button>
            <button
              onClick={() => setItemType('found')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                itemType === 'found'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Found
            </button>
          </div>

          <button
            onClick={fetchItems}
            title="Refresh database feed"
            className="p-2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid listing */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-10 w-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Retrieving verified listings...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl p-6">
          <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 border border-slate-700">
            <Tag className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-white">No items found</h3>
          <p className="text-sm text-slate-400 max-w-md mt-1">
            We couldn't find any results match your criteria. Try adjusting filters or search query!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="group bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col cursor-pointer"
            >
              {/* Image box */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                
                {/* Status Badges */}
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold leading-none tracking-wide text-white uppercase shadow-md ${
                  item.type === 'lost' ? 'bg-red-500' : 'bg-emerald-500'
                }`}>
                  {item.type}
                </span>

                <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold text-slate-300 bg-slate-900/80 backdrop-blur-md">
                  {item.category}
                </span>
              </div>

              {/* Text content boxes */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-base font-display font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Posted {formatDate(item.datePosted)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
