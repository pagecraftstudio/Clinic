'use client'

import { useEffect, useRef } from 'react'
import { Bot, User, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/ai'

// ── Minimal markdown renderer (no external dep) ──────────────
function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre class="bg-white/5 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-emerald-300"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-blue-300">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-white mt-3 mb-1">$1</h3>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-white mt-4 mb-1">$1</h2>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="flex gap-2 my-0.5"><span class="text-blue-400 mt-1">•</span><span>$1</span></li>')
    // Ordered lists (simple)
    .replace(/^\d+\. (.+)$/gm, '<li class="flex gap-2 my-0.5"><span class="text-blue-400 font-mono text-xs mt-1">›</span><span>$1</span></li>')
    // Wrap list items
    .replace(/((<li[^>]*>.*<\/li>\n?)+)/gs, '<ul class="my-2 space-y-0.5 list-none ml-0">$1</ul>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-white/10 my-3" />')
    // Newlines
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br />')
}

// ── Typing cursor ────────────────────────────────────────────
function TypingCursor() {
  return (
    <span className="inline-block w-0.5 h-3.5 bg-blue-400 ml-0.5 align-middle animate-pulse" />
  )
}

// ── Copy button ──────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70"
      title="Copy"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

// ── Message bubble ───────────────────────────────────────────
interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-blue-600' : 'bg-[#1E2030] border border-white/[0.08]'
      )}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-blue-400" />}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-blue-600 text-white rounded-tr-sm'
          : 'bg-[#1A1D2E] border border-white/[0.06] text-[#C8CDD8] rounded-tl-sm'
      )}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div>
            <div
              className="prose-invert text-[13px] leading-6"
              dangerouslySetInnerHTML={{
                __html: message.content
                  ? `<p class="mt-0">${renderMarkdown(message.content)}</p>`
                  : '',
              }}
            />
            {message.isStreaming && !message.content && (
              <div className="flex gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce [animation-delay:300ms]" />
              </div>
            )}
            {message.isStreaming && message.content && <TypingCursor />}
          </div>
        )}
      </div>

      {/* Copy button (assistant only) */}
      {!isUser && !message.isStreaming && (
        <div className="self-end mb-1">
          <CopyButton text={message.content} />
        </div>
      )}
    </div>
  )
}

// ── Messages list ────────────────────────────────────────────
interface MessagesListProps {
  messages: ChatMessage[]
}

export function MessagesList({ messages }: MessagesListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col gap-5 py-6 px-4">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
