import type { ContentToBackground } from '../shared/messages.js'

type Handler = (message: ContentToBackground, sender: chrome.runtime.MessageSender) => Promise<unknown> | unknown
type MessageListener = (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => void

/**
 * Typed message router for the service worker.
 * Handles dispatching messages to registered handlers with a fallback switch.
 */
export class MessageBus {
  private handlers = new Map<string, Handler>()

  /**
   * Register a handler for a specific message type.
   */
  register(type: string, handler: Handler): void {
    this.handlers.set(type, handler)
  }

  /**
   * Create a listener function for chrome.runtime.onMessage.
   * Returns a boolean to indicate async response (returning true).
   */
  createListener(): MessageListener {
    return (message, sender, sendResponse) => {
      const msg = message as Record<string, unknown>
      const type = msg?.type as string | undefined
      if (!type) return

      const handler = this.handlers.get(type)
      if (handler) {
        const result = handler(msg as ContentToBackground, sender)
        if (result instanceof Promise) {
          result.then(sendResponse).catch((err) => {
            console.error(`[messageBus] Handler error for ${type}:`, err)
            sendResponse({ error: String(err) })
          })
          return true // Async response
        }
        sendResponse(result)
      }
    }
  }
}
