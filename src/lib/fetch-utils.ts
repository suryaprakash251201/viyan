const DEFAULT_TIMEOUT = 10000 // 10 seconds

/**
 * Create an AbortController with automatic timeout
 */
export function createTimeoutSignal(
  timeoutMs: number = DEFAULT_TIMEOUT
): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

/**
 * Fetch with automatic timeout
 */
export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const signal = createTimeoutSignal(timeout)
  const combinedSignal = options.signal
    ? AbortSignal.any([signal, options.signal])
    : signal

  try {
    const response = await fetch(url, {
      ...options,
      signal: combinedSignal,
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorData.error || errorMessage
      } catch {
        // Ignore JSON parse errors
      }
      return { ok: false, status: response.status, error: errorMessage }
    }

    const data = await response.json()
    return { ok: true, data }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, status: 408, error: "Request timeout" }
    }
    return {
      ok: false,
      status: 500,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    shouldRetry?: (error: Error) => boolean
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, shouldRetry } = options

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) {
        break
      }

      if (shouldRetry && !shouldRetry(lastError)) {
        break
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}