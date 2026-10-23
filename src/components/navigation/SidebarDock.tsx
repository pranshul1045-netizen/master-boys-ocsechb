import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../../types';
import {
  MessageSquare,
  Calendar,
  Database,
  LogOut,
  Shield,
  Key,
} from 'lucide-react';

interface SidebarDockProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const SidebarDock: React.FC<SidebarDockProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="w-16 sm:w-18 bg-[#111920] border-r border-neutral-800 flex flex-col items-center justify-between py-4 shrink-0 z-30">
      {/* Top Brand Mark */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={() => onSelectTab('chat')}
          className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm cursor-pointer"
          title="Master Boys Private App"
        >
          <Shield className="w-6 h-6" />
        </button>

        {/* Primary Navigation Icons */}
        <nav className="flex flex-col items-center gap-2">
          {/* Chat Tab */}
          <button
            onClick={() => onSelectTab('chat')}
            className={`p-3 rounded-2xl transition-all relative group cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="Master Boys Messenger"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="sr-only">Master Boys Messenger</span>
            {activeTab === 'chat' && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-400 rounded-r-full" />
            )}
          </button>

          {/* Calendar Tab */}
          <button
            onClick={() => onSelectTab('calendar')}
            className={`p-3 rounded-2xl transition-all relative group cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="Master Boys Group Calendar"
          >
            <Calendar className="w-5 h-5" />
            <span className="sr-only">Master Boys Group Calendar</span>
            {activeTab === 'calendar' && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-400 rounded-r-full" />
            )}
          </button>

          {/* Database Inspector Tab */}
          <button
            onClick={() => onSelectTab('inspector')}
            className={`p-3 rounded-2xl transition-all relative group cursor-pointer ${
              activeTab === 'inspector'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="Zero-Knowledge Database Visualizer"
          >
            <Database className="w-5 h-5" />
            <span className="sr-only">Zero-Knowledge Database Visualizer</span>
            {activeTab === 'inspector' && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-400 rounded-r-full" />
            )}
          </button>
        </nav>
      </div>

      {/* Bottom Profile & Logout */}
      <div className="flex flex-col items-center gap-3">
        {/* User Avatar with Key Indicator */}
        <div className="relative group">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md ring-2 ring-emerald-500/40 cursor-default"
            style={{ backgroundColor: currentUser?.avatarColor || '#10b981' }}
          >
            {currentUser?.initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-[#111920] rounded-full">
            <Key className="w-3 h-3 text-emerald-400" />
          </div>

          {/* Profile Hover Tooltip */}
          <div className="absolute left-full ml-3 bottom-0 hidden group-hover:block z-50 bg-[#16212a] border border-neutral-700 text-neutral-200 text-xs p-3 rounded-xl shadow-2xl whitespace-nowrap min-w-48">
            <div className="font-semibold text-white">{currentUser?.name}</div>
            <div className="text-[11px] text-emerald-400 font-mono">{currentUser?.phone}</div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono">
              Role: {currentUser?.role}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate max-w-48">
              Vault: Master Boys Protected
            </div>
          </div>
        </div>

        {/* Secure Logout Button */}
        <button
          onClick={logout}
          className="p-2.5 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Secure Logout (Lock Session)"
        >
          <LogOut className="w-5 h-5" />
          <span className="sr-only">Log Out</span>
        </button>
      </div>
    </div>
  );
};
