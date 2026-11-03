const endpoint = '/.netlify/functions/profiles';
async function requestProfile(path = '', options = {}) {
  let response;
  try {
    response = await fetch(endpoint + path, { credentials: 'same-origin', ...options });
  } catch {
    throw new Error('Unable to reach profiles. Check your connection and try again.');
  }
  let data;
  try { data = await response.json(); } catch { /* A failed deployment may return an HTML error page. */ }
  if (!response.ok || !data || typeof data !== 'object') {
    const fallback = response.status === 401 ? 'Your session has expired. Please sign in again.' :
      'Profiles are temporarily unavailable. Please try again shortly.';
    const error = new Error(typeof data?.error === 'string' ? data.error : fallback);
    error.status = response.status;
    throw error;
  }
  return data;
}
export const ensureProfile = () => requestProfile('', { method: 'POST' });
export const getProfile = (id) => requestProfile(`?id=${encodeURIComponent(id)}`);
export const updateProfile = (changes) => requestProfile('', {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes),
});
