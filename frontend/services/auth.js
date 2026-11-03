import request from "../lib/request"
import { getFullUrl } from "../lib/request";

import { login as identityLogin, logout as identityLogout, signup as identitySignup,
  getUser, handleAuthCallback, requestPasswordRecovery, updateUser } from '@netlify/identity';

export const login = ({ email, username, password }) => identityLogin((email || username || '').trim(), password);
export const logout = () => identityLogout();
export const signup = ({ email, password, username }) => identitySignup(email.trim(), password, { full_name: username.trim() });
export const recoverPassword = (email) => requestPasswordRecovery(email.trim());
export const resetPassword = (password) => updateUser({ password });
export { getUser };

// React Strict Mode can mount effects twice; confirmation tokens are single-use.
let callbackPromise;
export const processAuthCallback = () => {
  if (!callbackPromise) callbackPromise = handleAuthCallback();
  return callbackPromise;
};

export const authErrorMessage = (error) => {
  if (error?.name === 'MissingIdentityError') return 'Account services are temporarily unavailable. Please try again later.';
  if (error?.status === 401) return 'Unable to sign in. Check your email and password, and confirm your email first.';
  return error?.message || 'Something went wrong. Please try again.';
};

export const changePassword = ({ existingPassword, newPassword }) => {
  return request('POST', getFullUrl('auth', `/v2/user/passwords/change`), {
    currentPassword: existingPassword,
    newPassword,
  });
}

export const validateUsername = ({ username, context }) => {
  return request('GET', getFullUrl('auth', `/v1/usernames/validate?username=${encodeURIComponent(username)}&context=${encodeURIComponent(context)}`)).then(d => d.data)
}

export const changeUsername = ({ username, password }) => {
  return request('POST', getFullUrl('auth', `/v1/username`), {
    username,
    password,
  })
}

export const logoutFromAllOtherSessions = () => {
  return request('POST', getFullUrl('auth', '/v2/logoutfromallsessionsandreauthenticate'))
}