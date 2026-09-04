/**
 * SmartConveyor - Authentication & Role-Based Access Control (MERN / MongoDB)
 * File: client/src/firebase/auth.js
 */

import { USER_ROLES } from '../../../shared/constants.js';
import { loginUserApi, getMeApi } from '../services/api.js';

// Pre-configured role profiles for NMDC Bailadila Mining operations
export const DEMO_USERS = {
  operator: {
    uid: 'usr-op-101',
    email: 'operator@nmdc.co.in',
    displayName: 'Rajesh Sharma (Shift Operator)',
    role: USER_ROLES.OPERATOR,
    facilityId: 'nmdc-kirandul-cv101',
    avatar: '👷‍♂️'
  },
  engineer: {
    uid: 'usr-eng-204',
    email: 'engineer@nmdc.co.in',
    displayName: 'Dr. Ananya Verma (Lead Maintenance Eng.)',
    role: USER_ROLES.ENGINEER,
    facilityId: 'nmdc-kirandul-cv101',
    avatar: '👩‍🔧'
  },
  admin: {
    uid: 'usr-adm-999',
    email: 'admin@nmdc.co.in',
    displayName: 'Vikramaditya Roy (Bailadila Site Admin)',
    role: USER_ROLES.ADMIN,
    facilityId: 'nmdc-kirandul-cv101',
    avatar: '🛡️'
  }
};

let currentUser = (() => {
  try {
    const saved = localStorage.getItem('smartconveyor_user');
    return saved ? JSON.parse(saved) : DEMO_USERS.operator;
  } catch {
    return DEMO_USERS.operator;
  }
})();

const authListeners = new Set();

export function getCurrentUser() {
  return currentUser;
}

export function subscribeToAuth(callback) {
  authListeners.add(callback);
  callback(currentUser);
  return () => authListeners.delete(callback);
}

export async function loginWithCredentials(email, password = 'password123', role = USER_ROLES.OPERATOR) {
  try {
    // Attempt MongoDB authentication
    const response = await loginUserApi(email, password, role);
    currentUser = response.user;
  } catch (err) {
    console.warn('[Auth Notice] Backend offline or fallback mode, logging in locally:', err.message);
    let matched = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      matched = {
        uid: `usr-${Date.now()}`,
        email,
        displayName: email.split('@')[0].toUpperCase() + ' (Staff)',
        role,
        facilityId: 'nmdc-kirandul-cv101',
        avatar: '👤'
      };
    }
    currentUser = matched;
    try {
      localStorage.setItem('smartconveyor_user', JSON.stringify(currentUser));
    } catch {}
  }

  authListeners.forEach(fn => fn(currentUser));
  return currentUser;
}

export async function loginAsRole(roleKey) {
  const profile = DEMO_USERS[roleKey] || DEMO_USERS.operator;
  return loginWithCredentials(profile.email, 'password123', profile.role);
}

export function logoutUser() {
  currentUser = null;
  try {
    localStorage.removeItem('smartconveyor_user');
    localStorage.removeItem('smartconveyor_token');
  } catch {}
  authListeners.forEach(fn => fn(currentUser));
  return Promise.resolve();
}
