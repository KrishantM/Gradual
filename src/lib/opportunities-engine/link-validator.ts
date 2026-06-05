/**
 * Link verification for opportunity URLs.
 *
 * Goes beyond plain status-code checks to detect:
 *   - dead URLs (404/410, DNS failure, connection refused)
 *   - soft 404s (200 OK with "page not found" / "expired" content)
 *   - generic redirects (specific URL silently lands on /careers, /, or a
 *     listings search page instead of the actual opportunity)
 *   - expired postings on known ATSs (Workday, Greenhouse, Lever, etc.) by
 *     hitting their public JSON APIs directly — far more reliable than
 *     scraping HTML on JS-rendered SPAs.
 *
 * Used during ingestion (pre-storage) and on a periodic re-check pass.
 */

// Domains known to block HEAD requests — fall back to a lightweight GET
const HEAD_BLOCKED_DOMAINS = new Set([
  'linkedin.com', 'www.linkedin.com',
  'seek.co.nz', 'www.seek.co.nz',
  'indeed.com', 'indeed.co.nz',
  'glassdoor.com', 'www.glassdoor.com',
]);

// Domains where we skip verification entirely because they aggressively
// block automated requests but are known to be reliable platforms.
const SKIP_VALIDATION_DOMAINS = new Set([
  'linkedin.com', 'www.linkedin.com',
]);

export type LinkVerdict =
  | 'ok'
  | 'dead'              // 404/410 or DNS failure
  | 'soft_404'          // 200 OK but body says page-not-found / expired
  | 'redirected_generic' // landed on listings/careers homepage instead of the job
  | 'auth_required'     // 401/403 — likely behind a login wall, can't be confirmed
  | 'server_error'      // 5xx — site is down, inconclusive
  | 'timeout'
  | 'inconclusive'      // network / fetch error we don't want to penalise on
  | 'invalid_url';

export interface LinkVerificationResult {
  url: string;
  finalUrl: string | null;
  statusCode: number | null;
  verdict: LinkVerdict;
  // True only when we have positive evidence the link works AND points at
  // something specific. Use this for "should we keep it?" decisions.
  trusted: boolean;
  reason: string | null;
  checkedAt: string;
}

const HEAD_TIMEOUT_MS = 5000;
const BODY_TIMEOUT_MS = 7000;
const BODY_BYTES_LIMIT = 256 * 1024; // 256 KB is enough for <head> + first sections

// If the final URL collapses to one of these paths it's clearly a generic
// listings/careers page, not the specific opportunity we asked for.
const GENERIC_LISTING_PATHS = new Set([
  '/', '', '/jobs', '/job', '/careers', '/career',
  '/opportunities', '/opportunity', '/internships', '/internship',
  '/search', '/job-search', '/jobs/search', '/careers/search',
  '/students', '/graduates', '/work', '/work-with-us',
  '/join-us', '/positions', '/openings', '/vacancies',
  '/recruitment', '/hiring', '/apply', '/explore',
]);

// Strong signals that a 200 response is actually a "page not found" /
// expired listing page. Matched case-insensitively against title + first
// chunk of body text. Phrases are intentionally specific to avoid false
// positives on legitimate pages that mention these words in passing.
const SOFT_404_PHRASES: RegExp[] = [
  /\bpage\s+not\s+found\b/i,
  /\b(404|page)\s+(not\s+found|error)\b/i,
  /\bwe\s+(can'?t|cannot|could\s+not|couldn'?t)\s+find\s+(that|the|this)\s+page\b/i,
  /\bthe\s+page\s+(you'?re\s+looking\s+for|you\s+requested|you\s+were\s+looking\s+for)\s+(does\s+not\s+exist|cannot\s+be\s+found|could\s+not\s+be\s+found|isn'?t\s+available)/i,
  /\bthis\s+(opportunity|listing|posting|position|role|vacancy|job)\s+(is\s+)?(no\s+longer\s+available|no\s+longer\s+open|has\s+been\s+filled|has\s+(closed|expired)|has\s+been\s+(closed|removed))/i,
  /\b(applications?|positions?|listings?)\s+(are\s+|is\s+)?(closed|now\s+closed|no\s+longer\s+(open|accepted))\b/i,
  /\bsorry,?\s+(this|that)\s+(page|job|listing|posting|opportunity)/i,
  /\boops!?\s+(something|the\s+page)/i,
  /\bthis\s+listing\s+has\s+expired\b/i,
  /\bjob\s+expired\b/i,
  /\bthis\s+requisition\s+(has\s+been\s+)?(closed|filled|removed)\b/i,
  /\bjob\s+(id\s+)?[A-Z0-9-]+\s+is\s+no\s+longer\s+available\b/i,
  /\bthe\s+job\s+you\s+(are|were)\s+looking\s+for\s+(is|has\s+been)\s+(no\s+longer\s+available|removed|filled|closed)/i,
  /\bunable\s+to\s+find\s+(the\s+)?(requested\s+)?(page|job|posting)\b/i,
];

const TITLE_BLOCK_RE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const META_REFRESH_RE = /<meta[^>]+http-equiv=["']?refresh["']?[^>]*url=([^"'>]+)/i;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractTitle(html: string): string {
  const m = TITLE_BLOCK_RE.exec(html);
  if (!m) return '';
  return decodeEntities(m[1].replace(/\s+/g, ' ').trim());
}

// A very rough text snapshot: strip <script>/<style>, drop tags, collapse
// whitespace. Good enough for phrase matching, not for full parsing.
function extractVisibleText(html: string, limit = 4000): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, limit)
  );
}

function pathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

function isGenericListingPath(pathname: string): boolean {
  const normalised = pathname.replace(/\/+$/, '') || '/';
  if (GENERIC_LISTING_PATHS.has(normalised) || GENERIC_LISTING_PATHS.has(normalised.toLowerCase())) {
    return true;
  }
  // Two-segment listings like /jobs/search, /careers/all
  const segs = pathSegments(normalised);
  if (segs.length === 1) return GENERIC_LISTING_PATHS.has('/' + segs[0].toLowerCase());
  if (segs.length === 2 && ['search', 'all', 'list', 'browse'].includes(segs[1].toLowerCase())) {
    return GENERIC_LISTING_PATHS.has('/' + segs[0].toLowerCase());
  }
  return false;
}

// Detects when a specific opportunity URL has redirected to a clearly
// generic listings/careers page.
function detectGenericRedirect(originalUrl: string, finalUrl: string): boolean {
  try {
    const original = new URL(originalUrl);
    const final = new URL(finalUrl);
    const originalSegs = pathSegments(original.pathname);
    const finalSegs = pathSegments(final.pathname);

    // Same URL, no redirect.
    if (original.href === final.href) return false;

    // Original was already generic — nothing to detect.
    if (originalSegs.length <= 1) return false;

    // Final landed on root or a generic listings path while original was specific.
    if (isGenericListingPath(final.pathname)) return true;

    // Final shed all the specific path tail (kept only first segment).
    if (
      finalSegs.length < originalSegs.length &&
      finalSegs.length <= 1 &&
      originalSegs.length >= 2
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function softHitsForText(text: string, title: string): string | null {
  const haystack = `${title}\n${text}`;
  for (const re of SOFT_404_PHRASES) {
    if (re.test(haystack)) return re.source;
  }
  return null;
}

async function readBodyWithLimit(response: Response, limit: number): Promise<string> {
  if (!response.body) {
    return await response.text();
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (received < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      chunks.push(value);
      received += value.length;
    }
  } finally {
    try { reader.cancel(); } catch { /* ignore */ }
  }
  let total = 0;
  for (const c of chunks) total += c.length;
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.length;
  }
  // Best-effort utf-8 decode; errors are tolerated.
  return new TextDecoder('utf-8', { fatal: false }).decode(buf);
}

// ---------------------------------------------------------------------------
// ATS-specific JSON API verification.
//
// Most branded careers pages are hosted on a known applicant-tracking system.
// Each ATS exposes a public JSON endpoint that returns structured data telling
// us whether a posting is open, archived, or removed — far more reliable than
// scraping HTML, which is often empty on initial load for JS-rendered SPAs
// (Workday, Greenhouse, Lever all fall in this category).
// ---------------------------------------------------------------------------

type AtsPlatform = 'workday' | 'greenhouse' | 'lever' | 'smartrecruiters' | 'workable';

interface AtsApiCheck {
  platform: AtsPlatform;
  apiUrl: string;
  // Returns a verdict to apply, or null to fall through to the HTML check.
  // Returning null means "I don't have a confident answer" — the caller should
  // run the standard HEAD/GET probe and rely on body inspection.
  interpret: (status: number, json: unknown) => LinkVerdict | null;
}

const ATS_API_TIMEOUT_MS = 5000;

function detectAtsApi(url: string): AtsApiCheck | null {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  // --- Workday ---
  // Host: {tenant}.{wdN}.myworkdayjobs.com
  // Path: /[lang/]?{site}/job/{location}/{slug}
  // API:  /wday/cxs/{tenant}/{site}/job/{jobId}
  if (/\.myworkdayjobs\.com$/.test(host)) {
    const hostMatch = /^([^.]+)\.(wd\d+)\.myworkdayjobs\.com$/.exec(host);
    if (hostMatch) {
      const [, tenant, wd] = hostMatch;
      // Strip optional /xx-XX or /xx language prefix.
      const cleanPath = path.replace(/^\/[a-z]{2}(?:-[A-Za-z]{2,4})?(?=\/)/, '');
      const pathMatch = /^\/([^/]+)\/job\/[^/]+\/(.+?)\/?$/.exec(cleanPath);
      if (pathMatch) {
        const [, site, slug] = pathMatch;
        // Job IDs trail the slug after the last underscore (e.g. ..._R-12345).
        const idMatch = /_([^_]+)$/.exec(slug);
        const jobId = idMatch?.[1] ?? slug;
        return {
          platform: 'workday',
          apiUrl: `https://${tenant}.${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/job/${jobId}`,
          interpret: (status, json) => {
            if (status === 404 || status === 410) return 'dead';
            if (status >= 500) return 'server_error';
            if (status === 401 || status === 403) return null;
            if (status === 200 && json && typeof json === 'object') {
              const data = json as Record<string, unknown>;
              const jobInfo = data.jobPostingInfo as Record<string, unknown> | undefined;
              if (!jobInfo) return null;
              if (jobInfo.unpostedDate) return 'dead';
              const externalApply = jobInfo.externalApply;
              if (externalApply === false && jobInfo.applyButtonEnabled === false) return 'dead';
              return 'ok';
            }
            return null;
          },
        };
      }
    }
  }

  // --- Greenhouse ---
  // Host: boards.greenhouse.io | job-boards.greenhouse.io
  // Path: /{board}/jobs/{jobId}
  if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') {
    const m = /^\/([^/]+)\/jobs\/(\d+)\/?/.exec(path);
    if (m) {
      const [, board, jobId] = m;
      return {
        platform: 'greenhouse',
        apiUrl: `https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${jobId}`,
        interpret: (status) => {
          if (status === 404 || status === 410) return 'dead';
          if (status === 200) return 'ok';
          if (status >= 500) return 'server_error';
          return null;
        },
      };
    }
  }

  // --- Lever ---
  // Host: jobs.lever.co | jobs.eu.lever.co
  // Path: /{company}/{postingId}[/apply]
  if (host === 'jobs.lever.co' || host === 'jobs.eu.lever.co') {
    const m = /^\/([^/]+)\/([^/]+)\/?/.exec(path);
    if (m) {
      const [, company, postingId] = m;
      const apiHost = host === 'jobs.eu.lever.co' ? 'api.eu.lever.co' : 'api.lever.co';
      return {
        platform: 'lever',
        apiUrl: `https://${apiHost}/v0/postings/${company}/${postingId}`,
        interpret: (status, json) => {
          if (status === 404 || status === 410) return 'dead';
          if (status === 200 && json && typeof json === 'object') {
            const posting = json as Record<string, unknown>;
            const state = (posting.state as string | undefined)?.toLowerCase();
            if (state === 'closed' || state === 'archived' || state === 'rejected') return 'dead';
            return 'ok';
          }
          if (status >= 500) return 'server_error';
          return null;
        },
      };
    }
  }

  // --- SmartRecruiters ---
  // Host: jobs.smartrecruiters.com | careers.smartrecruiters.com
  // Path: /{company}/{postingId} (postingId is digits, optionally with -slug suffix)
  if (host === 'jobs.smartrecruiters.com' || host === 'careers.smartrecruiters.com') {
    const m = /^\/([^/]+)\/(\d+)(?:-[^/]*)?\/?/.exec(path);
    if (m) {
      const [, company, postingId] = m;
      return {
        platform: 'smartrecruiters',
        apiUrl: `https://api.smartrecruiters.com/v1/companies/${company}/postings/${postingId}`,
        interpret: (status, json) => {
          if (status === 404 || status === 410) return 'dead';
          if (status === 200 && json && typeof json === 'object') {
            const posting = json as Record<string, unknown>;
            const s = (posting.status as string | undefined)?.toUpperCase();
            if (s === 'ARCHIVED' || s === 'CLOSED' || s === 'INACTIVE' || s === 'REJECTED') return 'dead';
            return 'ok';
          }
          if (status >= 500) return 'server_error';
          return null;
        },
      };
    }
  }

  // --- Workable ---
  // Host: apply.workable.com
  // Path: /{company}/j/{shortcode}/
  if (host === 'apply.workable.com') {
    const m = /^\/([^/]+)\/j\/([A-Z0-9]+)\/?/i.exec(path);
    if (m) {
      const [, company, shortcode] = m;
      return {
        platform: 'workable',
        apiUrl: `https://apply.workable.com/api/v3/accounts/${company}/jobs/${shortcode}`,
        interpret: (status, json) => {
          if (status === 404 || status === 410) return 'dead';
          if (status === 200 && json && typeof json === 'object') {
            const job = json as Record<string, unknown>;
            const state = (job.state as string | undefined)?.toLowerCase();
            if (state === 'archived' || state === 'closed' || state === 'draft') return 'dead';
            return 'ok';
          }
          if (status >= 500) return 'server_error';
          return null;
        },
      };
    }
  }

  return null;
}

async function verifyViaAtsApi(
  ats: AtsApiCheck,
  originalUrl: string,
  budgetMs: number
): Promise<LinkVerificationResult | null> {
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = Math.min(ATS_API_TIMEOUT_MS, Math.max(1500, budgetMs));
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(ats.apiUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GradualBot/1.0 (career-opportunity-validator)',
      },
    });
    let json: unknown = null;
    try { json = await r.json(); } catch { /* not JSON, leave null */ }
    const verdict = ats.interpret(r.status, json);
    if (verdict === null) return null;
    return {
      url: originalUrl,
      finalUrl: originalUrl,
      statusCode: r.status,
      verdict,
      trusted: verdict === 'ok',
      reason: verdict === 'ok' ? `ats_api_open:${ats.platform}` : `ats_api_${verdict}:${ats.platform}`,
      checkedAt,
    };
  } catch {
    // Timeout or network failure on the ATS API — fall through to HTML probe
    // rather than penalising the URL on a transient ATS issue.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface VerifyOpts {
  // Per-URL wall-clock budget covering both HEAD and GET.
  budgetMs?: number;
  // Allow skipping the GET body fetch (e.g. for known-good platforms).
  skipBodyCheck?: boolean;
}

/**
 * Verify that a URL points at a real, specific opportunity. Performs a HEAD,
 * then (when warranted) a small GET to read the page title + first chunk of
 * body, and runs soft-404 + generic-redirect detection.
 */
export async function verifyOpportunityLink(
  url: string,
  opts: VerifyOpts = {}
): Promise<LinkVerificationResult> {
  const checkedAt = new Date().toISOString();
  const budgetMs = opts.budgetMs ?? BODY_TIMEOUT_MS + HEAD_TIMEOUT_MS;
  const startedAt = Date.now();

  // 1. URL parse.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      url, finalUrl: null, statusCode: null,
      verdict: 'invalid_url', trusted: false,
      reason: 'invalid_url_format', checkedAt,
    };
  }

  const domain = parsed.hostname;

  // 2. Domains we trust without probing (login walls / aggressive bot blockers).
  if (SKIP_VALIDATION_DOMAINS.has(domain)) {
    return {
      url, finalUrl: url, statusCode: null,
      verdict: 'ok', trusted: true,
      reason: 'skipped_known_platform', checkedAt,
    };
  }

  // 2b. ATS-specific JSON API check. Workday/Greenhouse/Lever/SmartRecruiters/
  // Workable expose structured "is this posting open?" endpoints. When the URL
  // matches a known ATS pattern, this is far more reliable than HTML scraping
  // because the actual job page is JS-rendered and the static HTML reveals
  // nothing about the posting's status.
  const atsCheck = detectAtsApi(url);
  if (atsCheck) {
    const remainingForAts = budgetMs - (Date.now() - startedAt);
    if (remainingForAts >= 1500) {
      const atsResult = await verifyViaAtsApi(atsCheck, url, remainingForAts);
      if (atsResult) return atsResult;
    }
    // Fall through to HTML probe if the ATS API was inconclusive or timed out.
  }

  const useGetForStatus = HEAD_BLOCKED_DOMAINS.has(domain);

  // 3. Initial HEAD/GET to resolve final URL + status.
  const remainingBeforeHead = budgetMs - (Date.now() - startedAt);
  const headTimeout = Math.min(HEAD_TIMEOUT_MS, Math.max(1500, remainingBeforeHead));
  const headController = new AbortController();
  const headTimer = setTimeout(() => headController.abort(), headTimeout);

  let firstResponse: Response | null = null;
  try {
    firstResponse = await fetch(url, {
      method: useGetForStatus ? 'GET' : 'HEAD',
      signal: headController.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'GradualBot/1.0 (career-opportunity-validator)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
  } catch (err: unknown) {
    clearTimeout(headTimer);
    const e = err as { name?: string; message?: string };
    if (e?.name === 'AbortError') {
      return { url, finalUrl: null, statusCode: null, verdict: 'timeout', trusted: false, reason: 'head_timeout', checkedAt };
    }
    const msg = e?.message ?? 'unknown_error';
    if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
      return { url, finalUrl: null, statusCode: null, verdict: 'dead', trusted: false, reason: 'dns_failure', checkedAt };
    }
    if (msg.includes('ECONNREFUSED')) {
      return { url, finalUrl: null, statusCode: null, verdict: 'dead', trusted: false, reason: 'connection_refused', checkedAt };
    }
    return { url, finalUrl: null, statusCode: null, verdict: 'inconclusive', trusted: false, reason: `fetch_error: ${msg.slice(0, 120)}`, checkedAt };
  } finally {
    clearTimeout(headTimer);
  }

  const status = firstResponse.status;
  const finalUrl = firstResponse.url || url;

  // Hard fails on status.
  if (status === 404 || status === 410) {
    return { url, finalUrl, statusCode: status, verdict: 'dead', trusted: false, reason: `http_${status}`, checkedAt };
  }
  if (status === 401 || status === 403) {
    return { url, finalUrl, statusCode: status, verdict: 'auth_required', trusted: false, reason: `http_${status}`, checkedAt };
  }
  if (status >= 500) {
    return { url, finalUrl, statusCode: status, verdict: 'server_error', trusted: false, reason: `http_${status}`, checkedAt };
  }
  if (status >= 400) {
    return { url, finalUrl, statusCode: status, verdict: 'dead', trusted: false, reason: `http_${status}`, checkedAt };
  }

  // 4. Generic-redirect detection on final URL — works regardless of body.
  if (detectGenericRedirect(url, finalUrl)) {
    return {
      url, finalUrl, statusCode: status,
      verdict: 'redirected_generic', trusted: false,
      reason: 'final_url_is_generic_listings', checkedAt,
    };
  }

  // 5. Body inspection (soft-404 detection). Skip if caller said so or if we
  // already exceeded our budget.
  if (opts.skipBodyCheck) {
    return { url, finalUrl, statusCode: status, verdict: 'ok', trusted: true, reason: null, checkedAt };
  }

  const remainingForBody = budgetMs - (Date.now() - startedAt);
  if (remainingForBody < 1500) {
    // Not enough time to fetch the body — treat as ok-but-untrusted so
    // callers can decide. We default to trusting status-only here because
    // dropping borderline cases on a slow run would shrink the catalogue.
    return { url, finalUrl, statusCode: status, verdict: 'ok', trusted: true, reason: 'body_check_skipped_budget', checkedAt };
  }

  // If we already used GET for the status check, reuse that body. Otherwise
  // do a fresh GET (HEAD has no body).
  let html = '';
  try {
    if (useGetForStatus) {
      html = await readBodyWithLimit(firstResponse, BODY_BYTES_LIMIT);
    } else {
      const bodyController = new AbortController();
      const bodyTimer = setTimeout(() => bodyController.abort(), Math.min(BODY_TIMEOUT_MS, remainingForBody));
      try {
        const r = await fetch(finalUrl, {
          method: 'GET',
          signal: bodyController.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'GradualBot/1.0 (career-opportunity-validator)',
            'Accept': 'text/html,application/xhtml+xml',
            // Many CDNs honour Range and respond faster.
            'Range': `bytes=0-${BODY_BYTES_LIMIT - 1}`,
          },
        });
        // Update finalUrl in case the GET resolved a different redirect chain
        // (rare, but happens when HEAD is partially blocked).
        const finalGetUrl = r.url || finalUrl;
        if (detectGenericRedirect(url, finalGetUrl)) {
          return {
            url, finalUrl: finalGetUrl, statusCode: r.status,
            verdict: 'redirected_generic', trusted: false,
            reason: 'final_url_is_generic_listings', checkedAt,
          };
        }
        html = await readBodyWithLimit(r, BODY_BYTES_LIMIT);
      } finally {
        clearTimeout(bodyTimer);
      }
    }
  } catch (err: unknown) {
    const e = err as { name?: string };
    if (e?.name === 'AbortError') {
      // Body fetch timed out — accept the status-only verdict.
      return { url, finalUrl, statusCode: status, verdict: 'ok', trusted: true, reason: 'body_timeout', checkedAt };
    }
    return { url, finalUrl, statusCode: status, verdict: 'ok', trusted: true, reason: 'body_fetch_error', checkedAt };
  }

  // Detect client-side meta refresh that points at a generic page.
  const meta = META_REFRESH_RE.exec(html);
  if (meta) {
    try {
      const refreshTarget = new URL(meta[1].trim(), finalUrl).href;
      if (detectGenericRedirect(url, refreshTarget)) {
        return {
          url, finalUrl: refreshTarget, statusCode: status,
          verdict: 'redirected_generic', trusted: false,
          reason: 'meta_refresh_to_generic', checkedAt,
        };
      }
    } catch { /* ignore */ }
  }

  const title = extractTitle(html);
  const text = extractVisibleText(html);
  const softHit = softHitsForText(text, title);
  if (softHit) {
    return {
      url, finalUrl, statusCode: status,
      verdict: 'soft_404', trusted: false,
      reason: `soft_404_phrase:${softHit.slice(0, 60)}`, checkedAt,
    };
  }

  return { url, finalUrl, statusCode: status, verdict: 'ok', trusted: true, reason: null, checkedAt };
}

// Concurrency-limited batch verification with an optional global wall-clock
// budget. URLs that don't get checked within the budget come back with a
// `inconclusive` verdict so callers can decide what to do.
export async function verifyOpportunityLinks(
  urls: string[],
  opts: { concurrency?: number; perUrlBudgetMs?: number; totalBudgetMs?: number } = {}
): Promise<LinkVerificationResult[]> {
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 8, 16));
  const perUrlBudgetMs = opts.perUrlBudgetMs ?? HEAD_TIMEOUT_MS + BODY_TIMEOUT_MS;
  const totalBudgetMs = opts.totalBudgetMs ?? 45_000;
  const startedAt = Date.now();

  const results: LinkVerificationResult[] = new Array(urls.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= urls.length) return;
      const url = urls[i];
      const elapsed = Date.now() - startedAt;
      if (elapsed >= totalBudgetMs) {
        results[i] = {
          url, finalUrl: null, statusCode: null,
          verdict: 'inconclusive', trusted: false,
          reason: 'global_budget_exceeded', checkedAt: new Date().toISOString(),
        };
        continue;
      }
      const remaining = totalBudgetMs - elapsed;
      results[i] = await verifyOpportunityLink(url, {
        budgetMs: Math.min(perUrlBudgetMs, remaining),
      });
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
