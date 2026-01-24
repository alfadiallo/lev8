'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // For testing purposes, create a mock user if auth is disabled
  const mockUser = {
    id: 'test-user-id',
    full_name: 'Test User',
    email: 'test@example.com',
    phone: '555-1234',
    role: 'resident'
  };

  const displayUser = (user as Record<string, unknown>) || mockUser;

  useEffect(() => {
    if (displayUser) {
      setFormData({
        full_name: displayUser.full_name || '',
        email: displayUser.email || '',
        phone: displayUser.phone || '',
      });
    }
  }, [displayUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      console.error('Password change error:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to change password' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl ${
            message.type === 'success'
              ? 'bg-[#D4F1F4]/80 text-neutral-800 border border-[#7EC8E3]/30'
              : 'bg-[#F4A5A5]/80 text-neutral-800 border border-[#F4A5A5]/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">Profile Information</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Update your personal information and email address
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-[#7EC8E3] hover:text-[#5BA8C4] transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] text-white rounded-2xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    full_name: displayUser.full_name || '',
                    email: displayUser.email || '',
                    phone: displayUser.phone || '',
                  });
                }}
                className="px-6 py-2 border border-white/40 text-neutral-700 rounded-2xl hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 bg-white/30 rounded-2xl p-6 border border-white/20">
            <div>
              <div className="text-sm font-medium text-neutral-600">Full Name</div>
              <div className="mt-1 text-neutral-800">{formData.full_name || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-600">Email Address</div>
              <div className="mt-1 text-neutral-800">{formData.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-600">Phone Number</div>
              <div className="mt-1 text-neutral-800">{formData.phone || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-600">Role</div>
              <div className="mt-1 text-neutral-800 capitalize">{displayUser.role || 'Not set'}</div>
            </div>
          </div>
        )}
      </section>

      {/* Password Change */}
      <section className="pt-8 border-t border-white/30">
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Change Password</h2>
        <p className="text-sm text-neutral-600 mb-6">
          Update your password to keep your account secure
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={8}
            />
            <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

            <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] text-white rounded-2xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isSaving ? 'Changing Password...' : 'Change Password'}
              </button>
        </form>
      </section>

      {/* 2FA Section (Placeholder) */}
      <section className="pt-8 border-t border-white/30">
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Two-Factor Authentication</h2>
        <p className="text-sm text-neutral-600 mb-6">
          Add an extra layer of security to your account
        </p>
        
        <div className="bg-[#FFD89B]/60 border border-[#FFD89B]/30 rounded-2xl p-4">
          <div className="flex items-center space-x-2">
            <span className="text-neutral-700">⚠️</span>
            <span className="text-sm text-neutral-700">
              2FA is currently disabled for testing. Will be enabled in a future update.
            </span>
          </div>
        </div>
      </section>

      {/* Session Information */}
      <section className="pt-8 border-t border-white/30">
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Current Session</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Information about your current login session
        </p>
        
        <div className="bg-white/30 rounded-2xl p-4 space-y-2 text-sm border border-white/20">
          <div className="flex justify-between">
            <span className="text-neutral-600">User ID:</span>
            <span className="text-neutral-800 font-mono text-xs">{displayUser.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Last Login:</span>
            <span className="text-neutral-800">Today</span>
          </div>
        </div>
      </section>
    </div>
  );
}

