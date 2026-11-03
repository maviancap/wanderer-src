// @vitest-environment jsdom
import React from 'react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ getProfile: vi.fn(), updateProfile: vi.fn() }));
vi.mock('../services/profiles', () => mocks);
import UserProfileStore from '../components/userProfile/stores/UserProfileStore';
const profile = { id: 'profile-id', name: 'Wanderer', description: 'Original bio', status: 'Hello' };
function Probe() {
  const store = UserProfileStore.useContainer();
  return <>
    <button onClick={() => store.setUserId('profile-id')}>Load</button>
    <p>{store.loading ? 'Loading' : store.userInfo?.description}</p>
    {store.lastError && <p role='alert'>{store.lastError}</p>}
    {store.saveError && <p role='alert'>{store.saveError}</p>}
    <button onClick={() => store.saveProfile({ description: 'Saved bio' })}>Save</button>
    <button onClick={store.retry}>Retry</button>
  </>;
}
beforeEach(() => { vi.resetAllMocks(); });
afterEach(cleanup);
it('loads and updates the existing profile store after saving', async () => {
  mocks.getProfile.mockResolvedValue(profile);
  mocks.updateProfile.mockResolvedValue({ ...profile, description: 'Saved bio' });
  render(<UserProfileStore.Provider><Probe /></UserProfileStore.Provider>);
  fireEvent.click(screen.getByText('Load'));
  await waitFor(() => expect(screen.getByText('Original bio')).toBeTruthy());
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(screen.getByText('Saved bio')).toBeTruthy());
});
it('keeps the previous bio visible if saving fails', async () => {
  mocks.getProfile.mockResolvedValue(profile);
  mocks.updateProfile.mockRejectedValue(new Error('Please retry.'));
  render(<UserProfileStore.Provider><Probe /></UserProfileStore.Provider>);
  fireEvent.click(screen.getByText('Load'));
  await waitFor(() => expect(screen.getByText('Original bio')).toBeTruthy());
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Please retry.'));
  expect(screen.getByText('Original bio')).toBeTruthy();
});
it('shows load failures and successfully retries', async () => {
  mocks.getProfile.mockRejectedValueOnce(new Error('Temporarily unavailable.')).mockResolvedValueOnce(profile);
  render(<UserProfileStore.Provider><Probe /></UserProfileStore.Provider>);
  fireEvent.click(screen.getByText('Load'));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Temporarily unavailable.'));
  fireEvent.click(screen.getByText('Retry'));
  await waitFor(() => expect(screen.getByText('Original bio')).toBeTruthy());
});
