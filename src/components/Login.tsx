/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ShieldAlert, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import { User } from '../types';
import { safeStorage } from '../services/storage';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

interface RegisteredUser {
  username: string;
  password?: string;
  role: 'admin';
  fullName?: string;
  designation?: string;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper to get registered users from safeStorage
  const getRegisteredUsers = (): RegisteredUser[] => {
    try {
      const usersStr = safeStorage.getItem('terralink_registered_users');
      return usersStr ? JSON.parse(usersStr) : [];
    } catch (e) {
      return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isSignUp) {
      // Sign Up Mode
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (trimmedUsername.toLowerCase() === 'admin') {
        setError('The username "admin" is reserved for system administration.');
        return;
      }

      const existingUsers = getRegisteredUsers();
      const userExists = existingUsers.some(
        (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
      );

      if (userExists) {
        setError('This username is already taken. Please choose another.');
        return;
      }

      // Add user
      const newUser: RegisteredUser = {
        username: trimmedUsername,
        password: password,
        role: 'admin',
      };

      try {
        safeStorage.setItem(
          'terralink_registered_users',
          JSON.stringify([...existingUsers, newUser])
        );
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } catch (err) {
        setError('Failed to save account details. Please try again.');
      }
    } else {
      // Sign In Mode
      if (trimmedUsername === 'admin' && password === 'admin123') {
        const registeredUsers = getRegisteredUsers();
        const adminUser = registeredUsers.find((u) => u.username.toLowerCase() === 'admin');
        onLoginSuccess({
          username: 'admin',
          role: 'admin',
          fullName: adminUser?.fullName || 'Administrator',
          designation: adminUser?.designation || 'System Admin',
        });
        return;
      }

      const registeredUsers = getRegisteredUsers();
      const matchingUser = registeredUsers.find(
        (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.password === password
      );

      if (matchingUser) {
        onLoginSuccess({
          username: matchingUser.username,
          role: 'admin',
          fullName: matchingUser.fullName || matchingUser.username,
          designation: matchingUser.designation || 'Real Estate Consultant',
        });
      } else {
        setError('Invalid username or password. Check your credentials or create a new account.');
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-natural-bg p-4 text-natural-text">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-natural-border overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-natural-sage rounded-xl flex items-center justify-center mb-4 text-white shadow-sm">
              <Building2 className="w-7 h-7" id="login-building-icon" />
            </div>
            <h1 className="text-2xl font-serif font-semibold text-natural-title tracking-tight text-center" id="login-title">
              {isSignUp ? 'Create an Account' : 'AcreBook Property Inventory'}
            </h1>
            <p className="text-sm text-natural-muted mt-1.5 text-center">
              {isSignUp
                ? 'Sign up to build your custom property inventory'
                : 'Sign in to manage your properties'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error-alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-red-600 text-xs"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  key="success-alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2.5 text-emerald-700 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-natural-muted mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                id="login-username-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
                className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                id="login-password-input"
              />
            </div>

            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-xs font-bold text-natural-muted mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-lg text-sm text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                  id="login-confirm-password-input"
                />
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-natural-sage hover:bg-natural-sage-dark text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer mt-2 flex items-center justify-center gap-2"
              id="login-submit-button"
            >
              {isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs text-natural-muted hover:text-natural-sage font-medium transition cursor-pointer hover:underline"
            >
              {isSignUp ? (
                <>
                  Already have an account? <span className="font-semibold text-natural-title">Sign In</span>
                </>
              ) : (
                <>
                  Don't have an account? <span className="font-semibold text-natural-title">Sign Up</span>
                </>
              )}
            </button>
          </div>

          {/* Demo Credentials Box
          {!isSignUp && (
            <div className="mt-6 p-4 bg-natural-panel rounded-xl border border-natural-border">
              <p className="text-xs font-bold text-natural-muted tracking-wide uppercase mb-1.5">
                Demo Credentials:
              </p>
              <div className="space-y-0.5 text-xs text-natural-muted font-mono">
                <p>Username: <span className="font-semibold text-natural-title">admin</span></p>
                <p>Password: <span className="font-semibold text-natural-title">admin123</span></p>
              </div>
            </div>
          )} */}
        </div>
      </motion.div>
    </div>
  );
}
