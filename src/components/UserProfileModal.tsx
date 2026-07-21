/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, Award, ShieldAlert, CheckCircle2, Trash2 } from 'lucide-react';
import { User as UserType } from '../types';
import { safeStorage } from '../services/storage';
import { propertyDb } from '../services/db';

interface UserProfileModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserType) => void;
}

interface RegisteredUser {
  username: string;
  password?: string;
  role: 'admin';
  fullName?: string;
  designation?: string;
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onUpdateUser,
}: UserProfileModalProps) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [designation, setDesignation] = useState(user.designation || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Sync state with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(user.fullName || '');
      setDesignation(user.designation || '');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(null);
      setConfirmClear(false);
    }
  }, [isOpen, user]);

  const handleClearAllData = async () => {
    setError(null);
    setSuccess(null);
    try {
      // 1. Clear properties database
      await propertyDb.clearAllData();

      // 2. Clear notes
      safeStorage.removeItem(`terralink_notes_${user.username.toLowerCase()}`);

      setSuccess('All property data & personal notes have been successfully deleted!');
      setConfirmClear(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError('An error occurred while cleaning up stored data.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = fullName.trim();
    const trimmedDesignation = designation.trim();

    if (!trimmedName) {
      setError('Profile Name cannot be empty.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError('New password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    try {
      // 1. Fetch current registered users from storage
      const usersStr = safeStorage.getItem('terralink_registered_users');
      let users: RegisteredUser[] = usersStr ? JSON.parse(usersStr) : [];

      // Check if this username is admin. Admin can also update their info, let's keep track in terralink_registered_users.
      let userIdx = users.findIndex(
        (u) => u.username.toLowerCase() === user.username.toLowerCase()
      );

      const updatedUserInfo: RegisteredUser = {
        username: user.username,
        role: user.role,
        fullName: trimmedName,
        designation: trimmedDesignation,
      };

      if (userIdx !== -1) {
        // Keep existing password if not changing
        updatedUserInfo.password = password ? password : users[userIdx].password;
        users[userIdx] = updatedUserInfo;
      } else {
        // If they logged in as super-admin but don't have an entry in registered users, create one
        updatedUserInfo.password = password ? password : 'admin123';
        users.push(updatedUserInfo);
      }

      // Save updated list
      safeStorage.setItem('terralink_registered_users', JSON.stringify(users));

      // 2. Call parent callback to update current session state
      onUpdateUser({
        ...user,
        fullName: trimmedName,
        designation: trimmedDesignation,
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to update profile details. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl border border-natural-border shadow-2xl w-full max-w-md relative z-10 overflow-hidden text-natural-text"
          >
            {/* Header */}
            <div className="p-6 bg-[#F2EDE7] border-b border-natural-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-natural-sage text-white rounded-lg flex items-center justify-center shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-semibold text-natural-title">My Profile</h3>
                  <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider">
                    Edit Account &amp; Credentials
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white hover:bg-natural-bg text-natural-muted hover:text-natural-title border border-natural-border flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-[#E6EDD8] border border-[#D0DCAE] text-natural-sage-dark rounded-xl text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-natural-sage" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Username (Read Only) */}
                <div>
                  <label className="block text-[11px] font-bold text-natural-muted uppercase tracking-wider mb-1">
                    Username (System ID)
                  </label>
                  <input
                    type="text"
                    value={user.username}
                    disabled
                    className="w-full p-2.5 bg-natural-bg border border-natural-border rounded-xl text-xs text-natural-muted font-mono cursor-not-allowed"
                  />
                </div>

                {/* Profile Name (Editable) */}
                <div>
                  <label className="block text-[11px] font-bold text-natural-muted uppercase tracking-wider mb-1">
                    Profile / Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-natural-subtle" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-natural-border rounded-xl text-xs text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                      required
                    />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-[11px] font-bold text-natural-muted uppercase tracking-wider mb-1">
                    Designation / Title
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-3 w-4 h-4 text-natural-subtle" />
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Real Estate Partner, Agent"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-natural-border rounded-xl text-xs text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                    />
                  </div>
                </div>

                <div className="border-t border-natural-border pt-3 mt-1">
                  <h4 className="text-[11px] font-bold text-natural-muted uppercase tracking-wider mb-2">
                    Security Credentials
                  </h4>

                  {/* Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-natural-muted font-medium mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-3 w-3.5 h-3.5 text-natural-subtle" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••"
                          className="w-full pl-8 pr-2 py-2.5 bg-white border border-natural-border rounded-xl text-xs text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-natural-muted font-medium mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-3 w-3.5 h-3.5 text-natural-subtle" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••"
                          className="w-full pl-8 pr-2 py-2.5 bg-white border border-natural-border rounded-xl text-xs text-natural-title placeholder-natural-subtle focus:outline-none focus:ring-2 focus:ring-natural-sage/35 focus:border-natural-sage transition"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-natural-subtle mt-1.5 italic">
                    * Leave passwords blank if you do not want to change your login password.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-natural-border">
                {confirmClear ? (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-2 rounded-xl">
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                      Are you sure? This deletes ALL properties & notes.
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllData}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-natural-border text-natural-text rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-semibold text-natural-muted transition cursor-pointer"
                    title="Permanently erase all property records and notes from your browser's local databases"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>Purge Stored Data</span>
                  </button>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white hover:bg-natural-bg border border-natural-border rounded-xl text-xs font-semibold text-natural-text transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-natural-sage hover:bg-natural-sage-dark text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
