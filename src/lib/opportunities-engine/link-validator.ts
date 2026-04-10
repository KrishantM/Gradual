/**
 * Link Validator for Opportunity URLs
 *
 * Performs HTTP HEAD checks to verify opportunity URLs are reachable.
 * Handles redirects, timeouts, and common error patterns.
 * Designed to be called during ingestion or as a periodic cleanup pass.
 */

export interface LinkValidationResult {
  url: string;
  isValid: boolean;
  statusCode: number | null;
  finalUrl: string | null;
  error: string | null;
  checkedAt: string;
}

const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;

// Domains known to block HEAD requests — fall back to a lightweight GET
const HEAD_BLOCKED_DOMAINS = new Set([
  'linkedin.com', 'www.linkedin.com',
  'seek.co.nz', 'www.seek.co.nz',
  'indeed.com', 'indeed.co.nz',
  'glassdoor.com', 'www.glassdoor.com',
]);

// Domains where we skip validation because they are known-good platforms
// that may rate-limit or block automated requests
const SKIP_VALIDATION_DOMAINS = new Set([
  'linkedin.com', 'www.linkedin.com',
]);

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Validate a single URL by checking it returns a successful HTTP response.
 * Uses HEAD first, falls back to GET if HEAD is blocked.
 */
export async function validateLink(url: string): Promise<LinkValidationResult> {
  const checkedAt = new Date().toISOString();

  // Basic URL format validation
  try {
    new URL(url);
  } catch {
    return { url, isValid: false, statusCode: null, finalUrl: null, error: 'invalid_url_format', checkedAt };
  }

  const domain = extractDomain(url);

  // Skip validation for known-good domains that block automated requests
  if (domain && SKIP_VALIDATION_DOMAINS.has(domain)) {
    return { url, isValid: true, statusCode: null, finalUrl: url, error: null, checkedAt };
  }

  const useGet = domain ? HEAD_BLOCKED_DOMAINS.has(domain) : false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      method: useGet ? 'GET' : 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'GradualBot/1.0 (career-opportunity-validator)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeout);

    const finalUrl = response.url || url;
    const statusCode = response.status;

    // 2xx = valid
    if (statusCode >= 200 && statusCode < 300) {
      return { url, isValid: true, statusCode, finalUrl, error: null, checkedAt };
    }

    // 3xx = redirect (shouldn't happen with redirect: 'follow' but handle defensively)
    if (statusCode >= 300 && statusCode < 400) {
      return { url, isValid: true, statusCode, finalUrl, error: null, checkedAt };
    }

    // 403/401 — could be a login wall; treat as potentially valid (common for job boards)
    if (statusCode === 401 || statusCode === 403) {
      return { url, isValid: true, statusCode, finalUrl, error: 'auth_required', checkedAt };
    }

    // 404, 410 = definitively dead
    if (statusCode === 404 || statusCode === 410) {
      return { url, isValid: false, statusCode, finalUrl, error: `http_${statusCode}`, checkedAt };
    }

    // 5xx = server error — may be temporary, flag but don't reject
    if (statusCode >= 500) {
      return { url, isValid: true, statusCode, finalUrl, error: 'server_error', checkedAt };
    }

    // Other 4xx = client error
    return { url, isValid: false, statusCode, finalUrl, error: `http_${statusCode}`, checkedAt };

  } catch (err: any) {
    if (err.name === 'AbortError') {
      // Timeout — treat as potentially valid (slow site ≠ dead site)
      return { url, isValid: true, statusCode: null, finalUrl: null, error: 'timeout', checkedAt };
    }

    // Network errors (DNS failure, connection refused, etc.)
    const message = err.message || 'unknown_error';
    const isDnsFailure = message.includes('ENOTFOUND') || message.includes('getaddrinfo');
    const isConnectionRefused = message.includes('ECONNREFUSED');

    if (isDnsFailure) {
      return { url, isValid: false, statusCode: null, finalUrl: null, error: 'dns_failure', checkedAt };
    }

    if (isConnectionRefused) {
      return { url, isValid: false, statusCode: null, finalUrl: null, error: 'connection_refused', checkedAt };
    }

    // Other errors — treat as inconclusive, don't reject
    return { url, isValid: true, statusCode: null, finalUrl: null, error: `fetch_error: ${message.slice(0, 100)}`, checkedAt };
  }
}

/**
 * Validate multiple URLs with concurrency control.
 * Returns results for all URLs.
 */
export async function validateLinks(
  urls: string[],
  concurrency: number = 5
): Promise<LinkValidationResult[]> {
  const results: LinkValidationResult[] = [];
  const queue = [...urls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;
      const result = await validateLink(url);
      results.push(result);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Normalize a URL for deduplication and storage.
 * Removes tracking parameters, normalizes protocol, etc.
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'source', 'clickid',
    ];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    // Normalize
    parsed.hash = '';
    let normalized = parsed.toString();

    // Remove trailing slash (but not for root paths)
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return url;
  }
}
