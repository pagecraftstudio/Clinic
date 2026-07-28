import { AIChatClient } from '@/components/ai/ai-chat-client'

export const metadata = { title: 'AI Assistant' }

export default function AIPage() {
  return (
    <div style={{ height: "calc(100vh - 64px)" }}>
      <AIChatClient />
    </div>
  )
}
