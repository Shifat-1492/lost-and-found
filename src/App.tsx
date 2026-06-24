/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
import { ShieldAlert, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'chats' | 'profile' | 'admin'>('feed');
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
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Safe storage wrappers to support sandboxed cross-origin iframes
  const getStoredUser = (): string | null => {
    try {
      return localStorage.getItem('lf_user');
    } catch {
      return null;
    }
  };

  const setStoredUser = (user: User | null) => {
    try {
      if (user) {
        localStorage.setItem('lf_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('lf_user');
      }
    } catch {
      // Ignore security/access errors in sandboxed environments
    }
  };

  // Read login state from local storage on load
  useEffect(() => {
    const savedUser = getStoredUser();
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        setStoredUser(null);
      }
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

  useEffect(() => {
    fetchPendingCount();
  }, [currentUser, triggerRefresh]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setStoredUser(user);
    setActiveTab('feed');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStoredUser(null);
    setActiveTab('feed');
  };

  // Triggers reload sync across all sub-components
  const handleRefreshTrigger = () => {
    setTriggerRefresh((prev) => !prev);
  };

  const handleInitiateChat = async (itemId: string, posterId: string, posterName: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          buyerId: currentUser.id,
          buyerName: currentUser.name,
          sellerId: posterId,
          sellerName: posterName,
        }),
      });

      if (!response.ok) {
        throw new Error();
      }

      const activeChat = await response.json();
      setSelectedItem(null); // close detail overlay
      setInitialChatId(activeChat.id); // set context
      setActiveTab('chats'); // redirect to list
    } catch {
      showToastMessage('Could not start communication. Please try again.');
    }
  };

  if (!currentUser) {
    return <LoginRegister onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Navbar segment */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          setInitialChatId(null); // reset selected state context when switching tabs manually
        }}
        onOpenPostModal={() => setIsPostModalOpen(true)}
        pendingReviewCount={pendingReviewCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner indicator for pending items review checks */}
        {currentUser.role === 'admin' && pendingReviewCount > 0 && activeTab !== 'admin' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 animate-pulse shrink-0" />
              <span>
                There are <strong>{pendingReviewCount} list items</strong> awaiting your administrative approval!
              </span>
            </div>
            <button
              onClick={() => setActiveTab('admin')}
              className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 pointer transition-colors text-xs cursor-pointer"
            >
              Open Admin Moderate View
            </button>
          </div>
        )}

        {/* Dynamic view router tabs */}
        <div>
          {activeTab === 'feed' && (
            <HomeFeed
              onSelectItem={(item) => setSelectedItem(item)}
              triggerRefresh={triggerRefresh}
            />
          )}

          {activeTab === 'chats' && (
            <ChatsView
              currentUser={currentUser}
              initialSelectedChatId={initialChatId}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              onSelectItem={(item) => setSelectedItem(item)}
              triggerRefresh={triggerRefresh}
              onRefreshTrigger={handleRefreshTrigger}
            />
          )}

          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <AdminPanel
              onSelectItem={(item) => setSelectedItem(item)}
              triggerRefresh={triggerRefresh}
              onRefreshTrigger={handleRefreshTrigger}
            />
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Daffodil International University. Daffodilians collaborative Lost & Found network project.</p>
          <p className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Designed for convenience & community support
          </p>
        </div>
      </footer>

      {/* Posting modal Drawer popup */}
      {isPostModalOpen && (
        <PostForm
          currentUser={currentUser}
          onClose={() => setIsPostModalOpen(false)}
          onPostSuccess={() => {
            setIsPostModalOpen(false);
            handleRefreshTrigger();
            // show profile tab directly so they see their registered pending post
            setActiveTab('profile');
          }}
        />
      )}

      {/* Item Details Model popup */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          currentUser={currentUser}
          onClose={() => setSelectedItem(null)}
          onInitiateChat={handleInitiateChat}
          onDeleteSuccess={() => {
            setSelectedItem(null);
            handleRefreshTrigger();
          }}
        />
      )}

      {/* Toast notification component */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-950 border border-indigo-500/30 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}
    </div>
  );
}

