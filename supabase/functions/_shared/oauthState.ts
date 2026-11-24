// Signed OAuth `state` (anti-CSRF): payload + HMAC-SHA256, valid 10 minutes.
// Prevents a forged state from attaching a social account to another user
// and restricts post-login redirects to APP_URL.

const STATE_TTL_MS = 10 * 60 * 1000;

export interface OAuthState {
  user_id: string;
  platform: string;
  redirect_url: string;
  code_verifier?: string;
  csrf?: string;
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('OAUTH_STATE_SECRET');
  if (!secret) throw new Error('OAUTH_STATE_SECRET is not set');
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/** Only allow redirects back to the app itself. */
export function safeRedirectUrl(path: unknown): string {
  const appUrl = Deno.env.get('APP_URL')!;
  const p = typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/accounts';
  return appUrl + p;
}

export async function signState(state: OAuthState): Promise<string> {
  const payload = enc.encode(JSON.stringify({ ...state, exp: Date.now() + STATE_TTL_MS }));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(), payload));
  return `${b64url(payload)}.${b64url(sig)}`;
}

export async function verifyState(raw: string): Promise<OAuthState> {
  const [p, s] = raw.split('.');
  if (!p || !s) throw new Error('Invalid state');
  const payload = fromB64url(p);
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(), fromB64url(s), payload);
  if (!ok) throw new Error('Invalid state signature');
  const state = JSON.parse(new TextDecoder().decode(payload));
  if (typeof state.exp !== 'number' || state.exp < Date.now()) throw new Error('State expired');
  const appUrl = Deno.env.get('APP_URL')!;
  if (typeof state.redirect_url !== 'string' || !state.redirect_url.startsWith(appUrl + '/')) {
    throw new Error('Invalid redirect');
  }
  return state;
}
