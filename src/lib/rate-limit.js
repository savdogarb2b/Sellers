const rateLimitMap = new Map();

const CLEANUP_INTERVAL = 60 * 1000; // 1 daqiqa
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.firstRequest > entry.windowMs) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * In-memory rate limiter
 * @param {string} key - Unique identifier (e.g., IP + endpoint)
 * @param {number} maxRequests - Max requests in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ success: boolean, remaining: number, retryAfterMs: number }}
 */
export function rateLimit(key, maxRequests = 10, windowMs = 60 * 1000) {
  cleanup();
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.firstRequest > windowMs) {
    rateLimitMap.set(key, { count: 1, firstRequest: now, windowMs });
    return { success: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    const retryAfterMs = windowMs - (now - entry.firstRequest);
    return { success: false, remaining: 0, retryAfterMs };
  }

  return { success: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

/**
 * Helper: Get client identifier from request headers
 */
export function getClientKey(request) {
  return request.headers.get('x-forwarded-for')
    || request.headers.get('x-real-ip')
    || 'unknown';
}
