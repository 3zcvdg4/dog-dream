const RESEND_API_URL = 'https://api.resend.com/emails';
const ALLOWED_METHODS = 'POST, OPTIONS';
const CONFIG_ALLOWED_METHODS = 'GET, OPTIONS';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://dogdreamspace.com',
  'https://www.dogdreamspace.com',
  'https://dogdreamspace.pages.dev',
];
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 600;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 5;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  });
}

function errorResponse(code, message, status, headers) {
  return json(
    {
      error: message,
      errorCode: code,
    },
    {
      status,
      headers,
    },
  );
}

function getAllowedOrigins(env) {
  const configured = (env.ALLOWED_ORIGIN ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function buildCorsHeaders(origin, env) {
  const allowedOrigins = getAllowedOrigins(env);
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function isValidEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikeEmail(value) {
  return typeof value === 'string' && value.includes('@');
}

function validatePayload(payload) {
  const errors = [];

  if (payload.company) {
    errors.push('Spam rejected.');
  }
  if (!payload.name) {
    errors.push('Missing name.');
  }
  if (!payload.contact) {
    errors.push('Missing contact.');
  }
  if (!payload.message) {
    errors.push('Missing message.');
  }
  if (payload.name.length > 80) {
    errors.push('Name is too long.');
  }
  if (payload.contact.length > 120) {
    errors.push('Contact is too long.');
  }
  if (looksLikeEmail(payload.contact) && !isValidEmail(payload.contact)) {
    errors.push('Invalid email format.');
  }
  if (payload.message.length > 5000) {
    errors.push('Message is too long.');
  }

  return errors;
}

async function verifyTurnstile(token, ip, env) {
  if (!token) {
    return { ok: false, reason: 'Turnstile token is required.', code: 'turnstile_required' };
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    return { ok: false, reason: 'Turnstile is not configured.', code: 'turnstile_unavailable' };
  }

  let response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip ?? '',
      }),
    });
  } catch {
    return { ok: false, reason: 'Turnstile verification is unavailable.', code: 'turnstile_unavailable' };
  }

  if (!response.ok) {
    return { ok: false, reason: 'Turnstile verification failed.', code: 'turnstile_failed' };
  }

  const result = await response.json();
  return {
    ok: Boolean(result.success),
    reason: result.success ? '' : 'Turnstile verification failed.',
    code: result.success ? '' : 'turnstile_failed',
  };
}

function getRateLimitConfig(env) {
  return {
    maxRequests: parsePositiveInteger(env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_RATE_LIMIT_MAX_REQUESTS),
    windowSeconds: parsePositiveInteger(env.RATE_LIMIT_WINDOW_SECONDS, DEFAULT_RATE_LIMIT_WINDOW_SECONDS),
  };
}

async function enforceRateLimit(ip, env) {
  if (!env.CONTACT_RATE_LIMIT) {
    return { ok: false, code: 'rate_limit_unavailable', reason: 'Rate limit storage is not configured.' };
  }

  if (!ip) {
    return { ok: false, code: 'rate_limit_unavailable', reason: 'Cannot determine client IP.' };
  }

  const { maxRequests, windowSeconds } = getRateLimitConfig(env);
  const key = `contact-rate:${ip}`;
  const now = Date.now();

  let currentCount = 0;
  let resetAt = now + (windowSeconds * 1000);

  try {
    const existing = await env.CONTACT_RATE_LIMIT.get(key, 'json');
    if (existing && typeof existing === 'object') {
      if (typeof existing.resetAt === 'number' && existing.resetAt > now) {
        currentCount = Number.isFinite(existing.count) ? existing.count : 0;
        resetAt = existing.resetAt;
      }
    }

    if (currentCount >= maxRequests) {
      return {
        ok: false,
        code: 'rate_limited',
        reason: 'Too many requests.',
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      };
    }

    const nextCount = currentCount + 1;
    await env.CONTACT_RATE_LIMIT.put(
      key,
      JSON.stringify({
        count: nextCount,
        resetAt,
      }),
      {
        expirationTtl: windowSeconds,
      },
    );

    return {
      ok: true,
      remaining: Math.max(0, maxRequests - nextCount),
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  } catch {
    return { ok: false, code: 'rate_limit_unavailable', reason: 'Rate limit storage is unavailable.' };
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMessageHtml(payload, origin) {
  const lines = [
    '<h2>Dog Dream Space 新留言</h2>',
    `<p><strong>来源站点：</strong>${escapeHtml(origin)}</p>`,
    `<p><strong>称呼：</strong>${escapeHtml(payload.name)}</p>`,
    `<p><strong>联系方式：</strong>${escapeHtml(payload.contact)}</p>`,
    '<p><strong>留言内容：</strong></p>',
    `<p>${escapeHtml(payload.message).replace(/\n/g, '<br />')}</p>`,
  ];

  return lines.join('');
}

async function handleContactConfigRequest(request, env) {
  const origin = request.headers.get('Origin') ?? '';
  const corsHeaders = buildCorsHeaders(origin, env);

  if (!env.TURNSTILE_SITE_KEY) {
    return errorResponse('service_unavailable', 'Turnstile site key is not configured.', 500, corsHeaders);
  }

  return json(
    {
      turnstileSiteKey: env.TURNSTILE_SITE_KEY,
    },
    {
      status: 200,
      headers: corsHeaders,
    },
  );
}

async function handleContactRequest(request, env) {
  const origin = request.headers.get('Origin') ?? '';
  const corsHeaders = buildCorsHeaders(origin, env);
  const allowedOrigins = getAllowedOrigins(env);

  if (!allowedOrigins.includes(origin)) {
    return errorResponse('origin_not_allowed', 'Origin not allowed.', 403, corsHeaders);
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    return errorResponse('service_unavailable', 'Mail service is not configured.', 500, corsHeaders);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('invalid_request', 'Invalid JSON body.', 400, corsHeaders);
  }

  const payload = {
    company: normalizeText(body.company),
    name: normalizeText(body.name),
    contact: normalizeText(body.contact),
    message: normalizeText(body.message),
    turnstileToken: normalizeText(body.turnstileToken),
  };

  const validationErrors = validatePayload(payload);
  if (validationErrors.length > 0) {
    const firstError = validationErrors[0];
    const errorCode = firstError === 'Invalid email format.' ? 'invalid_email' : 'invalid_request';
    return errorResponse(errorCode, firstError, 400, corsHeaders);
  }

  // Only verify Turnstile if a token was provided by the client.
  // When Turnstile is unreachable from the visitor's network, the form
  // still works thanks to KV-based rate limiting as the primary safeguard.
  if (payload.turnstileToken) {
    const turnstileCheck = await verifyTurnstile(
      payload.turnstileToken,
      request.headers.get('CF-Connecting-IP'),
      env,
    );

    if (!turnstileCheck.ok) {
      return errorResponse(turnstileCheck.code, turnstileCheck.reason, 403, corsHeaders);
    }
  }

  const rateLimitCheck = await enforceRateLimit(request.headers.get('CF-Connecting-IP'), env);
  if (!rateLimitCheck.ok) {
    const status = rateLimitCheck.code === 'rate_limited' ? 429 : 503;
    return errorResponse(
      rateLimitCheck.code === 'rate_limited' ? 'rate_limited' : 'service_unavailable',
      rateLimitCheck.reason,
      status,
      {
        ...corsHeaders,
        ...(rateLimitCheck.retryAfterSeconds ? { 'Retry-After': String(rateLimitCheck.retryAfterSeconds) } : {}),
      },
    );
  }

  let resendResponse;
  try {
    resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        ...(isValidEmail(payload.contact) ? { reply_to: payload.contact } : {}),
        subject: `Dog Dream Space 联系留言 - ${payload.name}`,
        text: [
          'Dog Dream Space 收到一条新留言',
          `来源站点: ${origin}`,
          `称呼: ${payload.name}`,
          `联系方式: ${payload.contact}`,
          '',
          '留言内容:',
          payload.message,
        ].join('\n'),
        html: buildMessageHtml(payload, origin),
      }),
    });
  } catch {
    return errorResponse('service_unavailable', 'Resend request failed.', 502, corsHeaders);
  }

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    return errorResponse('service_unavailable', `Resend request failed: ${errorText}`, 502, corsHeaders);
  }

  return json({ ok: true }, { status: 200, headers: corsHeaders });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact-config') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            ...buildCorsHeaders(request.headers.get('Origin') ?? '', env),
            Allow: CONFIG_ALLOWED_METHODS,
          },
        });
      }

      if (request.method !== 'GET') {
        return errorResponse(
          'method_not_allowed',
          'Method not allowed.',
          405,
          {
            ...buildCorsHeaders(request.headers.get('Origin') ?? '', env),
            Allow: CONFIG_ALLOWED_METHODS,
          },
        );
      }

      return handleContactConfigRequest(request, env);
    }

    if (url.pathname === '/api/contact') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: buildCorsHeaders(request.headers.get('Origin') ?? '', env),
        });
      }

      if (request.method !== 'POST') {
        return errorResponse(
          'method_not_allowed',
          'Method not allowed.',
          405,
          {
            headers: {
              ...buildCorsHeaders(request.headers.get('Origin') ?? '', env),
              Allow: ALLOWED_METHODS,
            },
          },
        );
      }

      return handleContactRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
