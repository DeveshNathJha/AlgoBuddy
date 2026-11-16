/**
 * User-facing error handling (safe for client and server).
 *
 * Rule: only messages written for users are ever shown. Anything else (provider
 * JSON, "fetch failed", stack traces, storage errors) is mapped to a plain
 * sentence, and the technical detail stays in the server/browser console.
 */

/** An error whose message was written for end users and may be shown as-is. */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

/** A failed HTTP call to an AI provider. `detail` is for logs only. */
export class ProviderError extends Error {
  constructor(
    public provider: string,
    public status: number,
    public detail: string
  ) {
    super(`${provider} HTTP ${status}: ${detail}`);
    this.name = 'ProviderError';
  }
}

export const GENERIC_ERROR = 'Something went wrong on our side. Please try again in a moment.';

export function toUserMessage(err: unknown): string {
  if (err instanceof UserError) return err.message;

  if (err instanceof ProviderError) {
    const d = err.detail.toLowerCase();
    if (err.status === 401 || err.status === 403 || d.includes('api key') || d.includes('api_key')) {
      return 'The AI provider rejected the API key. Please check your key in Settings.';
    }
    if (err.status === 404 || (d.includes('model') && (d.includes('not found') || d.includes('does not exist')))) {
      return 'The selected AI model is no longer available. Open Settings and choose another model.';
    }
    if (err.status === 429 || d.includes('quota') || d.includes('rate limit')) {
      return 'The AI provider is busy or the key has hit its limit. Please wait a minute and try again.';
    }
    if (err.status === 413 || d.includes('too long') || d.includes('context length') || d.includes('token')) {
      return 'The problem or code is too long for this model. Try shortening it.';
    }
    if (err.status >= 500) return 'The AI service is having trouble right now. Please try again in a minute.';
    return 'The AI service could not handle this request. Please try again.';
  }

  const name = (err as { name?: string })?.name || '';
  const msg = String((err as { message?: string })?.message || '').toLowerCase();
  if (name === 'TimeoutError' || name === 'AbortError' || msg.includes('timeout') || msg.includes('aborted')) {
    return 'The AI took too long to respond. Please try again.';
  }
  if (msg.includes('fetch failed') || msg.includes('econn') || msg.includes('enotfound') || msg.includes('network')) {
    return 'Could not reach the AI service. Please try again in a moment.';
  }
  return GENERIC_ERROR;
}
