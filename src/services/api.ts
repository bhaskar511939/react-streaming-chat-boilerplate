import type { SSEEvent } from '../types'

export interface StreamCallbacks {
  onInfo:  (message: string) => void
  onTool:  (tool: string, message: string, stage: string) => void
  onToken: (text: string) => void
  onDone:  () => void
  onError: (msg: string) => void
}

/**
 * Stream a chat message from any SSE streaming backend.
 *
 * Expected SSE event shapes (all `data: <json>`):
 *   { type: 'info',  stage: 'start'|'end', message: string }
 *   { type: 'tool',  stage: 'start'|'end', message: string, tool: string }
 *   { type: 'llm',   stage: 'stream',      message: string }   ← token
 *   { type: 'done',  stage: 'end',         message: string }
 *   { type: 'error', stage: 'error',       message: string }
 */
export async function streamChat(
  baseUrl: string,
  query: string,
  userId: string,
  model: string | null,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  let resp: Response

  try {
    resp = await fetch(`${baseUrl}/api/v1/chat/ask`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'text/event-stream',
      },
      body: JSON.stringify({
        query,
        user_id: userId,
        ...(model ? { model } : {}),
      }),
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    callbacks.onError(
      `Cannot connect to backend at ${baseUrl}. ` +
      `Make sure your server is running.`,
    )
    return
  }

  if (!resp.ok || !resp.body) {
    callbacks.onError(`HTTP ${resp.status}: ${resp.statusText}`)
    return
  }

  const reader  = resp.body.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Split on newlines; keep incomplete last chunk in buffer
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()

        // Skip empty lines and SSE comments
        if (!trimmed || trimmed.startsWith(':')) continue
        if (!trimmed.startsWith('data: ')) continue

        const raw = trimmed.slice(6).trim()
        if (raw === '[DONE]') {
          callbacks.onDone()
          return
        }

        try {
          const event = JSON.parse(raw) as SSEEvent

          switch (event.type) {
            case 'info':
              callbacks.onInfo(event.message)
              break

            case 'tool':
              callbacks.onTool(event.tool ?? '', event.message, event.stage)
              break

            case 'llm':
              if (event.stage === 'stream') {
                callbacks.onToken(event.message)
              }
              break

            case 'done':
              callbacks.onDone()
              return

            case 'error':
              callbacks.onError(event.message)
              return

            default:
              // Unknown event type — ignore gracefully
              break
          }
        } catch {
          // Malformed JSON in stream — skip
        }
      }
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      callbacks.onError(`Stream interrupted: ${(err as Error).message}`)
    }
  } finally {
    reader.releaseLock()
  }
}
