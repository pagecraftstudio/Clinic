'use client'

import { useEffect } from 'react'
import { useAIChat } from '@/features/ai/use-ai-chat'
import { ConversationSidebar } from '@/components/ai/conversation-sidebar'
import { MessagesList } from '@/components/ai/messages-list'
import { ChatInput } from '@/components/ai/chat-input'
import { AIEmptyState } from '@/components/ai/empty-state'
import { Sparkles } from 'lucide-react'

export function AIChatClient() {
  const {
    conversations,
    activeConversation,
    activeId,
    isStreaming,
    setActiveId,
    newConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    stopStreaming,
  } = useAIChat()

  function handleSend(message: string) {
    // If no active conversation, create one
    const id = activeId ?? undefined
    sendMessage(message, id)

    // Set active to whatever was created/used
    if (!activeId) {
      // The hook will create and set, but we need the returned id
      // This is handled inside sendMessage → newConversation
    }
  }

  function handlePrompt(prompt: string) {
    const id = newConversation()
    sendMessage(prompt, id)
    setActiveId(id)
  }

  const showEmpty = !activeConversation || activeConversation.messages.length === 0

  return (
    <div className="flex h-full" style={{ background: '#0F1117' }}>
      {/* Conversations sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={() => setActiveId(newConversation())}
        onDelete={deleteConversation}
        onRename={renameConversation}
      />

      {/* Chat area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-2.5 px-5 h-12 border-b border-white/[0.06] flex-shrink-0">
          <Sparkles size={14} className="text-blue-400" />
          <span className="text-[13px] font-medium text-white/70">
            {activeConversation?.title ?? 'AI Assistant'}
          </span>
          {isStreaming && (
            <span className="ml-auto text-[11px] text-blue-400/70 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Generating…
            </span>
          )}
        </div>

        {/* Messages / Empty state */}
        <div className="flex-1 overflow-y-auto">
          {showEmpty ? (
            <AIEmptyState onPrompt={handlePrompt} />
          ) : (
            <MessagesList messages={activeConversation.messages} />
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] flex-shrink-0">
          <ChatInput
            onSend={handleSend}
            onStop={stopStreaming}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  )
}
