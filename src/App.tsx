/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { LoginGateway } from './components/auth/LoginGateway';
import { SidebarDock } from './components/navigation/SidebarDock';
import { ChatContainer } from './components/chat/ChatContainer';
import { CircleCalendar } from './components/calendar/CircleCalendar';
import { DatabaseVisualizer } from './components/inspector/DatabaseVisualizer';
import { ActiveTab } from './types';

function MainWorkspace() {
  const { currentUser, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b0e] flex items-center justify-center text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider">Unlocking Browser Vault...</span>
        </div>
      </div>
    );
  }

  // Account Isolation Layer: strictly render completely locked boot gateway if not logged in
  if (!currentUser) {
    return <LoginGateway />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#070b0e] font-sans antialiased">
      {/* WhatsApp / Modern Sidebar Navigation Dock */}
      <SidebarDock activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Workspace Viewport */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'chat' && (
          <ChatContainer
            onOpenInspector={() => setActiveTab('inspector')}
          />
        )}
        {activeTab === 'calendar' && <CircleCalendar />}
        {activeTab === 'inspector' && <DatabaseVisualizer />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <MainWorkspace />
      </DatabaseProvider>
    </AuthProvider>
  );
}
