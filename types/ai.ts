// ============================================================
// AI Assistant Types
// ============================================================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface SuggestedPrompt {
  label: string
  prompt: string
  icon: string
}

export type AITool =
  | 'find_patient'
  | 'find_appointment'
  | 'get_revenue_summary'
  | 'get_today_stats'
  | 'list_doctors'
  | 'get_low_stock'

export interface AIToolCall {
  tool: AITool
  args: Record<string, unknown>
}

export interface AIContext {
  clinicName: string
  todayDate: string
  userRole: string
  userName: string
}
