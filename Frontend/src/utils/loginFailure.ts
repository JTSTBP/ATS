export function loginFailureMessage(error: unknown): string {
  const failure = error as { code?: string; response?: { status?: number } } | null;
  const status = failure?.response?.status;
  if (status === 400 || status === 401) return 'Invalid email or password';
  if (status === 403) return 'Login is not permitted for this account. Please contact your administrator.';
  if (status === 429) return 'Too many login attempts. Please wait and try again.';
  if (status && status >= 500) return 'The login service is temporarily unavailable. Please try again shortly.';
  if (failure?.code === 'ECONNABORTED' || failure?.code === 'ETIMEDOUT') return 'The login server took too long to respond. Please try again shortly.';
  return 'Unable to connect to the login server. Please check your connection and try again.';
}
