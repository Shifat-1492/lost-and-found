/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Item } from '../types';
import { X, Upload, Check, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface PostFormProps {
  currentUser: User;
  onClose: () => void;
  onPostSuccess: () => void;
}

const CATEGORIES = [
  'Wallet', 'Phone', 'Keys', 'Card', 'Laptop', 'Bag', 'Documents', 'Watch', 'Other'
];

interface ImagePreset {
  name: string;
  url: string;
}

const PRESET_IMAGES: ImagePreset[] = [
  { name: 'Generic Gadget', url: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=400' },
  { name: 'Leather Wallet', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400' },
  { name: 'Smartphone', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400' },
  { name: 'Metal Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=400' },
  { name: 'Backpack / Bag', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400' },
  { name: 'ID Card / Docs', url: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=400' }
];

export default function PostForm({ currentUser, onClose, onPostSuccess }: PostFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Wallet');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle standard file picker to convert to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !location || !category) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        category,
        location,
        type,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=400',
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email
      };

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || 'Failed to submit post');
      }

      onPostSuccess();
    } catch (err: any) {
      setError(err.message || 'Could not post item. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-white">Post Item Report</h2>
          <button
            onClick={onClose}
            className="p-1 px-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Image selection / Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Item Photo</label>
            
            <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-900/40 group transition-colors">
              {imageUrl ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900">
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 bg-slate-950/85 hover:bg-red-500 p-1.5 rounded-full text-white transition-colors cursor-pointer shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer w-full flex flex-col items-center py-6">
                  <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-2 group-hover:scale-105 transition-transform duration-200">
                    <Upload className="h-6 w-6 text-indigo-400" />
                  </div>
                  <span className="text-sm font-semibold text-white">Click to Upload Image</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG, or JPEG up to 2MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Presets Grid */}
            {!imageUrl && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Or select a matched preset photo:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      title={preset.name}
                      className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-700 hover:border-indigo-400 transition-colors shadow-xs shrink-0 cursor-pointer"
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lost or Found Status Radio buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`p-3 rounded-xl border font-semibold text-sm transition-all focus:outline-hidden cursor-pointer flex items-center justify-center space-x-2 ${
                type === 'lost'
                  ? 'bg-red-500/10 border-red-500 text-red-300'
                  : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${type === 'lost' ? 'bg-red-500' : 'bg-slate-500'}`} />
              <span>Report Lost</span>
            </button>
            <button
              type="button"
              onClick={() => setType('found')}
              className={`p-3 rounded-xl border font-semibold text-sm transition-all focus:outline-hidden cursor-pointer flex items-center justify-center space-x-2 ${
                type === 'found'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${type === 'found' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              <span>Report Found</span>
            </button>
          </div>

          {/* Title box */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              Item Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter item name"
            />
          </div>

          {/* Category Select box */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              General Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location box */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              Estimated Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter location"
            />
          </div>

          {/* Description box */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              Detail Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item..."
              className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Notice box */}
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] rounded-xl flex items-start space-x-2">
            <span className="text-xs shrink-0 font-bold bg-indigo-500/20 px-1 rounded">NOTICE</span>
            <p className="text-slate-300">
              All reported items are set as <strong>"Pending"</strong> initially. An Admin (Faculty/Staff) will review and approve your listing shortly before it is broadcasted.
            </p>
          </div>

          {/* Submits */}
          <div className="pt-3 border-t border-slate-700/50 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer text-sm"
            >
              {loading ? 'Submitting...' : 'Post Item Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
