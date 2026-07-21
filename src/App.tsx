/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { safeStorage } from './services/storage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = safeStorage.getItem('real_estate_active_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        safeStorage.removeItem('real_estate_active_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    safeStorage.setItem('real_estate_active_user', JSON.stringify(loggedInUser));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    safeStorage.setItem('real_estate_active_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    safeStorage.removeItem('real_estate_active_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-neutral-900 rounded-lg mb-4" />
          <div className="h-4 bg-gray-200 w-24 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-neutral-900">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

