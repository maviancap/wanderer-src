// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocked = vi.hoisted(() => ({
  signup: vi.fn(), login: vi.fn(), recoverPassword: vi.fn(), resetPassword: vi.fn(), getUser: vi.fn(),
  auth: { isPending: false, isAuthenticated: false, authError: null, needsPasswordReset: false },
  replace: vi.fn(),
}));
vi.mock('next/router', () => ({ useRouter: () => ({ replace: mocked.replace }) }));
vi.mock('../stores/authentication', () => ({ default: { useContainer: () => mocked.auth } }));
vi.mock('../services/auth', () => ({ ...mocked, authErrorMessage: error => error.message }));
import AccountAuth from '../components/accountAuth';

beforeEach(() => { vi.clearAllMocks(); mocked.getUser.mockResolvedValue(null); });
afterEach(cleanup);

function fillSignup(confirm = 'example-password-123') {
  fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'wanderer' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'example-password-123' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: confirm } });
  fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form'));
}

describe('account forms', () => {
  it('creates an account and tells the user to confirm their email', async () => {
    mocked.signup.mockResolvedValue({ id: 'new-user' });
    render(<AccountAuth mode='signup' />);
    fillSignup();
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Check your email'));
    expect(mocked.signup).toHaveBeenCalledWith({ email: 'member@example.test', password: 'example-password-123', username: 'wanderer' });
  });

  it('rejects mismatched passwords before signup', async () => {
    render(<AccountAuth mode='signup' />);
    fillSignup('different-password');
    expect(screen.getByRole('alert').textContent).toContain('Passwords do not match');
    expect(mocked.signup).not.toHaveBeenCalled();
  });

  it('shows login failure and allows another attempt', async () => {
    mocked.login.mockRejectedValue(new Error('Invalid email or password.'));
    render(<AccountAuth />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'incorrect-password' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Invalid email or password'));
    expect(screen.getByRole('button', { name: 'Sign in' }).disabled).toBe(false);
  });

  it('requests recovery without disclosing whether an account exists', async () => {
    mocked.recoverPassword.mockResolvedValue(undefined);
    render(<AccountAuth mode='recovery' />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.test' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Send reset link' }).closest('form'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('If an account exists'));
  });

  it('requires an authenticated recovery session before offering a new password', () => {
    render(<AccountAuth mode='reset' />);
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(screen.getByRole('link', { name: 'request a new link' }).getAttribute('href')).toBe('/forgot-password');
  });
});
