import { AIChatClient } from '@/components/ai/ai-chat-client'

export const metadata = { title: 'AI Assistant' }

export default function AIPage() {
  return (
    <div className="h-full">
      <AIChatClient />
    </div>
  )
}
