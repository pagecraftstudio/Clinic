import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildSystemPrompt,
  getClinicContext,
  findPatient,
  findAppointment,
  getRevenueSummary,
  getTodayStats,
  listDoctors,
  getLowStock,
} from '@/features/ai/queries'

export const runtime = 'nodejs'
export const maxDuration = 60

// ── OpenAI tool definitions ──────────────────────────────────

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'find_patient',
      description: 'Search for patients by name, phone number, or patient number',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term (name, phone, or patient number)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_appointment',
      description: 'Search for appointments by patient name or reason',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_revenue_summary',
      description: 'Get revenue summary for a period',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Number of days back (default 30)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_today_stats',
      description: 'Get live clinic statistics for today',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_doctors',
      description: 'List all active doctors and their specialties',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_low_stock',
      description: 'Get inventory items that are at or below minimum stock level',
      parameters: { type: 'object', properties: {} },
    },
  },
]

// ── Tool executor ────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case 'find_patient': {
        const results = await findPatient(args.query as string)
        if (!results.length) return 'No patients found matching that query.'
        return JSON.stringify(results, null, 2)
      }
      case 'find_appointment': {
        const results = await findAppointment(args.query as string)
        if (!results.length) return 'No appointments found matching that query.'
        return JSON.stringify(results, null, 2)
      }
      case 'get_revenue_summary': {
        const data = await getRevenueSummary((args.days as number) ?? 30)
        return JSON.stringify(data, null, 2)
      }
      case 'get_today_stats': {
        const data = await getTodayStats()
        return JSON.stringify(data, null, 2)
      }
      case 'list_doctors': {
        const data = await listDoctors()
        return JSON.stringify(data, null, 2)
      }
      case 'get_low_stock': {
        const data = await getLowStock()
        if (!data.length) return 'No low stock items currently.'
        return JSON.stringify(data, null, 2)
      }
      default:
        return 'Unknown tool'
    }
  } catch (err: unknown) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`
  }
}

// ── POST /api/ai/chat ────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user profile for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single() as { data: { role: string; display_name: string } | null, error: unknown }

  const { messages } = await req.json() as {
    messages: Array<{ role: string; content: string }>
  }

  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  // Build system prompt with live clinic context
  const ctx = await getClinicContext()
  const systemPrompt = buildSystemPrompt(
    ctx,
    profile?.role ?? 'staff',
    profile?.display_name ?? 'User'
  )

  // ── Agentic loop (max 5 tool calls) ──────────────────────
  const openaiMessages: Array<{ role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`))

      try {
        let iterations = 0
        while (iterations < 5) {
          iterations++

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: openaiMessages,
              tools: TOOLS,
              tool_choice: 'auto',
              stream: iterations === 5, // only stream on final response
              max_tokens: 1500,
              temperature: 0.3,
            }),
          })

          if (!response.ok) {
            const err = await response.text()
            send(JSON.stringify({ error: `OpenAI error: ${err}` }))
            break
          }

          // Check if tool calls needed (non-streaming)
          if (iterations < 5) {
            const data = await response.json()
            const choice = data.choices?.[0]
            const msg = choice?.message

            if (choice?.finish_reason === 'tool_calls' && msg?.tool_calls) {
              // Execute all tool calls
              openaiMessages.push({
                role: 'assistant',
                content: msg.content ?? null,
                tool_calls: msg.tool_calls,
              })

              for (const tc of msg.tool_calls) {
                let args: Record<string, unknown> = {}
                try { args = JSON.parse(tc.function.arguments) } catch {}

                // Notify client which tool is running
                send(JSON.stringify({ type: 'tool_call', tool: tc.function.name }))

                const result = await executeTool(tc.function.name, args)
                openaiMessages.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: tc.function.name,
                  content: result,
                })
              }
              // Loop again to get final response
              continue
            }

            // No tool calls — stream this response
            if (choice?.finish_reason === 'stop' && msg?.content) {
              // Send as single chunk
              send(JSON.stringify({ type: 'text', content: msg.content }))
              send(JSON.stringify({ type: 'done' }))
              break
            }
          } else {
            // Final iteration — actually stream
            const reader = response.body!.getReader()
            const decoder = new TextDecoder()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

              for (const line of lines) {
                const raw = line.slice(6)
                if (raw === '[DONE]') {
                  send(JSON.stringify({ type: 'done' }))
                  continue
                }
                try {
                  const parsed = JSON.parse(raw)
                  const delta = parsed.choices?.[0]?.delta?.content
                  if (delta) send(JSON.stringify({ type: 'text_delta', delta }))
                } catch {}
              }
            }
            break
          }
        }
      } catch (err: unknown) {
        send(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
