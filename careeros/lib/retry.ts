/**
 * Retry a function with exponential backoff.
 * Useful for Supabase queries and external API calls.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; onRetry?: (attempt: number, error: unknown) => void } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 500, onRetry } = options
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt)
        onRetry?.(attempt + 1, err)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  throw lastError
}

/**
 * Retry a Supabase query with exponential backoff.
 * Handles common transient failures.
 */
export async function supabaseQuery<T>(
  query: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  return withRetry(async () => {
    const { data, error } = await query()
    if (error) throw error
    if (data === null || data === undefined) throw new Error("No data returned")
    return data
  }, {
    maxRetries: 2,
    baseDelay: 300,
    onRetry: (attempt, err) => {
      console.warn(`Supabase query retry ${attempt}:`, err)
    },
  })
}
