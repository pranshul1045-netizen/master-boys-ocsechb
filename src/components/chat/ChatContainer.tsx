import React, { useState } from 'react';
import { ChatList } from './ChatList';
import { ActiveThread } from './ActiveThread';
import { ArrowLeft, MessageSquare } from 'lucide-react';

interface ChatContainerProps {
  onOpenInspector: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  onOpenInspector,
}) => {
  const [activeChatId, setActiveChatId] = useState<string>('master_boys');
  const [showMobileThread, setShowMobileThread] = useState<boolean>(true);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setShowMobileThread(true);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#0b141a]">
      {/* Left Column: Chat List */}
      <div
        className={`${
          showMobileThread ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 h-full flex-col`}
      >
        <ChatList
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onOpenInspector={onOpenInspector}
        />
      </div>

      {/* Right Column: Active Thread */}
      <div
        className={`${
          showMobileThread ? 'flex' : 'hidden md:flex'
        } flex-1 h-full flex-col relative`}
      >
        {/* Mobile back navigation bar */}
        <div className="md:hidden flex items-center gap-2 p-2 bg-[#202c33] border-b border-neutral-800 text-neutral-200">
          <button
            onClick={() => setShowMobileThread(false)}
            className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 text-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Chats</span>
          </button>
        </div>

        {activeChatId ? (
          <ActiveThread chatId={activeChatId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 whatsapp-chat-pattern">
            <div className="p-4 rounded-2xl bg-[#111920] border border-neutral-800 mb-4 text-emerald-400">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">
              Select a Conversation
            </h2>
            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
              Select &ldquo;Master Boys&rdquo; or any of your 5 friends to start end-to-end encrypted messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
