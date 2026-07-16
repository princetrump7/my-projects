// Server-Sent Events utilities for streaming AI responses

/**
 * Create a ReadableStream that emits SSE events.
 * Each chunk is sent as: `data: <json>\n\n`
 */
export function createSSEStream(
  events: AsyncGenerator<Record<string, unknown>>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        }
      } catch (err) {
        const errorPayload = `data: ${JSON.stringify({
          type: "error",
          message: err instanceof Error ? err.message : "Stream failed",
        })}\n\n`
        controller.enqueue(encoder.encode(errorPayload))
      } finally {
        controller.close()
      }
    },
  })
}

/**
 * Create a streaming Response (text/event-stream).
 */
export function sseResponse(
  events: AsyncGenerator<Record<string, unknown>>
): Response {
  return new Response(createSSEStream(events), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

/**
 * Consume an SSE stream on the client.
 * Calls `onEvent` for each parsed event.
 * Returns when the stream ends or errors.
 */
export async function consumeSSE(
  response: Response,
  onEvent: (event: Record<string, unknown>) => void
): Promise<void> {
  if (!response.body) throw new Error("No response body")

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6))
          onEvent(data)
        } catch {
          // skip malformed events
        }
      }
    }
  }
}
