// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
const mocked = vi.hoisted(() => ({ getUser: vi.fn(), processAuthCallback: vi.fn(), unsubscribe: vi.fn(), listener: null }));
vi.mock('../services/profiles', () => ({ ensureProfile: vi.fn().mockResolvedValue({}) }));
vi.mock('@netlify/identity', () => ({ onAuthChange: listener => { mocked.listener = listener; return mocked.unsubscribe; } }));
vi.mock('../services/auth', () => ({ getUser: mocked.getUser, processAuthCallback: mocked.processAuthCallback, authErrorMessage: error => error.message }));
import AuthenticationStore from '../stores/authentication';
function Status() {
  const auth = AuthenticationStore.useContainer();
  return <div>{auth.isPending ? 'pending' : auth.username || 'signed out'}{auth.authError && <p role='alert'>{auth.authError}</p>}</div>;
}
beforeEach(() => { vi.clearAllMocks(); mocked.processAuthCallback.mockResolvedValue(null); });
afterEach(cleanup);
it('restores a session and responds to logout in another tab', async () => {
  mocked.getUser.mockResolvedValue({ id: 'identity-user', email: 'member@example.test', name: 'Wanderer' });
  const view = render(<AuthenticationStore.Provider><Status /></AuthenticationStore.Provider>);
  await waitFor(() => expect(screen.getByText('Wanderer')).toBeTruthy());
  act(() => mocked.listener('logout', null));
  expect(screen.getByText('signed out')).toBeTruthy();
  view.unmount();
  expect(mocked.unsubscribe).toHaveBeenCalledOnce();
});
it('shows a confirmation error without leaving the page loading', async () => {
  mocked.processAuthCallback.mockRejectedValue(new Error('Confirmation link expired.'));
  render(<AuthenticationStore.Provider><Status /></AuthenticationStore.Provider>);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Confirmation link expired.'));
  expect(screen.getByText('signed out', { exact: false })).toBeTruthy();
});
