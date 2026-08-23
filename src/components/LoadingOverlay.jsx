import React from 'react'

export default function LoadingOverlay({ visible }) {
  if (!visible) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '24px',
      }}
    >
      {/* Rotating mandala ring */}
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg viewBox="0 0 96 96" width="96" height="96"
          style={{ animation: 'spin 1.6s linear infinite', position: 'absolute', top: 0, left: 0 }}>
          <circle cx="48" cy="48" r="42"
            fill="none" stroke="#f59e0b" strokeWidth="5"
            strokeDasharray="66 200" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 96 96" width="96" height="96"
          style={{ animation: 'spinR 2.4s linear infinite', position: 'absolute', top: 0, left: 0 }}>
          <circle cx="48" cy="48" r="30"
            fill="none" stroke="#fb923c" strokeWidth="3"
            strokeDasharray="40 150" strokeLinecap="round" />
        </svg>
        {/* OM symbol */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 30, color: '#fde68a', lineHeight: 1,
        }}>ॐ</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#fde68a', fontSize: 20, fontWeight: 700, margin: 0 }}>
          ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗುತ್ತಿದೆ…
        </p>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
          Computing your chart…
        </p>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes spinR { to { transform: rotate(-360deg); } }
      `}</style>
    </div>
  )
}
