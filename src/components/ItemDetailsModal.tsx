/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Item, User } from '../types';
import { X, MapPin, Calendar, Folder, MessageSquare, AlertCircle, Trash2, Mail, User2 } from 'lucide-react';

interface ItemDetailsModalProps {
  item: Item;
  currentUser: User;
  onClose: () => void;
  onInitiateChat: (itemId: string, posterId: string, posterName: string) => void;
  onDeleteSuccess: () => void;
}

export default function ItemDetailsModal({
  item,
  currentUser,
  onClose,
  onInitiateChat,
  onDeleteSuccess
}: ItemDetailsModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const isOwner = currentUser.id === item.userId;
  const isAdmin = currentUser.role === 'admin';

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete report.');
      }
      onDeleteSuccess();
    } catch (err: any) {
      setError(err.message || 'Could not delete item.');
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Banner image layout */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=600';
            }}
          />
          
          {/* Close button layered on photo */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/50 rounded-full flex items-center justify-center text-white transition-colors shadow-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* absolute status overlay */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md ${
              item.type === 'lost' ? 'bg-red-500' : 'bg-emerald-555 bg-emerald-500'
            }`}>
              {item.type}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-slate-900/80 backdrop-blur-md border border-slate-700/50">
              {item.category}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title and stats layout */}
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-black text-white leading-tight">{item.title}</h2>
            <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-400 font-medium">
              <div className="flex items-center space-x-1.5">
                <MapPin className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>{item.location}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Calendar className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                <span>Reported {formatDate(item.datePosted)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/60 pt-4" />

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Description</h4>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>

          {/* Reporter details card */}
          <div className="p-4 bg-slate-900/60 border border-slate-700 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                <User2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Reported By</p>
                <p className="text-white text-sm font-semibold">{item.userName}</p>
              </div>
            </div>
            
            {/* If Admin, display email directly to help coordinate offline */}
            {isAdmin && (
              <div className="text-right text-xs">
                <span className="text-slate-400 text-[9px] block">ADMIN LOG EMAIL</span>
                <span className="text-violet-300 font-mono select-all flex items-center gap-1">
                  <Mail className="h-3 w-3 inline" />
                  {item.userEmail}
                </span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Ownership Notification states */}
            <div>
              {isOwner ? (
                <span className="p-2 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold block">
                  🛡️ You posted this report item listing.
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  Contact user to coordinate item recovery.
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3 justify-end">
              {showConfirmDelete ? (
                <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-red-500/30 animate-in fade-in slide-in-from-right-2 duration-150">
                  <span className="text-xs text-slate-300 font-medium">Are you sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-750 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {/* Delete button (available to owner and admin roles!) */}
                  {(isOwner || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(true)}
                      className="px-4 py-2.5 bg-red-500/10 hover:bg-red-600 border border-red-500/30 hover:border-red-500 rounded-xl text-red-200 hover:text-white transition-all text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Report</span>
                    </button>
                  )}

                  {/* Start Chat button (Only if not owner!) */}
                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => onInitiateChat(item.id, item.userId, item.userName)}
                      className="px-6 py-2.5 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl focus:outline-hidden hover:shadow-md hover:shadow-indigo-500/20 transition-all text-sm flex items-center space-x-2 cursor-pointer"
                    >
                      <MessageSquare className="h-4.5 w-4.5" />
                      <span>Message {item.userName}</span>
                    </button>
                  )}
                </>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
