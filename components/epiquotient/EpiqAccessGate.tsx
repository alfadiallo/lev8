'use client';

import { useState, useEffect, useCallback } from 'react';

const THEME = {
  bg: '#0a1620',
  card: '#162737',
  deep: '#07121d',
  border: 'rgba(47,230,222,0.12)',
  borderAccent: 'rgba(47,230,222,0.25)',
  text: '#c8e0ee',
  textSecondary: '#7ab5cc',
  textMuted: '#4a7090',
  accent: '#2fe6de',
  accentGreen: '#18f2b2',
  font: "'Sora', system-ui, sans-serif",
  mono: "'Space Mono', monospace",
};

const LOCAL_STORAGE_KEY = 'epiq-gate-passed';

interface EpiqAccessGateProps {
  onGranted: () => void;
}

export default function EpiqAccessGate({ onGranted }: EpiqAccessGateProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const dismiss = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => onGranted(), 400);
  }, [onGranted]);

  useEffect(() => {
    if (localStorage.getItem(LOCAL_STORAGE_KEY)) {
      dismiss();
      return;
    }

    async function checkIp() {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipRes.json();

        const gateRes = await fetch(`/api/epiquotient/gate?ip=${encodeURIComponent(ip)}`);
        const data = await gateRes.json();

        if (data.gated) {
          localStorage.setItem(LOCAL_STORAGE_KEY, '1');
          dismiss();
          return;
        }
      } catch (err) {
        console.error('[EpiqAccessGate] IP check failed:', err);
      }
      setChecking(false);
    }

    checkIp();
  }, [dismiss]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setError('Please enter both your name and email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/epiquotient/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, '1');
      dismiss();
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: THEME.deep,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 24, height: 24,
          border: `2px solid ${THEME.textMuted}`,
          borderTopColor: THEME.accent,
          borderRadius: '50%',
          animation: 'epiq-spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes epiq-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: THEME.deep,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: THEME.font,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.4s ease',
    }}>
      {/* Subtle animated background particles */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 2, height: 2, borderRadius: '50%',
            background: THEME.accent,
            opacity: 0.15 + (i * 0.04),
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `epiq-float-${i} ${3 + i * 0.7}s ease-in-out infinite alternate`,
          }} />
        ))}
        <style>{`
          ${[...Array(6)].map((_, i) => `
            @keyframes epiq-float-${i} {
              from { transform: translateY(0) translateX(0); }
              to { transform: translateY(${-20 + i * 6}px) translateX(${10 - i * 4}px); }
            }
          `).join('')}
        `}</style>
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 420,
        margin: '0 20px',
        animation: 'epiq-gate-in 0.5s ease-out',
      }}>
        <style>{`
          @keyframes epiq-gate-in {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .epiq-gate-input:focus {
            outline: none;
            border-color: ${THEME.accent} !important;
            box-shadow: 0 0 0 2px rgba(47,230,222,0.15);
          }
          .epiq-gate-input::placeholder {
            color: ${THEME.textMuted};
          }
        `}</style>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: THEME.mono,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: THEME.accent,
            marginBottom: 6,
          }}>
            EPI<span style={{ color: THEME.accentGreen }}>·</span>Q
          </div>
          <div style={{
            fontSize: 13,
            color: THEME.textMuted,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}>
            Performance Fingerprint
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 16,
          padding: '36px 32px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <h2 style={{
            margin: '0 0 8px',
            fontSize: 20,
            fontWeight: 500,
            color: THEME.text,
            textAlign: 'center',
          }}>
            Welcome
          </h2>
          <p style={{
            margin: '0 0 28px',
            fontSize: 14,
            color: THEME.textSecondary,
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            Enter your name and email to explore the EPI Quotient visualization.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                color: THEME.textMuted,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}>
                Name
              </label>
              <input
                className="epiq-gate-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 15,
                  fontFamily: THEME.font,
                  color: THEME.text,
                  background: THEME.bg,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 10,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                color: THEME.textMuted,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}>
                Email
              </label>
              <input
                className="epiq-gate-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 15,
                  fontFamily: THEME.font,
                  color: THEME.text,
                  background: THEME.bg,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 10,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: 16,
                padding: '10px 14px',
                fontSize: 13,
                color: '#f06060',
                background: 'rgba(240,96,96,0.08)',
                border: '1px solid rgba(240,96,96,0.15)',
                borderRadius: 8,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '13px 0',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: THEME.font,
                color: THEME.deep,
                background: submitting
                  ? THEME.textMuted
                  : `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentGreen})`,
                border: 'none',
                borderRadius: 10,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                opacity: submitting ? 0.7 : 1,
                letterSpacing: '0.02em',
              }}
            >
              {submitting ? 'Submitting...' : 'Continue'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: 12,
          color: THEME.textMuted,
          lineHeight: 1.5,
        }}>
          Your information is only used to track access to this demo.
        </p>
      </div>
    </div>
  );
}
