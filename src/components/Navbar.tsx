/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../types';
import { Search, Radio, MessageSquare, User as UserIcon, ShieldAlert, LogOut, PlusCircle, Sun, Moon } from 'lucide-react';
import DifuLogo from './DifuLogo';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: 'feed' | 'chats' | 'profile' | 'admin';
  onChangeTab: (tab: 'feed' | 'chats' | 'profile' | 'admin') => void;
  onOpenPostModal: () => void;
  pendingReviewCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  activeTab,
  onChangeTab,
  onOpenPostModal,
  pendingReviewCount,
  theme,
  onToggleTheme
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => onChangeTab('feed')}>
            <DifuLogo size="md" showText={true} />
          </div>

          {/* Nav Links */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
               onClick={() => onChangeTab('feed')}
               className={`flex items-center space-x-1 sm:space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                 activeTab === 'feed'
                   ? 'bg-indigo-600 text-white'
                   : 'text-slate-400 hover:bg-slate-800 hover:text-white'
               }`}
             >
               <Search className="h-4 w-4" />
               <span>Feed</span>
             </button>
 
             <button
               onClick={() => onChangeTab('chats')}
               className={`flex items-center space-x-1 sm:space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                 activeTab === 'chats'
                   ? 'bg-indigo-600 text-white'
                   : 'text-slate-400 hover:bg-slate-800 hover:text-white'
               }`}
             >
               <MessageSquare className="h-4 w-4" />
               <span>Chats</span>
             </button>
 
             <button
               onClick={() => onChangeTab('profile')}
               className={`flex items-center space-x-1 sm:space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                 activeTab === 'profile'
                   ? 'bg-indigo-600 text-white'
                   : 'text-slate-400 hover:bg-slate-800 hover:text-white'
               }`}
             >
               <UserIcon className="h-4 w-4" />
               <span>Profile</span>
             </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => onChangeTab('admin')}
                className={`relative flex items-center space-x-1 sm:space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Admin</span>
                {pendingReviewCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {pendingReviewCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Quick Action & User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onOpenPostModal}
              className="bg-linear-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:from-emerald-600 hover:to-teal-600 flex items-center space-x-1 hover:shadow-md hover:shadow-teal-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Post Item</span>
            </button>

             <div className="flex items-center space-x-2 border-l border-slate-800 pl-2 sm:pl-4">
              <img
                src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=user'}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full border border-slate-700 bg-slate-800 hidden md:block"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=user';
                }}
              />
              <div className="text-right hidden lg:block">
                <p className="text-xs font-semibold text-slate-100 whitespace-nowrap">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{currentUser.role === 'admin' ? 'Faculty/Staff Admin' : 'Student/User'}</p>
              </div>

              <button
                onClick={onToggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              <button
                onClick={onLogout}
                title="Log out"
                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
