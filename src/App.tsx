/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Item } from './types';
import LoginRegister from './components/LoginRegister';
import Navbar from './components/Navbar';
import HomeFeed from './components/HomeFeed';
import PostForm from './components/PostForm';
import ItemDetailsModal from './components/ItemDetailsModal';
import ChatsView from './components/ChatsView';
import ProfileView from './components/ProfileView';
import AdminPanel from './components/AdminPanel';
import { ShieldAlert, Sparkles } from 'lucide-react';

type ActiveTab = 'feed' | 'chats' | 'profile' | 'admin' | 'login';
const PROTECTED_TABS: ActiveTab[] = ['chats', 'profile', 'admin'];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('lf_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('lf_theme', theme);
    } catch (e) {}
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToastMessage = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // Safe storage wrappers to support sandboxed cross-origin iframes
  const getStoredUser = (): string | null => {
    try { return localStorage.getItem('lf_user'); } catch { return null; }
  };

  const setStoredUser = (user: User | null) => {
    try {
      if (user) {
        localStorage.setItem('lf_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('lf_user');
      }
    } catch {}
  };

  // Restore session from localStorage on load
  useEffect(() => {
    const savedUser = getStoredUser();
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); }
      catch { setStoredUser(null); }
    }
  }, []);

  // Poll pending review metrics if user is an administrator
  const fetchPendingCount = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      const res = await fetch('/api/items/stats');
      if (res.ok) {
        const d = await res.json();
        setPendingReviewCount(d.pending || 0);
      }
    } catch (e) {
      console.error('Failed to load pending moderation metrics:', e);
    }
  };

  useEffect(() => { fetchPendingCount(); }, [currentUser, triggerRefresh]);

  // Handle tab change — redirect guests away from protected tabs
  const handleChangeTab = (tab: ActiveTab) => {
    if (PROTECTED_TABS.includes(tab) && !currentUser) {
      setPendingTab(tab);
      setActiveTab('login');
      return;
    }
    setActiveTab(tab);
    setInitialChatId(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setStoredUser(user);
    // Redirect to where they wanted to go, or fall back to feed
    const destination = pendingTab || 'feed';
    setPendingTab(null);
    setActiveTab(destination);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStoredUser(null);
    setActiveTab('feed');
  };

  const handleRefreshTrigger = () => {
    setTriggerRefresh((prev) => !prev);
  };

  const handleInitiateChat = async (itemId: string, posterId: string, posterName: string) => {
    if (!currentUser) {
      setPendingTab('chats');
      setActiveTab('login');
      return;
    }
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          buyerId: currentUser.id,
          buyerName: currentUser.name,
          sellerId: posterId,
          sellerName: posterName,
        }),
      });
      if (!response.ok) throw new Error();
      const activeChat = await response.json();
      setSelectedItem(null);
      setInitialChatId(activeChat.id);
      setActiveTab('chats');
    } catch {
      showToastMessage('Could not start communication. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
        onOpenPostModal={() => {
          if (!currentUser) {
            setPendingTab('feed');
            setActiveTab('login');
          } else {
            setIsPostModalOpen(true);
          }
        }}
        pendingReviewCount={pendingReviewCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Admin pending items banner */}
        {currentUser?.role === 'admin' && pendingReviewCount > 0 && activeTab !== 'admin' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 animate-pulse shrink-0" />
              <span>
                There are <strong>{pendingReviewCount} list items</strong> awaiting your administrative approval!
              </span>
            </div>
            <button
              onClick={() => setActiveTab('admin')}
              className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition-colors text-xs cursor-pointer"
            >
              Open Admin Moderate View
            </button>
          </div>
        )}

        {/* View router */}
        <div>
          {/* Login/Register — shown when a guest tries to access a protected page */}
          {activeTab === 'login' && (
            <LoginRegister onLoginSuccess={handleLoginSuccess} />
          )}

          {/* Public home feed */}
          {activeTab === 'feed' && (
            <HomeFeed
              onSelectItem={(item) => setSelectedItem(item)}
              triggerRefresh={triggerRefresh}
            />
          )}

          {/* Protected: Chats */}
          {activeTab === 'chats' && currentUser && (
            <ChatsView
              currentUser={currentUser}
              initialSelectedChatId={initialChatId}
            />
          )}

          {/* Protected: Profile */}
          {activeTab === 'profile' && currentUser && (
            <ProfileView
              currentUser={currentUser}
              onSelectItem={(item) => setSelectedItem(item)}
              triggerRefresh={triggerRefresh}
              onRefreshTrigger={handleRefreshTrigger}
            />
          )}

          {/* Protected: Admin */}
          {activeTab === 'admin' && currentUser?.role === 'admin' && (
            <AdminPanel
              onSelectItem={(item) => setSelectedItem(item)}
              triggerRefresh={triggerRefresh}
              onRefreshTrigger={handleRefreshTrigger}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Daffodil International University. Daffodilians collaborative Lost &amp; Found network project.</p>
          <p className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Designed for convenience &amp; community support
          </p>
        </div>
      </footer>

      {/* Post Item modal — auth-gated in the handler above */}
      {isPostModalOpen && currentUser && (
        <PostForm
          currentUser={currentUser}
          onClose={() => setIsPostModalOpen(false)}
          onPostSuccess={() => {
            setIsPostModalOpen(false);
            handleRefreshTrigger();
            setActiveTab('profile');
          }}
        />
      )}

      {/* Item Details modal — viewable by guests */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          currentUser={currentUser}
          onClose={() => setSelectedItem(null)}
          onInitiateChat={handleInitiateChat}
          onLoginRequired={() => {
            setSelectedItem(null);
            setPendingTab('chats');
            setActiveTab('login');
          }}
          onDeleteSuccess={() => {
            setSelectedItem(null);
            handleRefreshTrigger();
          }}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-950 border border-indigo-500/30 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}
    </div>
  );
}
