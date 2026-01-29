/**
 * Password protection modal
 * Simple client-side password check for basic access control
 */

import { useState } from 'react';
import { Lock } from 'lucide-react';

interface PasswordModalProps {
  onCorrectPassword: () => void;
}

// Simple password - for better security, consider Cloudflare Access
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'crxreview2024';

export function PasswordModal({ onCorrectPassword }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate slight delay to prevent brute force
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        onCorrectPassword();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
          Protected Area
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          Please enter the password to access CRX Review
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Enter password"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
          This is a password-protected application for authorized users only.
        </p>
      </div>
    </div>
  );
}
