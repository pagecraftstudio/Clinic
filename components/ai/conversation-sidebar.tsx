'use client'

import { useState } from 'react'
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types/ai'
import { format, isToday, isYesterday } from 'date-fns'

interface ConversationSidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
}

function groupConversations(convs: Conversation[]) {
  const today: Conversation[] = []
  const yesterday: Conversation[] = []
  const older: Conversation[] = []

  for (const c of convs) {
    const d = new Date(c.updatedAt)
    if (isToday(d)) today.push(c)
    else if (isYesterday(d)) yesterday.push(c)
    else older.push(c)
  }
  return { today, yesterday, older }
}

interface ConvItemProps {
  conv: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (title: string) => void
}

function ConvItem({ conv, isActive, onSelect, onDelete, onRename }: ConvItemProps) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(conv.title)

  function commitRename() {
    if (editVal.trim()) onRename(editVal.trim())
    setEditing(false)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer text-[13px] transition-colors',
        isActive
          ? 'bg-blue-600/20 text-blue-300'
          : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80',
      )}
      onClick={!editing ? onSelect : undefined}
    >
      <MessageSquare size={12} className="flex-shrink-0 opacity-60" />

      {editing ? (
        <input
          autoFocus
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="flex-1 bg-white/10 rounded px-1 text-white/90 text-xs outline-none"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{conv.title}</span>
      )}

      {/* Actions */}
      <div className={cn(
        'flex gap-0.5 flex-shrink-0',
        editing ? 'flex' : 'hidden group-hover:flex',
      )}>
        {editing ? (
          <>
            <button onClick={e => { e.stopPropagation(); commitRename() }} className="p-0.5 hover:text-emerald-400"><Check size={11} /></button>
            <button onClick={e => { e.stopPropagation(); setEditing(false) }} className="p-0.5 hover:text-red-400"><X size={11} /></button>
          </>
        ) : (
          <>
            <button onClick={e => { e.stopPropagation(); setEditing(true) }} className="p-0.5 hover:text-white/80"><Pencil size={11} /></button>
            <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-0.5 hover:text-red-400"><Trash2 size={11} /></button>
          </>
        )}
      </div>
    </div>
  )
}

export function ConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete, onRename,
}: ConversationSidebarProps) {
  const { today, yesterday, older } = groupConversations(conversations)

  const Section = ({ label, items }: { label: string; items: Conversation[] }) =>
    items.length > 0 ? (
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-white/25 px-2 mb-1">{label}</p>
        {items.map(c => (
          <ConvItem
            key={c.id}
            conv={c}
            isActive={c.id === activeId}
            onSelect={() => onSelect(c.id)}
            onDelete={() => onDelete(c.id)}
            onRename={(title) => onRename(c.id, title)}
          />
        ))}
      </div>
    ) : null

  return (
    <aside
      className="flex flex-col border-r border-white/[0.06] flex-shrink-0"
      style={{ width: 220, background: '#0D0F1A' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
        <span className="text-[13px] font-semibold text-white/70">Conversations</span>
        <button
          onClick={onNew}
          className="w-6 h-6 rounded-md bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors"
          title="New conversation"
        >
          <Plus size={13} className="text-white" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {conversations.length === 0 ? (
          <p className="text-[12px] text-white/25 text-center mt-6 leading-relaxed px-2">
            Start a conversation with your clinic AI assistant
          </p>
        ) : (
          <>
            <Section label="Today" items={today} />
            <Section label="Yesterday" items={yesterday} />
            <Section label="Earlier" items={older} />
          </>
        )}
      </div>
    </aside>
  )
}
