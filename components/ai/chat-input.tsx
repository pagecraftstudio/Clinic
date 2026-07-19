'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Send, Square, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  function handleSend() {
    const msg = value.trim()
    if (!msg || disabled) return
    setValue('')
    onSend(msg)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isStreaming) return
      handleSend()
    }
  }

  return (
    <div className="px-4 pb-4 pt-2">
      <div className={cn(
        'flex items-end gap-2 rounded-2xl border px-4 py-3 transition-colors',
        'bg-[#1A1D2E] border-white/[0.08]',
        'focus-within:border-blue-500/50',
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about the clinic…"
          rows={1}
          disabled={disabled}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-[#C8CDD8] placeholder:text-white/25',
            'outline-none min-h-[24px] max-h-40 leading-6',
            'disabled:opacity-40',
          )}
        />

        <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
          {/* Character hint */}
          {value.length > 0 && !isStreaming && (
            <span className="text-[10px] text-white/20 mr-1">⏎</span>
          )}

          {/* Stop / Send */}
          {isStreaming ? (
            <button
              onClick={onStop}
              className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors"
              title="Stop generating"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                value.trim() && !disabled
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-white/5 text-white/20 cursor-not-allowed',
              )}
              title="Send (Enter)"
            >
              <Send size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-white/20 mt-2">
        AI can make mistakes. Always verify medical information.
      </p>
    </div>
  )
}
