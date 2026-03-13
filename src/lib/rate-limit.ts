const requests = new Map<string, number[]>();

// Clean up old entries periodically to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requests) {
    const recent = timestamps.filter((t) => now - t < 120_000);
    if (recent.length === 0) {
      requests.delete(key);
    } else {
      requests.set(key, recent);
    }
  }
}, 60_000);

export function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const timestamps = requests.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= maxRequests) {
    return false;
  }
  recent.push(now);
  requests.set(ip, recent);
  return true;
}
