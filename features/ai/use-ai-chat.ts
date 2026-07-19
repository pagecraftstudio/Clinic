'use client'

import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, Conversation } from '@/types/ai'

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function makeMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return { id: makeId(), role, content, createdAt: new Date().toISOString() }
}

export function useAIChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const activeConversation = conversations.find(c => c.id === activeId) ?? null

  const newConversation = useCallback(() => {
    const id = makeId()
    const conv: Conversation = {
      id,
      title: 'New conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setConversations(prev => [conv, ...prev])
    setActiveId(id)
    return id
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    setActiveId(prev => (prev === id ? null : prev))
  }, [])

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, title } : c)
    )
  }, [])

  const updateMessages = useCallback((convId: string, updater: (msgs: ChatMessage[]) => ChatMessage[]) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === convId
          ? { ...c, messages: updater(c.messages), updatedAt: new Date().toISOString() }
          : c
      )
    )
  }, [])

  const sendMessage = useCallback(async (content: string, convId?: string) => {
    const id = convId ?? newConversation()
    const userMsg = makeMessage('user', content)

    // Auto-title from first message
    setConversations(prev =>
      prev.map(c =>
        c.id === id && c.title === 'New conversation'
          ? { ...c, title: content.slice(0, 48) }
          : c
      )
    )

    // Add user message
    updateMessages(id, msgs => [...msgs, userMsg])

    // Placeholder assistant message
    const assistantId = makeId()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    }
    updateMessages(id, msgs => [...msgs, assistantMsg])
    setIsStreaming(true)

    abortRef.current = new AbortController()

    try {
      // Build messages array for API (exclude current streaming placeholder)
      const conv = conversations.find(c => c.id === id) ?? { messages: [] }
      const apiMessages = [
        ...conv.messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content },
      ]

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        updateMessages(id, msgs =>
          msgs.map(m =>
            m.id === assistantId
              ? { ...m, content: `Error: ${err.error ?? 'Failed to get response'}`, isStreaming: false }
              : m
          )
        )
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const raw = line.slice(6)
          try {
            const parsed = JSON.parse(raw)

            if (parsed.type === 'text_delta') {
              accumulated += parsed.delta
              updateMessages(id, msgs =>
                msgs.map(m =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              )
            } else if (parsed.type === 'text') {
              // Non-streamed full response
              accumulated = parsed.content
              updateMessages(id, msgs =>
                msgs.map(m =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              )
            } else if (parsed.type === 'tool_call') {
              // Show tool running indicator in message
              updateMessages(id, msgs =>
                msgs.map(m =>
                  m.id === assistantId
                    ? { ...m, content: accumulated + `\n\n_Running: ${parsed.tool}…_` }
                    : m
                )
              )
            } else if (parsed.type === 'done') {
              updateMessages(id, msgs =>
                msgs.map(m =>
                  m.id === assistantId
                    ? { ...m, content: accumulated, isStreaming: false }
                    : m
                )
              )
            } else if (parsed.error) {
              updateMessages(id, msgs =>
                msgs.map(m =>
                  m.id === assistantId
                    ? { ...m, content: `Error: ${parsed.error}`, isStreaming: false }
                    : m
                )
              )
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      updateMessages(id, msgs =>
        msgs.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Connection error. Please try again.', isStreaming: false }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
      updateMessages(id, msgs =>
        msgs.map(m =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      )
    }
  }, [conversations, newConversation, updateMessages])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return {
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
  }
}
