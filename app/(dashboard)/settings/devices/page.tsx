'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface TrustedDevice {
  id: string;
  device_fingerprint: string;
  ip_address: string;
  user_agent: string;
  trust_expires_at: string;
  created_at: string;
}

export default function DevicesSettingsPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTrustedDevices();
  }, []);

  const fetchTrustedDevices = async () => {
    try {
      const response = await fetch('/api/devices/trusted');
      if (!response.ok) {
        throw new Error('Failed to fetch trusted devices');
      }
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to revoke trust for this device? You will need to verify 2FA on your next login from this device.')) {
      return;
    }

    try {
      const response = await fetch(`/api/devices/trusted/${deviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke device');
      }

      setMessage({ type: 'success', text: 'Device trust revoked successfully' });
      setDevices(devices.filter(d => d.id !== deviceId));
    } catch (err: any) {
      console.error('Error revoking device:', err);
      setMessage({ type: 'error', text: err.message });
    }
  };

  const revokeAllDevices = async () => {
    if (!confirm('Are you sure you want to revoke trust for ALL devices? You will need to verify 2FA on your next login from any device.')) {
      return;
    }

    try {
      const response = await fetch('/api/devices/trusted', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke all devices');
      }

      setMessage({ type: 'success', text: 'All device trusts revoked successfully' });
      setDevices([]);
    } catch (err: any) {
      console.error('Error revoking all devices:', err);
      setMessage({ type: 'error', text: err.message });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const parseUserAgent = (ua: string) => {
    // Simple user agent parsing
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Header */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Trusted Devices</h2>
        <p className="text-sm text-slate-600 mb-6">
          Manage devices that are trusted for 30 days without requiring 2FA verification
        </p>

        {/* 2FA Status Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-sm text-yellow-800">
              2FA is currently disabled for testing. Device trust management will be fully functional when 2FA is enabled.
            </span>
          </div>
        </div>
      </section>

      {/* Trusted Devices List */}
      <section>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading trusted devices...</p>
          </div>
        ) : error ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 mb-2">{error}</p>
            <p className="text-sm text-yellow-700">
              The device trust API endpoint will be created in task 1.9.5.
            </p>
          </div>
        ) : devices.length === 0 ? (
          <div className="bg-slate-50 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Trusted Devices</h3>
            <p className="text-slate-600">
              When you enable &quot;Trust this device&quot; during 2FA verification, 
              your device will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`bg-white border rounded-lg p-6 ${
                    isExpired(device.trust_expires_at)
                      ? 'border-slate-200 opacity-60'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">💻</span>
                        <div>
                          <div className="font-medium text-slate-900">
                            {parseUserAgent(device.user_agent)}
                          </div>
                          <div className="text-sm text-slate-500">
                            IP: {device.ip_address}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-600 space-y-1 mt-4">
                        <div>
                          <span className="font-medium">Added:</span>{' '}
                          {formatDate(device.created_at)}
                        </div>
                        <div>
                          <span className="font-medium">Expires:</span>{' '}
                          {formatDate(device.trust_expires_at)}
                          {isExpired(device.trust_expires_at) && (
                            <span className="ml-2 text-red-600">(Expired)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => revokeDevice(device.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Revoke All Button */}
            {devices.length > 1 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={revokeAllDevices}
                  className="px-6 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Revoke All Devices
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  This will require 2FA verification on all devices on next login
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Security Best Practices */}
      <section className="pt-8 border-t border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Security Tips</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 mt-0.5">✓</span>
            <p className="text-sm text-blue-900">
              Only trust devices that you personally own and control
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 mt-0.5">✓</span>
            <p className="text-sm text-blue-900">
              Revoke trust for devices you no longer use or have access to
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 mt-0.5">✓</span>
            <p className="text-sm text-blue-900">
              Never trust shared or public computers
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 mt-0.5">✓</span>
            <p className="text-sm text-blue-900">
              Device trust expires after 30 days for your security
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

