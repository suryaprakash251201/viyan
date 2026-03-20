import { NextResponse } from "next/server"

/**
 * Standard unauthorized response
 */
export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

/**
 * Standard error response
 */
export function errorResponse(
  message: string,
  status = 400,
  detail?: string
): NextResponse {
  return NextResponse.json(
    { error: message, ...(detail ? { detail } : {}) },
    { status }
  )
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Not found response
 */
export function notFound(message = "Not found"): NextResponse {
  return errorResponse(message, 404)
}

/**
 * Rate limiting helper (memory-based for single instance)
 * For production with multiple instances, use Redis
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime }
}

/**
 * Clean up expired rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60000) // Clean every minute

/**
 * Extract user ID from session
 */
export function getUserId(
  session: { user?: { id?: string } } | null
): string | null {
  return session?.user?.id ?? null
}

/**
 * Parse JSON body with error handling
 */
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

/**
 * Check if request has valid content type
 */
export function hasContentType(
  request: Request,
  type: string
): boolean {
  const contentType = request.headers.get("content-type")
  return contentType?.includes(type) ?? false
}