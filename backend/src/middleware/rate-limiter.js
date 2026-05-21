const ipMap = new Map();

/**
 * Creates an in-memory IP-based rate limiter middleware.
 * @param {Object} options Configuration options
 * @param {number} options.windowMs Time window in milliseconds (default: 1 minute)
 * @param {number} options.maxRequests Maximum requests allowed per window (default: 10)
 * @param {string} options.message Error message returned when rate limit is exceeded
 */
function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 10,
  message = "Too many requests, please try again later.",
} = {}) {
  return (req, res, next) => {
    // Get IP address from various possible headers
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const now = Date.now();

    if (!ipMap.has(ip)) {
      ipMap.set(ip, []);
    }

    // Filter timestamps to only keep ones inside the current window
    const timestamps = ipMap.get(ip).filter((time) => now - time < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    timestamps.push(now);
    ipMap.set(ip, timestamps);
    next();
  };
}

module.exports = { createRateLimiter };
