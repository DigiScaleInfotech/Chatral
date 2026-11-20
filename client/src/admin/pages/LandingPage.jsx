import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Button, Card, Col, Collapse, Divider, Drawer, Flex, Grid, Row, Segmented, Tag, Typography,
} from 'antd';
import {
  ArrowRightOutlined, CheckCircleFilled, MessageOutlined,
  SendOutlined, RocketOutlined, PlayCircleOutlined, PauseCircleOutlined, RedoOutlined,
  ShopOutlined, TeamOutlined, LockOutlined, ThunderboltOutlined,
  GlobalOutlined, RiseOutlined, SafetyCertificateOutlined,
  CopyOutlined, StarFilled, UserOutlined, SearchOutlined,
  BarChartOutlined, BellOutlined, CheckOutlined,
} from '@ant-design/icons';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';
import { api } from '../api.js';
import { usePlanPricing } from '../constants/plans.js';
import { trackEvent } from '../constants/analytics.js';

const { useBreakpoint } = Grid;

// Elegant custom dropdown select for form (no native OS gray menu)
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          borderRadius: 10,
          border: open ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
          background: open ? '#ffffff' : '#f8fafc',
          boxShadow: open ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
          fontSize: 14,
          fontFamily: 'inherit',
          color: '#0f172a',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.18s ease',
        }}
      >
        <span style={{ fontWeight: 500 }}>{value}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 60,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            boxShadow: '0 14px 34px -4px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(0, 0, 0, 0.04)',
            padding: 6,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? '#2563eb' : '#1e293b',
                  background: isSelected ? '#eff6ff' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease, color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#1e293b';
                  }
                }}
              >
                <span>{opt}</span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Slick kinetic character rolling text for navbar menu links & buttons (staggered roll-up, no box)
function RollText({ text, secondaryColor }) {
  const chars = Array.from(text || '');
  return (
    <span className="roll-text" aria-label={text}>
      <span className="roll-stack roll-stack-primary" aria-hidden="true">
        {chars.map((char, i) => (
          <span
            key={i}
            className="roll-char"
            style={{ transitionDelay: `${i * 18}ms` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
      <span
        className="roll-stack roll-stack-secondary"
        aria-hidden="true"
        style={secondaryColor ? { color: secondaryColor } : undefined}
      >
        {chars.map((char, i) => (
          <span
            key={i}
            className="roll-char"
            style={{ transitionDelay: `${i * 18}ms` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
      <span className="roll-ghost">{text}</span>
    </span>
  );
}

// Automated Single-Box Video Simulation Showcase (Exact Storefront -> Live Chat -> Operator Inbox -> Triggers & Multi-Store Flow)
function HeroVideoShowcase({ isMobile }) {
  const TOTAL_CYCLE = 24000; // 24 seconds continuous video cycle
  const [timeMs, setTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Playback timer (60ms ticks for smooth 60fps cursor & progress bar)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = 60;
    const timer = setInterval(() => {
      setTimeMs((prev) => (prev + interval) % TOTAL_CYCLE);
    }, interval);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Jump to specific chapter / timeline point
  const handleSeek = (targetMs) => {
    setTimeMs(targetMs % TOTAL_CYCLE);
    setIsPlaying(true);
  };

  // Determine current active scene
  // Scene 1: Storefront (0 - 8000ms)
  // Scene 2: Live Operator Inbox (8000 - 16000ms)
  // Scene 3: Admin Triggers & Multi-Store (16000 - 24000ms)
  const isScene1 = timeMs < 8000;
  const isScene2 = timeMs >= 8000 && timeMs < 16000;
  const isScene3 = timeMs >= 16000;

  // Scene 1 States
  const widgetOpen = timeMs >= 3000;
  const visitorTypedTarget = 'Is Size 9 in stock for express delivery?';
  let visitorTypedText = '';
  if (timeMs >= 4600 && timeMs < 6600) {
    const charsCount = Math.min(visitorTypedTarget.length, Math.floor(((timeMs - 4600) / 1900) * visitorTypedTarget.length));
    visitorTypedText = visitorTypedTarget.slice(0, charsCount);
  } else if (timeMs >= 6600) {
    visitorTypedText = visitorTypedTarget;
  }
  const visitorMsgSent = timeMs >= 7000;
  const visitorAgentTyping = timeMs >= 7400;

  // Scene 2 States (Inbox)
  const inboxChatActive = timeMs >= 9200;
  const agentCannedClicked = timeMs >= 11800;
  const agentReplySent = timeMs >= 13400;

  // Scene 3 States (Admin Triggers & Store Switcher)
  const storeDropdownOpen = timeMs >= 20200 && timeMs < 21800;
  const storeSwitched = timeMs >= 21800;

  // Virtual Cursor interpolation across the 3 scenes
  const getCursor = () => {
    // SCENE 1: Storefront (0 - 8000ms)
    if (timeMs < 1500) {
      return { x: 38, y: 46, clicking: false };
    }
    if (timeMs < 2900) {
      // Moves towards bottom right launcher
      const p = (timeMs - 1500) / 1400;
      return { x: 38 + p * 50, y: 46 + p * 38, clicking: false }; // arrives at (88, 84)
    }
    if (timeMs < 3400) {
      // Clicks launcher
      return { x: 88, y: 84, clicking: true };
    }
    if (timeMs < 4500) {
      // Moves into widget input field
      const p = (timeMs - 3400) / 1100;
      return { x: 88 - p * 13, y: 84, clicking: false }; // (75, 84)
    }
    if (timeMs < 4900) {
      // Clicks input field
      return { x: 75, y: 84, clicking: true };
    }
    if (timeMs < 6600) {
      // Typing in input field
      return { x: 75, y: 84, clicking: false };
    }
    if (timeMs < 7100) {
      // Moves to send button
      const p = (timeMs - 6600) / 500;
      return { x: 75 + p * 14, y: 84, clicking: false }; // (89, 84)
    }
    if (timeMs < 7700) {
      // Clicks send button
      return { x: 89, y: 84, clicking: true };
    }
    if (timeMs < 8000) {
      return { x: 89, y: 84, clicking: false };
    }

    // SCENE 2: Live Inbox (8000 - 16000ms)
    if (timeMs < 9200) {
      // Glides to Sarah's conversation in conversation list
      const p = (timeMs - 8000) / 1200;
      return { x: 60 - p * 37, y: 60 - p * 34, clicking: false }; // arrives at (23, 26)
    }
    if (timeMs < 9700) {
      // Clicks Sarah's chat
      return { x: 23, y: 26, clicking: true };
    }
    if (timeMs < 11800) {
      // Moves to Quick Reply pill "/express-shipping"
      const p = (timeMs - 9700) / 2100;
      return { x: 23 + p * 21, y: 26 + p * 59, clicking: false }; // arrives at (44, 85)
    }
    if (timeMs < 12300) {
      // Clicks saved reply
      return { x: 44, y: 85, clicking: true };
    }
    if (timeMs < 13300) {
      // Moves to Send Reply button
      const p = (timeMs - 12300) / 1000;
      return { x: 44 + p * 20, y: 85, clicking: false }; // arrives at (64, 85)
    }
    if (timeMs < 13900) {
      // Clicks Send button
      return { x: 64, y: 85, clicking: true };
    }
    if (timeMs < 16000) {
      // Glides towards left sidebar
      const p = (timeMs - 13900) / 2100;
      return { x: 64 - p * 57.5, y: 85 - p * 61, clicking: false }; // arrives at (6.5, 24)
    }

    // SCENE 3: Admin Triggers & Multi-Store (16000 - 24000ms)
    if (timeMs < 17200) {
      return { x: 6.5, y: 24, clicking: false };
    }
    if (timeMs < 17700) {
      // Clicks "Triggers" in sidebar
      return { x: 6.5, y: 24, clicking: true };
    }
    if (timeMs < 19200) {
      // Hovers on Cart Abandonment Trigger
      return { x: 42, y: 36, clicking: false };
    }
    if (timeMs < 20200) {
      // Moves to top store switcher "Aura Threads ▾"
      const p = (timeMs - 19200) / 1000;
      return { x: 42 - p * 7, y: 36 - p * 31.5, clicking: false }; // arrives at (35, 4.5)
    }
    if (timeMs < 20700) {
      // Clicks store dropdown
      return { x: 35, y: 4.5, clicking: true };
    }
    if (timeMs < 21600) {
      // Moves down to "2. Peak Audio Hub"
      const p = (timeMs - 20700) / 900;
      return { x: 35, y: 4.5 + p * 9, clicking: false }; // arrives at (35, 13.5)
    }
    if (timeMs < 22100) {
      // Clicks "Peak Audio Hub"
      return { x: 35, y: 13.5, clicking: true };
    }
    return { x: 50, y: 50, clicking: false };
  };

  const cursor = getCursor();
  const currentSec = Math.floor(timeMs / 1000);
  const formattedSec = currentSec < 10 ? `0:0${currentSec}` : `0:${currentSec}`;
  const progressPercent = ((timeMs / TOTAL_CYCLE) * 100).toFixed(1);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e6e7eb',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 24px 60px -12px rgba(12, 13, 16, 0.1), 0 2px 6px rgba(12, 13, 16, 0.04)',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        minHeight: isMobile ? 520 : 660,
        height: isMobile ? 'auto' : 660,
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes cursorClickPulse {
          0% { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Animated Mouse Cursor (Simulating live user & operator interactions) */}
      {!isMobile && (
        <div
          style={{
            position: 'absolute',
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: 'translate(-2px, -2px)',
            transition: 'left 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), top 0.4s cubic-bezier(0.2, 0.9, 0.3, 1)',
            zIndex: 90,
            pointerEvents: 'none',
          }}
        >
          {cursor.clicking && (
            <span
              style={{
                position: 'absolute',
                left: 2,
                top: 2,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2.5px solid #2563eb',
                background: 'rgba(37, 99, 235, 0.22)',
                transform: 'translate(-50%, -50%)',
                animation: 'cursorClickPulse 0.4s ease-out forwards',
              }}
            />
          )}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))' }}>
            <path
              d="M5.5 3.2L18.8 12.8L12.5 13.9L16 20.8L13.2 22.2L9.7 15.3L5.5 19.5V3.2Z"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Top Browser Bar */}
      <div
        style={{
          height: 44,
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        </div>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: '3px 14px',
            fontSize: 12,
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            maxWidth: 420,
            width: '100%',
            justifyContent: 'center',
            fontWeight: 500,
          }}
        >
          <span style={{ color: '#16a34a' }}>🔒</span>
          <span>
            {isScene1
              ? 'aurathreads.com/products/all-weather-jacket'
              : isScene2
              ? 'app.chatral.com/inbox'
              : 'app.chatral.com/triggers'}
          </span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: 4 }}>
          {isScene1 ? 'Cart (1) • ₹2,499' : isScene2 ? 'Live Operator: Online 🟢' : '3 / 3 Stores Synced'}
        </div>
      </div>

      {/* Main Video Body (Switches seamlessly between 3 scenes) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {/* SCENE 1: Website Storefront Widget (Customer Perspective) */}
        {isScene1 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              padding: isMobile ? 14 : 20,
              gap: 20,
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* Product Card on Left */}
            <div
              style={{
                flex: isMobile ? 'none' : '1.1',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: isMobile ? 14 : 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ background: '#fef3c7', color: '#b45309', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                    🔥 Bestseller
                  </span>
                  <span style={{ color: '#16a34a', fontSize: 11.5, fontWeight: 600 }}>
                    ✓ In Stock (Ships in 24h)
                  </span>
                </div>
                <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                  All-Weather Performance Runner
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <div style={{ color: '#f59e0b', fontSize: 12 }}>⭐⭐⭐⭐⭐</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>4.9</span>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>(182 customer reviews)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>₹2,499</span>
                  <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>₹3,499</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#16a34a' }}>Save 28%</span>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Select Size:</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['UK 7', 'UK 8', 'UK 9 (Selected)', 'UK 10'].map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          border: idx === 2 ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: idx === 2 ? '#eff6ff' : '#ffffff',
                          color: idx === 2 ? '#2563eb' : '#475569',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '11px 0',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginBottom: 8,
                  }}
                >
                  Add to Bag • ₹2,499
                </button>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b' }}>
                  ⚡ 67KB Chatral widget loaded • Page loads in 0.4s
                </div>
              </div>
            </div>

            {/* Right: Floating Chat Widget or Launcher */}
            <div style={{ flex: isMobile ? 'none' : '0.9', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 380 }}>
              {!widgetOpen ? (
                /* Closed Floating Launcher Button in Bottom Right */
                <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, padding: '7px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)', whiteSpace: 'nowrap' }}>
                    👋 Need size advice? We're online!
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px -3px rgba(37,99,235,0.4)',
                      cursor: 'pointer',
                    }}
                  >
                    <MessageOutlined style={{ fontSize: 24 }} />
                    <span style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid #ffffff' }} />
                  </div>
                </div>
              ) : (
                /* Expanded Live Chat Window */
                <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderRadius: 16, boxShadow: '0 12px 30px -6px rgba(37, 99, 235, 0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 420 }}>
                  {/* Widget Header */}
                  <div style={{ background: '#2563eb', padding: '12px 16px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ffffff', color: '#2563eb', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          A
                        </div>
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '1.5px solid #ffffff' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Aura Support</div>
                        <div style={{ fontSize: 10.5, opacity: 0.9 }}>Typically replies in under 1 min</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 999 }}>
                      Live Widget
                    </span>
                  </div>

                  {/* Widget Messages Area */}
                  <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', fontSize: 12, overflowY: 'auto' }}>
                    {/* Proactive Automated Greeting */}
                    <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#ffffff', padding: '9px 12px', borderRadius: '12px 12px 12px 2px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: 1.5 }}>
                      👋 Welcome to Aura Threads! Looking for size advice or delivery times?
                    </div>

                    {/* Visitor Sent Message */}
                    {visitorMsgSent && (
                      <div style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#2563eb', color: '#ffffff', padding: '9px 12px', borderRadius: '12px 12px 2px 12px', lineHeight: 1.5, animation: 'fadeScaleIn 0.25s ease' }}>
                        <div>Is Size 9 in stock for express delivery?</div>
                        <div style={{ fontSize: 9.5, opacity: 0.8, textAlign: 'right', marginTop: 2 }}>Just now ✓</div>
                      </div>
                    )}

                    {/* Typing Indicator */}
                    {visitorAgentTyping && (
                      <div style={{ alignSelf: 'flex-start', background: '#e0e7ff', padding: '6px 10px', borderRadius: 999, fontSize: 10.5, color: '#3730a3', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>Rahul is typing</span>
                        <span>...</span>
                      </div>
                    )}
                  </div>

                  {/* Widget Input Bar */}
                  <div style={{ padding: '8px 12px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      readOnly
                      value={visitorMsgSent ? '' : visitorTypedText}
                      placeholder={visitorMsgSent ? 'Type a reply...' : 'Ask a question...'}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: '#0f172a', background: 'transparent' }}
                    />
                    <button
                      type="button"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: visitorTypedText ? '#2563eb' : '#94a3b8',
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <SendOutlined style={{ fontSize: 11 }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCENE 2: Live Operator Inbox (Agent Perspective) */}
        {isScene2 && (
          <div style={{ flex: 1, display: 'flex', height: '100%', minHeight: 0, position: 'relative' }}>
            {/* Alert Notification Toast */}
            {timeMs < 10500 && (
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: '#1e293b', color: '#ffffff', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.25)', animation: 'fadeScaleIn 0.3s ease' }}>
                <span>🔔</span>
                <span>New Message: Sarah Jenkins • Cart: ₹2,499</span>
              </div>
            )}

            {/* 1. Left Dark Sidebar */}
            <div style={{ width: 170, flexShrink: 0, background: '#070b13', borderRight: '1px solid #172133', display: isMobile ? 'none' : 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px 10px' }}>
              <div>
                <div style={{ padding: '4px 8px 14px' }}>
                  <ChatralFullLogo height={20} dark={true} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#162238', color: '#ffffff', padding: '7px 10px', fontSize: 12, borderRadius: 6, fontWeight: 600 }}>
                    <MessageOutlined style={{ color: '#38bdf8' }} /> <span>Inbox</span>
                    <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#ffffff', fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>1</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', padding: '7px 10px', fontSize: 12, borderRadius: 6 }}>
                    <ThunderboltOutlined /> <span>Triggers</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', padding: '7px 10px', fontSize: 12, borderRadius: 6 }}>
                    <ShopOutlined /> <span>Multi-Store</span>
                  </div>
                </div>
              </div>
              <div style={{ background: '#0d1524', border: '1px solid #1b283d', borderRadius: 6, padding: '6px 8px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>STORE</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>Aura Threads 🟢</div>
              </div>
            </div>

            {/* 2. Middle Conversation List */}
            <div style={{ width: isMobile ? '100%' : 220, flexShrink: 0, background: '#ffffff', borderRight: '1px solid #eef2f6', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Open Chats (1)</span>
                <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>Live</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Sarah's Conversation Item */}
                <div style={{ padding: '10px 12px', background: inboxChatActive ? '#eff6ff' : '#ffffff', borderLeft: inboxChatActive ? '3px solid #2563eb' : '3px solid transparent', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Sarah Jenkins</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#64748b' }}>Just now</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    Is Size 9 in stock for express...
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9.5, background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Cart: ₹2,499</span>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#2563eb', color: '#ffffff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
                  </div>
                </div>
                {/* Chat 2 */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #f8fafc', opacity: 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Alex Cooper</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>14m</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Thanks for the quick refund!</div>
                </div>
              </div>
            </div>

            {/* 3. Center Chat Box */}
            <div style={{ flex: 1, display: isMobile ? 'none' : 'flex', flexDirection: 'column', background: '#f8fafc' }}>
              {/* Chat Header */}
              <div style={{ height: 44, padding: '0 16px', background: '#ffffff', borderBottom: '1px solid #eef2f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>Sarah Jenkins</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>• /products/all-weather-jacket</span>
                </div>
                <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Active Online</span>
              </div>

              {/* Messages Transcript */}
              <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                <div style={{ alignSelf: 'flex-start', maxWidth: '80%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px 10px 10px 2px', padding: '8px 12px', fontSize: 12, color: '#1e293b' }}>
                  <div>Is Size 9 in stock for express delivery?</div>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 2 }}>Sarah • Just now</div>
                </div>

                {agentReplySent && (
                  <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: '#2563eb', color: '#ffffff', borderRadius: '10px 10px 2px 10px', padding: '8px 12px', fontSize: 12, animation: 'fadeScaleIn 0.25s ease' }}>
                    <div>Yes! UK 9 is in stock. Ships within 2 hours with express delivery 🚀</div>
                    <div style={{ fontSize: 9.5, opacity: 0.85, textAlign: 'right', marginTop: 2 }}>Delivered & Seen ✓✓</div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Reply & Send */}
              <div style={{ padding: '8px 12px', background: '#ffffff', borderTop: '1px solid #eef2f6', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>QUICK REPLIES:</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: agentCannedClicked ? '#dbeafe' : '#f1f5f9', color: agentCannedClicked ? '#1d4ed8' : '#475569', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', border: agentCannedClicked ? '1px solid #93c5fd' : '1px solid transparent' }}>
                    ⚡ /express-shipping
                  </span>
                  <span style={{ fontSize: 10.5, color: '#64748b', background: '#f8fafc', padding: '2px 8px', borderRadius: 4 }}>
                    🏷️ /coupon-discount
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    readOnly
                    value={agentReplySent ? '' : agentCannedClicked ? 'Yes! UK 9 is in stock. Ships within 2 hours with express delivery 🚀' : ''}
                    placeholder={agentReplySent ? 'Reply sent...' : 'Click quick reply or type message...'}
                    style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 11.5, outline: 'none' }}
                  />
                  <button type="button" style={{ height: 30, padding: '0 12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Right Visitor Intel Panel */}
            <div style={{ width: isMobile ? 'none' : 190, flexShrink: 0, background: '#ffffff', borderLeft: '1px solid #eef2f6', display: isMobile ? 'none' : 'flex', flexDirection: 'column', padding: 12, gap: 10, fontSize: 11 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                Visitor Intel
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>NAME</div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Sarah Jenkins</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>LIVE CART VALUE</div>
                <div style={{ fontWeight: 800, color: '#16a34a', fontSize: 13 }}>₹2,499</div>
                <div style={{ color: '#64748b', fontSize: 10 }}>1x All-Weather Runner UK 9</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>LOCATION</div>
                <div style={{ color: '#0f172a' }}>Mumbai, India 🇮🇳</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>DEVICE & SPEED</div>
                <div style={{ color: '#0f172a' }}>macOS • Chrome (0.4s)</div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 3: Admin Triggers & 1-Click Store Switcher */}
        {isScene3 && (
          <div style={{ flex: 1, display: 'flex', height: '100%', minHeight: 0, position: 'relative' }}>
            {/* Store Switch Success Toast */}
            {storeSwitched && (
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: '#059669', color: '#ffffff', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.25)', animation: 'fadeScaleIn 0.3s ease' }}>
                <span>✓</span>
                <span>Switched to Store 2: Peak Audio Hub in 1 click!</span>
              </div>
            )}

            {/* Left Dark Sidebar */}
            <div style={{ width: 170, flexShrink: 0, background: '#070b13', borderRight: '1px solid #172133', display: isMobile ? 'none' : 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px 10px' }}>
              <div>
                <div style={{ padding: '4px 8px 14px' }}>
                  <ChatralFullLogo height={20} dark={true} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', padding: '7px 10px', fontSize: 12, borderRadius: 6 }}>
                    <MessageOutlined /> <span>Inbox</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#162238', color: '#ffffff', padding: '7px 10px', fontSize: 12, borderRadius: 6, fontWeight: 600 }}>
                    <ThunderboltOutlined style={{ color: '#38bdf8' }} /> <span>Triggers</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', padding: '7px 10px', fontSize: 12, borderRadius: 6 }}>
                    <ShopOutlined /> <span>Multi-Store</span>
                  </div>
                </div>
              </div>
              <div style={{ background: '#0d1524', border: '1px solid #1b283d', borderRadius: 6, padding: '6px 8px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>STORES INCLUDED</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>3 / 3 Active</div>
              </div>
            </div>

            {/* Admin Main Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              {/* Admin Top Header with 1-Click Store Switcher */}
              <div style={{ height: 46, borderBottom: '1px solid #f1f5f9', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Active Store:</span>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1.5px solid #2563eb', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}>
                      <span>{storeSwitched ? '🎧 Peak Audio Hub' : '🏪 Aura Threads'}</span>
                      <span style={{ fontSize: 10 }}>▾</span>
                    </div>
                    {/* Dropdown Menu when clicked */}
                    {storeDropdownOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 200, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 70, padding: 4 }}>
                        <div style={{ padding: '6px 10px', fontSize: 11.5, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                          Switch Store (1-Click):
                        </div>
                        <div style={{ padding: '6px 10px', fontSize: 11.5, fontWeight: 600, color: '#0f172a', borderRadius: 4, background: '#f1f5f9' }}>
                          1. Aura Threads (Active)
                        </div>
                        <div style={{ padding: '6px 10px', fontSize: 11.5, fontWeight: 600, color: '#2563eb', borderRadius: 4, background: '#eff6ff', border: '1px solid #93c5fd' }}>
                          2. Peak Audio Hub (Clicking...)
                        </div>
                        <div style={{ padding: '6px 10px', fontSize: 11.5, color: '#475569', borderRadius: 4 }}>
                          3. Luxe Wellness
                        </div>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10.5, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                    1-Click Switcher
                  </span>
                </div>
                <button type="button" style={{ height: 28, padding: '0 12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  + New Trigger
                </button>
              </div>

              {/* Content Columns: Triggers on Left, Multi-Store on Right */}
              <div style={{ flex: 1, padding: isMobile ? 14 : 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                {/* Left: Automated Triggers */}
                <div style={{ flex: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ThunderboltOutlined style={{ color: '#2563eb' }} />
                    Automated Sales Triggers (Auto-pilot Revenue)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: '#ffffff', border: '1.5px solid #86efac', borderRadius: 10, padding: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>🛒 Cart Abandonment Recovery</span>
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 999 }}>
                          ACTIVE (34% Converted)
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                        When visitor is on <code>/checkout</code> for &gt; 30 seconds:
                      </div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 11.5, color: '#334155' }}>
                        "Need help completing your order? Use code <strong style={{ color: '#2563eb' }}>SAVE10</strong> for ₹200 off!"
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>👋 First-Time Shopper Greeting</span>
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: 999 }}>
                          ACTIVE
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                        When visitor views 2nd product page:
                      </div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 11.5, color: '#334155' }}>
                        "Welcome! Let us know if you need any sizing or fit recommendations."
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Multi-Store Box */}
                <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                      Multi-Store Setup (3 Stores Included)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ background: '#ffffff', border: !storeSwitched ? '1.5px solid #2563eb' : '1px solid #e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 600, color: !storeSwitched ? '#2563eb' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>1. Aura Threads</span>
                        <span>{!storeSwitched ? 'Active 🟢' : 'Switch →'}</span>
                      </div>
                      <div style={{ background: '#ffffff', border: storeSwitched ? '1.5px solid #2563eb' : '1px solid #e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 600, color: storeSwitched ? '#2563eb' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>2. Peak Audio Hub</span>
                        <span>{storeSwitched ? 'Active 🟢' : 'Switch →'}</span>
                      </div>
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>3. Luxe Wellness</span>
                        <span style={{ color: '#2563eb' }}>Switch →</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                      Ultra-Lightweight Engine
                    </div>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                      ✓ 67 KB single script • 0 lag
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integrated Bottom Video Player Controls Bar */}
      <div
        style={{
          background: '#0f172a',
          borderTop: '1px solid #1e293b',
          padding: '10px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          color: '#ffffff',
          flexShrink: 0,
        }}
      >
        {/* Progress Timeline Scrubber */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            handleSeek(ratio * TOTAL_CYCLE);
          }}
          style={{
            width: '100%',
            height: 5,
            background: '#334155',
            borderRadius: 999,
            position: 'relative',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: '#3b82f6',
              borderRadius: 999,
              transition: 'width 0.08s linear',
            }}
          />
        </div>

        {/* Controls Row: Play/Pause, Chapters & Time Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: 8,
          }}
        >
          {/* Left: Play/Pause, Restart & Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
            >
              {isPlaying ? <PauseCircleOutlined style={{ fontSize: 18 }} /> : <PlayCircleOutlined style={{ fontSize: 18 }} />}
            </button>

            <button
              type="button"
              onClick={() => handleSeek(0)}
              title="Restart from beginning"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
            >
              <RedoOutlined />
            </button>

            <span style={{ fontSize: 11.5, color: '#94a3b8', fontFamily: 'monospace' }}>
              {formattedSec} / 0:24
            </span>
          </div>

          {/* Middle: Chapter Indicators (Clickable to jump scene) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleSeek(0)}
              style={{
                background: isScene1 ? '#1d4ed8' : 'rgba(255,255,255,0.08)',
                color: isScene1 ? '#ffffff' : '#94a3b8',
                border: isScene1 ? '1px solid #3b82f6' : '1px solid transparent',
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🛍️ 1. Storefront Widget
            </button>

            <button
              type="button"
              onClick={() => handleSeek(8000)}
              style={{
                background: isScene2 ? '#1d4ed8' : 'rgba(255,255,255,0.08)',
                color: isScene2 ? '#ffffff' : '#94a3b8',
                border: isScene2 ? '1px solid #3b82f6' : '1px solid transparent',
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              💬 2. Live Operator Inbox
            </button>

            <button
              type="button"
              onClick={() => handleSeek(16000)}
              style={{
                background: isScene3 ? '#1d4ed8' : 'rgba(255,255,255,0.08)',
                color: isScene3 ? '#ffffff' : '#94a3b8',
                border: isScene3 ? '1px solid #3b82f6' : '1px solid transparent',
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ⚙️ 3. Triggers & Multi-Store
            </button>
          </div>

          {/* Right: Live Demo Indicator */}
          <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#38bdf8' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
            <span>Interactive Live Demo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const nav = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [billingCycle, setBillingCycle] = useState('annual');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);
  const [heroActiveConvId, setHeroActiveConvId] = useState('chatral');
  const [showWidgetPill, setShowWidgetPill] = useState(true);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact Form state & submission handler
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', topic: 'Schedule a Live Demo', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handlePurchasePlan = (targetPlan) => {
    const token = localStorage.getItem('token');
    if (!token) {
      nav(`/login?mode=signup&plan=${targetPlan.toLowerCase()}`);
    } else {
      nav(`/settings?tab=billing&plan=${targetPlan.toLowerCase()}`);
    }
  };

  // Helper for "Book a demo" CTA across the entire page (exact same smooth scroll as navbar Contact Us)
  const handleBookDemo = (topic = 'Schedule a Live Demo') => {
    setContactForm((prev) => ({ ...prev, topic }));
    setMobileMenuOpen(false);
    scrollTo('contact');
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      return;
    }
    setContactSubmitting(true);
    try {
      // 1. Direct reliable delivery to chatral.official@gmail.com via FormSubmit AJAX
      const formPromise = fetch('https://formsubmit.co/ajax/chatral.official@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          company: contactForm.company || 'N/A',
          topic: contactForm.topic,
          message: contactForm.message,
          _subject: `New Chatral Lead: ${contactForm.name} (${contactForm.topic})`,
          _template: 'table',
        }),
      }).catch((err) => console.warn('FormSubmit error:', err));

      // 2. Also send to internal backend endpoint /api/contact if available
      const apiPromise = fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      }).catch((err) => console.warn('API contact error:', err));

      // Wait max 1.8s so user never experiences lag
      await Promise.race([
        Promise.all([formPromise, apiPromise]),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);

      setContactSubmitted(true);
      setContactForm({ name: '', email: '', company: '', topic: 'Schedule a Live Demo', message: '' });
    } catch (err) {
      console.error('Submission error:', err);
      setContactSubmitted(true);
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/' && location.pathname !== '/landing') {
      nav('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Guarantee page loads at absolute top (0, 0) on fresh load / hard refresh and clear any dismissal flag
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    try {
      sessionStorage.removeItem('chatral_pill_dismissed');
      localStorage.removeItem('chatral_pill_dismissed');
    } catch {
      // ignore
    }
  }, []);

  // Monitor whether Chatral live chat panel is open
  useEffect(() => {
    const checkState = () => {
      const host = document.querySelector('[id^="livechat-"]');
      if (host && host.shadowRoot) {
        const panel = host.shadowRoot.querySelector('.lc-panel:not(.closing)');
        setIsWidgetOpen(!!panel);
      }
    };
    checkState();
    const timer = setInterval(checkState, 150);
    return () => clearInterval(timer);
  }, []);

  const handleOpenLiveWidget = () => {
    const host = document.querySelector('[id^="livechat-"]');
    if (host && host.shadowRoot) {
      const launcher = host.shadowRoot.querySelector('.lc-launcher');
      if (launcher) {
        launcher.click();
      }
    }
  };

  const handleDismissPill = (e) => {
    e.stopPropagation();
    setShowWidgetPill(false);
  };

  const heroConversations = {
    chatral: {
      id: 'chatral',
      name: 'Chatral Visitor',
      initials: 'CV',
      avatarBg: '#f1f5f9',
      avatarColor: '#64748b',
      time: '6m',
      preview: 'Hi! How fast can we install Chatral?',
      channel: 'Website Live Widget',
      location: 'Gujarat, India 🇮🇳',
      page: '/pricing',
      browser: 'Chrome • macOS',
      messages: [
        { sender: 'visitor', name: 'Visitor', time: '5m ago', text: 'Hi! How fast can we install Chatral?' },
        { sender: 'agent', name: 'Support Agent', time: '3m ago', text: 'Under 2 minutes! Just paste one script tag.' },
        { sender: 'visitor', name: 'Visitor', time: 'Just now', text: 'Awesome, thanks!' },
      ],
    },
    sarah: {
      id: 'sarah',
      name: 'Sarah Jenkins',
      initials: 'SJ',
      avatarBg: '#e0f2fe',
      avatarColor: '#0369a1',
      time: '24m',
      preview: 'Can we customize the chat widget color?',
      channel: 'Online Store Widget',
      location: 'Mumbai, India 🇮🇳',
      page: '/products',
      browser: 'Safari • iOS',
      messages: [
        { sender: 'visitor', name: 'Sarah Jenkins', time: '20m ago', text: 'Can we customize the chat widget color?' },
        { sender: 'agent', name: 'Support Agent', time: '18m ago', text: 'Yes! Colors, logo, and greetings are customizable.' },
        { sender: 'visitor', name: 'Sarah Jenkins', time: '15m ago', text: 'Great, thank you!' },
      ],
    },
    alex: {
      id: 'alex',
      name: 'Alex Cooper',
      initials: 'AC',
      avatarBg: '#fef3c7',
      avatarColor: '#b45309',
      time: '1h',
      preview: 'Can we auto-greet visitors after 30s?',
      channel: 'Website Live Widget',
      location: 'London, UK 🇬🇧',
      page: '/features',
      browser: 'Firefox • Windows',
      messages: [
        { sender: 'visitor', name: 'Alex Cooper', time: '45m ago', text: 'Can we auto-greet visitors after 30s?' },
        { sender: 'agent', name: 'Support Agent', time: '40m ago', text: 'Yes! You can trigger proactive chat invitations.' },
        { sender: 'visitor', name: 'Alex Cooper', time: '35m ago', text: 'Perfect, thank you!' },
      ],
    },
  };

  // Auto-detect India for INR currency, otherwise USD
  const detectIsIndia = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Calcutta') || tz.includes('Kolkata')) return true;
      if (navigator.languages?.some((l) => l.endsWith('-IN') || l.includes('IN'))) return true;
    } catch (e) {
      // fallback
    }
    return false;
  };
  const [currency, setCurrency] = useState(() => (detectIsIndia() ? 'INR' : 'USD'));
  const planPricing = usePlanPricing();

  useEffect(() => {
    document.title = 'Chatral - Connect. Support. Resolve. | Modern Live Chat for Websites & E-Commerce';
  }, []);

  // Ensure Chatral live chat widget is loaded and visible ONLY on Landing Page
  useEffect(() => {
    let existing = document.querySelector('script[data-store="pk_yU4JQtndJuFviYy6d94ZzZE-"]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://chatral-backend.onrender.com/widget/chat.js';
      s.dataset.store = 'pk_yU4JQtndJuFviYy6d94ZzZE-';
      s.dataset.api = 'https://chatral-backend.onrender.com';
      s.async = true;
      document.body.appendChild(s);
    }

    const showWidget = () => {
      const hosts = document.querySelectorAll('[id^="livechat-"]');
      hosts.forEach((h) => {
        if (h.getAttribute('data-disabled') === 'true') {
          h.style.setProperty('display', 'none', 'important');
          h.style.setProperty('visibility', 'hidden', 'important');
        } else {
          h.style.setProperty('display', 'block', 'important');
          h.style.setProperty('visibility', 'visible', 'important');
        }
      });
    };

    showWidget();
    const timer = setInterval(showWidget, 400);
    const stopTimer = setTimeout(() => clearInterval(timer), 8000);

    return () => {
      clearInterval(timer);
      clearTimeout(stopTimer);
      // Remove widget completely when leaving the Landing Page (Login, Sign up, Dashboard, etc.)
      const hosts = document.querySelectorAll('[id^="livechat-"]');
      hosts.forEach((h) => {
        h.remove();
      });
      const s = document.querySelector('script[data-store="pk_yU4JQtndJuFviYy6d94ZzZE-"]');
      if (s) s.remove();
      if (window.__livechat) {
        delete window.__livechat['pk_yU4JQtndJuFviYy6d94ZzZE-'];
      }
    };
  }, []);

  const handleCopySnippet = () => {
    trackEvent('copy_widget_snippet');
    navigator.clipboard?.writeText('<script async src="https://chatral.app/widget.js" data-chatral-store="store_live_992"></script>');
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleStartFree = (source = 'hero') => {
    trackEvent('start_free_trial_click', { source });
    nav('/login?mode=signup');
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 78;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className="page-smooth-fade"
      style={{
        background: '#ffffff',
        color: '#0c0d10',
        minHeight: '100vh',
        overflowX: 'clip',
        fontFamily: '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      {/* 1. Navigation Header (Taller 76px with Official Chatral Brand Logo) */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
          width: '100%',
          padding: isMobile ? '0 16px' : '0 32px',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            height: isMobile ? 66 : 76,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Official Chatral Logo */}
          <a
            href="/"
            onClick={handleLogoClick}
            style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}
          >
            <ChatralFullLogo height={isMobile ? 32 : 38} dark={false} />
          </a>

          {/* Center Nav Links: Features, How it works, Pricing, Testimonials, FAQ, Contact Us with Kinetic Text Roll (No Box) */}
          {!isMobile && (
            <Flex gap={26} align="center">
              <a onClick={() => scrollTo('features')} className="nav-menu-link">
                <RollText text="Features" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('how-it-works')} className="nav-menu-link">
                <RollText text="How it works" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('testimonials')} className="nav-menu-link">
                <RollText text="Testimonials" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('pricing')} className="nav-menu-link">
                <RollText text="Pricing" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('faq')} className="nav-menu-link">
                <RollText text="FAQ" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('contact')} className="nav-menu-link">
                <RollText text="Contact us" secondaryColor="#2563eb" />
              </a>
            </Flex>
          )}

          {/* Right Button: Brand Blue Button + Mobile Hamburger Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => handleStartFree('navbar')}
              className="btn-brand-primary"
              style={{
                padding: isMobile ? '8px 16px' : '10px 22px',
                height: isMobile ? 38 : 42,
                fontSize: isMobile ? 13 : 14,
                fontFamily: 'inherit',
              }}
            >
              <RollText text="Start Free" />
              <svg className="btn-arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>

            {/* Mobile Hamburger Toggle */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Navigation Menu"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        placement="right"
        width={300}
        styles={{ body: { padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' } }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
            <ChatralFullLogo height={30} dark={false} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Features', id: 'features' },
              { label: 'How it works', id: 'how-it-works' },
              { label: 'Testimonials', id: 'testimonials' },
              { label: 'Pricing', id: 'pricing' },
              { label: 'FAQ', id: 'faq' },
              { label: 'Contact us', id: 'contact' },
            ].map((item) => (
              <a
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollTo(item.id);
                }}
                style={{
                  fontSize: 15.5,
                  fontWeight: 600,
                  color: '#0f172a',
                  textDecoration: 'none',
                  padding: '10px 4px',
                  borderBottom: '1px solid #f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>{item.label}</span>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>→</span>
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleStartFree('mobile_menu');
            }}
            className="btn-brand-primary"
            style={{ width: '100%', height: 44, borderRadius: 10, fontSize: 14, justifyContent: 'center' }}
          >
            <RollText text="Start 7-Day Free Trial" />
          </button>
          <button
            onClick={() => handleBookDemo()}
            className="btn-brand-secondary"
            style={{ width: '100%', height: 44, borderRadius: 10, fontSize: 14, justifyContent: 'center' }}
          >
            <RollText text="Book a demo" secondaryColor="#1d4ed8" />
          </button>
        </div>
      </Drawer>

      {/* Interactive Micro-animations, Liquid Waves & Styles */}
      <style>{`
        /* 1. Navbar Menu Items Hover Animation - Text Roll / Flip (No Box, Pure Typography) */
        .nav-menu-link {
          position: relative;
          color: #475569;
          font-size: 14.5px;
          font-weight: 500;
          padding: 6px 0;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          text-decoration: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          user-select: none;
          transition: none !important;
        }
        .nav-menu-link:hover,
        .nav-menu-link:focus,
        .nav-menu-link:active {
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
          outline: none;
        }
        .nav-menu-link::after {
          display: none !important;
        }

        .roll-text {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          line-height: 1.25;
          vertical-align: middle;
        }
        .roll-ghost {
          visibility: hidden;
          opacity: 0;
          pointer-events: none;
          display: inline-block;
          white-space: nowrap;
          height: auto;
        }
        .roll-stack {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          pointer-events: none;
        }
        .roll-stack-primary {
          color: inherit;
        }
        .roll-stack-secondary {
          color: inherit;
        }
        .roll-char {
          display: inline-block;
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .roll-stack-primary .roll-char {
          transform: translateY(0%);
        }
        .roll-stack-secondary .roll-char {
          transform: translateY(115%);
        }

        /* Hover on Nav Menu Link */
        .nav-menu-link:hover .roll-stack-primary .roll-char {
          transform: translateY(-115%);
        }
        .nav-menu-link:hover .roll-stack-secondary .roll-char {
          transform: translateY(0%);
        }

        /* Hover on ALL Buttons on Landing Page */
        button:hover .roll-stack-primary .roll-char,
        .btn-brand-primary:hover .roll-stack-primary .roll-char,
        .btn-brand-secondary:hover .roll-stack-primary .roll-char {
          transform: translateY(-115%);
        }
        button:hover .roll-stack-secondary .roll-char,
        .btn-brand-primary:hover .roll-stack-secondary .roll-char,
        .btn-brand-secondary:hover .roll-stack-secondary .roll-char {
          transform: translateY(0%);
        }

        /* 2. Global Button Hover (NO scale/size increase, steady button dimensions) */
        .btn-brand-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
          user-select: none;
          position: relative;
          transform: none !important;
        }
        .btn-brand-primary:hover {
          background: #1d4ed8;
          transform: none !important;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
        }
        .btn-brand-primary:active {
          transform: scale(0.98) !important;
        }
        .btn-brand-primary .btn-arrow-icon {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-brand-primary:hover .btn-arrow-icon {
          transform: translateX(4px);
        }

        .btn-brand-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #2563eb;
          border: 1.5px solid #dbeafe;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.06);
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          user-select: none;
          transform: none !important;
        }
        .btn-brand-secondary:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          transform: none !important;
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.12);
        }
        .btn-brand-secondary:active {
          transform: scale(0.98) !important;
        }

        .btn-brand-whatsapp {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #16a34a;
          border: 1.5px solid #22c55e;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(22, 163, 74, 0.08);
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          user-select: none;
          transform: none !important;
        }
        .btn-brand-whatsapp:hover {
          background: #f0fdf4;
          border-color: #16a34a;
          color: #15803d;
          transform: none !important;
          box-shadow: 0 2px 10px rgba(22, 163, 74, 0.16);
        }
        .btn-brand-whatsapp:active {
          transform: scale(0.98) !important;
        }

        .btn-cta-banner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #1d4ed8;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          transition: background-color 0.2s ease, color 0.2s ease;
          user-select: none;
          transform: none !important;
        }
        .btn-cta-banner:hover {
          background: #f8faff;
          color: #1e40af;
          transform: none !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        .btn-cta-banner .cta-arrow {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-cta-banner:hover .cta-arrow {
          transform: translateX(4px);
        }
        .btn-cta-banner:active {
          transform: scale(0.98) !important;
        }

        /* 3. Footer Links Hover Animation */
        .footer-nav-link {
          color: #64748b;
          text-decoration: none;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          width: fit-content;
        }
        .footer-nav-link:hover {
          color: #2563eb;
          transform: translateX(4px);
        }

        @keyframes liquidFlowLeft {
          0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
          50% { transform: translate3d(-35px, 25px, 0) scale(1.08) rotate(3deg); }
          100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
        }
        @keyframes liquidFlowRight {
          0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
          50% { transform: translate3d(30px, -20px, 0) scale(1.06) rotate(-3deg); }
          100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
        }
        @keyframes liquidPulse {
          0% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.04); }
          100% { opacity: 0.65; transform: scale(1); }
        }
        @keyframes marqueeScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .testimonials-marquee:hover {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* 2. Hero Section (Exact Relatik Design & Background Animation) */}
      <section
        style={{
          position: 'relative',
          padding: isMobile ? '56px 16px 36px' : '84px 24px 52px',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Relatik Silky Animated Liquid Gradient Layers */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-15%',
            width: '70vw',
            height: '85vh',
            background: 'radial-gradient(ellipse 60% 50% at 30% 40%, rgba(186, 230, 253, 0.8) 0%, rgba(191, 219, 254, 0.5) 45%, rgba(255, 255, 255, 0) 75%)',
            filter: 'blur(55px)',
            animation: 'liquidFlowLeft 14s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-15%',
            width: '70vw',
            height: '90vh',
            background: 'radial-gradient(ellipse 60% 50% at 70% 45%, rgba(199, 210, 254, 0.75) 0%, rgba(147, 197, 253, 0.45) 45%, rgba(255, 255, 255, 0) 75%)',
            filter: 'blur(60px)',
            animation: 'liquidFlowRight 16s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '0%',
            left: '25%',
            width: '50vw',
            height: '50vh',
            background: 'radial-gradient(circle at 50% 30%, rgba(224, 242, 254, 0.7) 0%, rgba(255, 255, 255, 0) 65%)',
            filter: 'blur(45px)',
            animation: 'liquidPulse 10s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Relatik Top Pill Badge with 3 Overlapping Avatars */}
          <div
            className="hero-fade-item-1"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 14px 4px 6px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #e6e7eb',
              borderRadius: 999,
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(12, 13, 16, 0.04)',
            }}
          >
            {/* 3 Overlapping Avatar Circles */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fef08a',
                  color: '#854d0e',
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff',
                }}
              >
                AS
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fecdd3',
                  color: '#9f1239',
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff',
                  marginLeft: -6,
                }}
              >
                SD
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#e9d5ff',
                  color: '#6b21a8',
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff',
                  marginLeft: -6,
                }}
              >
                DK
              </div>
            </div>
            <span style={{ color: '#0c0d10', fontSize: 13, fontWeight: 500 }}>
              Trusted by 25+ modern businesses
            </span>
          </div>

          {/* SEO Optimized Hero Title with Official Tagline */}
          <Typography.Title
            level={1}
            className="hero-fade-item-1"
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 26 : 38,
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.03em',
              margin: '0 auto 16px',
              maxWidth: 820,
            }}
          >
            <span style={{ display: isMobile ? 'inline' : 'inline-block', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>
              Convert Visitors into Customers
            </span>
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: isMobile ? 'inline' : 'inline-block',
                whiteSpace: isMobile ? 'normal' : 'nowrap',
              }}
            >
              With Lightning-Fast Live Chat
            </span>
          </Typography.Title>

          {/* SEO Optimized Subtitle */}
          <Typography.Paragraph
            className="hero-fade-item-2"
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 14 : 16,
              lineHeight: 1.55,
              maxWidth: 600,
              margin: '0 auto 28px',
              fontWeight: 400,
            }}
          >
            Ultra-fast live chat built for modern stores. Connect with shoppers in real time, view live cart contents, and close sales before they leave.
          </Typography.Paragraph>

          {/* Relatik Hero CTA Buttons with Dynamic Hover Animations */}
          <Flex justify="center" gap={14} wrap="wrap" className="hero-fade-item-2" style={{ marginBottom: 26 }}>
            <button
              onClick={() => handleStartFree('navbar')}
              className="btn-brand-primary"
              style={{
                padding: '13px 26px',
                height: 48,
                fontSize: 15,
                fontFamily: 'inherit',
              }}
            >
              <RollText text="Start free trial" />
              <svg className="btn-arrow-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => handleBookDemo('Schedule a Live Demo')}
              className="btn-brand-secondary"
              style={{
                padding: '13px 26px',
                height: 48,
                fontSize: 15,
                fontFamily: 'inherit',
              }}
            >
              <RollText text="Book a demo" secondaryColor="#1d4ed8" />
            </button>
          </Flex>

          {/* Relatik Trust Checkmarks */}
          <Flex justify="center" gap={22} wrap="wrap" className="hero-fade-item-2" style={{ color: '#6b707c', fontSize: 13, fontWeight: 400 }}>
            <span>✓ No credit card required</span>
            <span>✓ 7-day free trial</span>
            <span>✓ Cancel anytime</span>
          </Flex>
        </div>

        {/* Single Box Automated Video Simulation Showcase */}
        <div className="hero-fade-item-3" style={{ maxWidth: 1080, margin: '28px auto 0', position: 'relative' }}>
          <HeroVideoShowcase isMobile={isMobile} />
        </div>
  </section>

      {/* 3. Features Bento Grid (Exact Relatik 5-Card Bento Layout) */}
      <section
        id="features"
        style={{
          padding: isMobile ? '48px 16px' : '72px 24px',
          background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(219, 234, 254, 0.45) 0%, rgba(240, 247, 255, 0.25) 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                background: '#eaf2ff',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                borderRadius: 999,
                marginBottom: 16,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
              <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Features
              </span>
            </div>
            <Typography.Title
              level={2}
              style={{
                color: '#0c0d10',
                fontSize: isMobile ? 28 : 42,
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.15,
                margin: '0 0 14px',
              }}
            >
              Everything you need to connect, support, and convert
            </Typography.Title>
            <Typography.Paragraph
              style={{
                color: '#5b5f6b',
                fontSize: isMobile ? 14.5 : 16,
                maxWidth: 620,
                margin: '0 auto',
                lineHeight: 1.55,
                fontWeight: 400,
              }}
            >
              Every tool you need to track, manage, and grow customer relationships —<br className={isMobile ? 'none' : ''} />
              from first contact to automation — without the clutter.
            </Typography.Paragraph>
          </div>

          {/* Relatik 6-Card Bento Grid (3x2 Balanced Grid) */}
          <Row gutter={[20, 20]}>
            
            {/* Card 1: Live visitor tracking */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#eaf2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <GlobalOutlined style={{ fontSize: 18, color: '#2b7fff' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Live visitor tracking
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Track visitors on your site in real-time, see their active browsing journey, and initiate sales chats before they leave.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Card 2: Unified operator inbox */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <MessageOutlined style={{ fontSize: 18, color: '#10b981' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Unified operator inbox
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Manage all customer conversations in one calm, lightning-fast workspace with live typing preview and instant status tracking.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Card 3: Multi-store management */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#ecfeff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <ShopOutlined style={{ fontSize: 18, color: '#0891b2' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Multi-store management
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Connect and manage multiple websites, Shopify stores, and customer domains effortlessly from one unified master dashboard.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Bento Card 3: Analytics & insights (Bottom Left) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#f3e8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <BarChartOutlined style={{ fontSize: 18, color: '#8b5cf6' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Analytics & insights
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Real-time reports on first-response SLA, peak-hour chat volumes, and conversion metrics that show what drives revenue.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Bento Card 4: Automated workflows (Bottom Center) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: 18, color: '#f59e0b' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Automated workflows
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Put sales greetings on autopilot with smart exit-intent and cart-abandonment triggers, so your team focuses on closing deals.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Bento Card 6: Role-based access (Bottom Right) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#fce7f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <SafetyCertificateOutlined style={{ fontSize: 18, color: '#ec4899' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Role-based access
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Assign granular roles (Owner, Admin, Agent) with custom permissions, ensuring team members only access what they need.
                </Typography.Paragraph>
              </div>
            </Col>

          </Row>
        </div>
      </section>

      {/* 4. How It Works - High-Converting 3-Step Flow with Hero Blue Accent */}
      <section
        id="how-it-works"
        style={{
          padding: isMobile ? '48px 16px' : '72px 24px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f0f7ff 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
          
          {/* Header */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              background: '#eaf2ff',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              How it works
            </span>
          </div>

          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 28 : 42,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              margin: '0 0 14px',
            }}
          >
            How Chatral Turns Store Visitors into Customers
          </Typography.Title>
          <Typography.Paragraph
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 14.5 : 16,
              maxWidth: 620,
              margin: '0 auto 48px',
              lineHeight: 1.55,
              fontWeight: 400,
            }}
          >
            Three simple steps to connect with shoppers, resolve buyer doubts, and boost daily sales.
          </Typography.Paragraph>

          <Row gutter={[24, 24]}>
            {[
              {
                step: '01',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                ),
                title: 'Install in 2 minutes (1-line code)',
                desc: 'Copy and paste our featherlight 67KB snippet into your Shopify, WooCommerce, or custom site. Your chat bubble goes live instantly with zero lag.',
              },
              {
                step: '02',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                ),
                title: 'See live shoppers & auto-greet',
                desc: 'Watch visitors browse in real-time, see their active cart items, and trigger automated welcome discounts right before they abandon their cart.',
              },
              {
                step: '03',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M12 7v6" />
                    <path d="m9 10 3 3 3-3" />
                  </svg>
                ),
                title: 'Reply in seconds & close sales',
                desc: 'Answer shopper questions instantly from your web or mobile inbox. Share product links, send coupon codes, and turn hesitation into revenue.',
              },
            ].map((s, i) => (
              <Col xs={24} md={8} key={i}>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #dbeafe',
                    borderRadius: 20,
                    padding: '34px 28px',
                    textAlign: 'left',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 20px -4px rgba(37, 99, 235, 0.06)',
                    transition: 'all 0.22s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = '#93c5fd';
                    e.currentTarget.style.boxShadow = '0 12px 30px -6px rgba(37, 99, 235, 0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = '#dbeafe';
                    e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(37, 99, 235, 0.06)';
                  }}
                >
                  {/* Top Row: Icon on left with blue gradient, Step pill on right */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
                      }}
                    >
                      {s.icon}
                    </div>
                    <span
                      style={{
                        color: '#2563eb',
                        background: '#eff6ff',
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      STEP {s.step}
                    </span>
                  </div>

                  {/* Title & Description below */}
                  <div style={{ marginTop: 26 }}>
                    <Typography.Title
                      level={3}
                      style={{
                        color: '#0c0d10',
                        fontSize: 19,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        margin: '0 0 10px',
                      }}
                    >
                      {s.title}
                    </Typography.Title>
                    <Typography.Paragraph
                      style={{
                        color: '#5b5f6b',
                        fontSize: 14,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {s.desc}
                    </Typography.Paragraph>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 5. Testimonials (Exact Relatik Infinite Marquee Carousel with Hero Blue Ambient Glow) */}
      <section
        id="testimonials"
        style={{
          padding: isMobile ? '48px 0' : '72px 0',
          background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(224, 242, 254, 0.45) 0%, rgba(240, 247, 255, 0.3) 55%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center', padding: '0 24px', marginBottom: 44 }}>
          
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              background: '#eaf2ff',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Testimonials
            </span>
          </div>

          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 28 : 42,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              margin: '0 0 14px',
            }}
          >
            Loved by teams who sell
          </Typography.Title>
          <Typography.Paragraph
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 14.5 : 16,
              maxWidth: 580,
              margin: '0 auto',
              lineHeight: 1.55,
              fontWeight: 400,
            }}
          >
            Founders, sales leaders, and support teams use Chatral to stay close to their customers.
          </Typography.Paragraph>
        </div>

        {/* Marquee Carousel Track with Edge Fade Masks */}
        <div
          style={{
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
            padding: '12px 0 24px',
            maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}
        >
          <div
            className="testimonials-marquee"
            style={{
              display: 'flex',
              gap: 20,
              width: 'max-content',
              animation: 'marqueeScroll 45s linear infinite',
              cursor: 'grab',
            }}
          >
            {[
              {
                title: 'Increased website orders by 40%',
                quote: 'We sell sarees across India from Surat. Chatral lets our sales team initiate live chats when shoppers are on checkout. We stopped cart drop-offs completely.',
                author: 'Bhavik Patel',
                role: 'Founder, Surat Silk & Sarees',
                initials: 'BP',
                avatarBg: '#eff6ff',
                avatarColor: '#2563eb',
              },
              {
                title: 'Setup took literally 2 minutes on Shopify',
                quote: 'Installed the widget on our Shopify jewellery store without any developer. Customers love the instant replies and sound alerts during high-traffic festivals.',
                author: 'Priya Shah',
                role: 'Head of E-Commerce, Aura Jewels (Surat)',
                initials: 'PS',
                avatarBg: '#fdf2f8',
                avatarColor: '#db2777',
              },
              {
                title: 'Manages 3 brand stores smoothly',
                quote: 'We run two wholesale stores and one retail brand from Ring Road, Surat. Multi-store management inside one Chatral dashboard saved our team from opening 10 browser tabs.',
                author: 'Jignesh Mehta',
                role: 'Director, TexFab Global Textiles',
                initials: 'JM',
                avatarBg: '#ecfdf5',
                avatarColor: '#059669',
              },
              {
                title: 'Our customer conversions doubled',
                quote: 'The automated welcome greeting triggers right when visitors spend 30 seconds on a product page. Our lead response time dropped from 2 hours to under 1 minute.',
                author: 'Kavita Desai',
                role: 'Founder, Shreeji Organics & Wellness',
                initials: 'KD',
                avatarBg: '#fff7ed',
                avatarColor: '#ea580c',
              },
              {
                title: 'Handled 3,000+ chats during wedding season',
                quote: 'Zero lags, crystal-clear visitor location tracking, and lightning-fast chat replies. Chatral is built for high-volume sales teams that care about relationships.',
                author: 'Harshil Chothani',
                role: 'Partner, Surat Diamond Craft',
                initials: 'HC',
                avatarBg: '#f5f3ff',
                avatarColor: '#7c3aed',
              },
              {
                title: 'Best customer messaging tool in Gujarat',
                quote: 'We recommend Chatral to all our e-commerce clients in Surat & Ahmedabad. Clean UI, honest pricing, and immediate support from the Chatral team.',
                author: 'Rohan Vaghani',
                role: 'Growth Lead, Vaghani Commerce (Surat)',
                initials: 'RV',
                avatarBg: '#eff6ff',
                avatarColor: '#1d4ed8',
              },
              // Duplicate once to enable seamless infinite scroll loop
              {
                title: 'Increased website orders by 40%',
                quote: 'We sell sarees across India from Surat. Chatral lets our sales team initiate live chats when shoppers are on checkout. We stopped cart drop-offs completely.',
                author: 'Bhavik Patel',
                role: 'Founder, Surat Silk & Sarees',
                initials: 'BP',
                avatarBg: '#eff6ff',
                avatarColor: '#2563eb',
              },
              {
                title: 'Setup took literally 2 minutes on Shopify',
                quote: 'Installed the widget on our Shopify jewellery store without any developer. Customers love the instant replies and sound alerts during high-traffic festivals.',
                author: 'Priya Shah',
                role: 'Head of E-Commerce, Aura Jewels (Surat)',
                initials: 'PS',
                avatarBg: '#fdf2f8',
                avatarColor: '#db2777',
              },
              {
                title: 'Manages 3 brand stores smoothly',
                quote: 'We run two wholesale stores and one retail brand from Ring Road, Surat. Multi-store management inside one Chatral dashboard saved our team from opening 10 browser tabs.',
                author: 'Jignesh Mehta',
                role: 'Director, TexFab Global Textiles',
                initials: 'JM',
                avatarBg: '#ecfdf5',
                avatarColor: '#059669',
              },
              {
                title: 'Our customer conversions doubled',
                quote: 'The automated welcome greeting triggers right when visitors spend 30 seconds on a product page. Our lead response time dropped from 2 hours to under 1 minute.',
                author: 'Kavita Desai',
                role: 'Founder, Shreeji Organics & Wellness',
                initials: 'KD',
                avatarBg: '#fff7ed',
                avatarColor: '#ea580c',
              },
              {
                title: 'Handled 3,000+ chats during wedding season',
                quote: 'Zero lags, crystal-clear visitor location tracking, and lightning-fast chat replies. Chatral is built for high-volume sales teams that care about relationships.',
                author: 'Harshil Chothani',
                role: 'Partner, Surat Diamond Craft',
                initials: 'HC',
                avatarBg: '#f5f3ff',
                avatarColor: '#7c3aed',
              },
              {
                title: 'Best customer messaging tool in Gujarat',
                quote: 'We recommend Chatral to all our e-commerce clients in Surat & Ahmedabad. Clean UI, honest pricing, and immediate support from the Chatral team.',
                author: 'Rohan Vaghani',
                role: 'Growth Lead, Vaghani Commerce (Surat)',
                initials: 'RV',
                avatarBg: '#eff6ff',
                avatarColor: '#1d4ed8',
              },
            ].map((t, idx) => (
              <div
                key={idx}
                style={{
                  width: isMobile ? 300 : 350,
                  flexShrink: 0,
                  background: '#ffffff',
                  border: '1px solid #e0eafc',
                  borderRadius: 22,
                  padding: '30px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.05)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(37, 99, 235, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0eafc';
                  e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(37, 99, 235, 0.05)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  {/* Top: 5 Blue Stars + Light Blue Quotation Mark */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 3, color: '#2563eb', fontSize: 13 }}>
                      {[...Array(5)].map((_, s) => (
                        <StarFilled key={s} />
                      ))}
                    </div>
                    {/* Quotation mark svg */}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#dbeafe">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  {/* Title */}
                  <Typography.Title
                    level={4}
                    style={{
                      color: '#0c0d10',
                      fontSize: 16.5,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      margin: '0 0 8px',
                      lineHeight: 1.35,
                    }}
                  >
                    {t.title}
                  </Typography.Title>

                  {/* Quote */}
                  <Typography.Paragraph
                    style={{
                      color: '#5b5f6b',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {t.quote}
                  </Typography.Paragraph>
                </div>

                {/* Author Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: t.avatarBg,
                      color: t.avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0c0d10', lineHeight: 1.2 }}>
                      {t.author}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9aa0ac', marginTop: 2 }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Pricing Plans (Exact Relatik Styling with Hero Blue Ambient Glow) */}
      <section
        id="pricing"
        style={{
          padding: isMobile ? '48px 16px 80px' : '72px 24px 100px',
          background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(219, 234, 254, 0.45) 0%, rgba(240, 247, 255, 0.25) 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: 1140, margin: '0 auto', textAlign: 'center' }}>
          
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              background: '#eaf2ff',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Pricing
            </span>
          </div>

          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 24 : 34,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 8px',
            }}
          >
            Simple, transparent pricing
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 14.5, maxWidth: 540, margin: '0 auto 22px' }}>
            Get started with a full-access 7-day free trial. Upgrade anytime to keep conversations flowing.
          </Typography.Paragraph>

          {/* Billing Cycle + Currency Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            <Segmented
              options={[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Annual (Save 15%)', value: 'annual' },
              ]}
              value={billingCycle}
              onChange={setBillingCycle}
              style={{
                background: '#eff6ff',
                padding: 3,
                borderRadius: 10,
                color: '#0c0d10',
                fontWeight: 600,
                fontSize: 13,
                border: '1px solid #dbeafe',
              }}
            />

            <Segmented
              options={[
                { label: '$ USD', value: 'USD' },
                { label: '₹ INR', value: 'INR' },
              ]}
              value={currency}
              onChange={setCurrency}
              style={{
                background: '#eff6ff',
                padding: 3,
                borderRadius: 10,
                color: '#0c0d10',
                fontWeight: 600,
                fontSize: 13,
                border: '1px solid #dbeafe',
              }}
            />
          </div>

          <Row gutter={[24, 24]} justify="center" align="stretch">
            {/* 1. 7-Day Free Trial Plan */}
            <Col xs={24} md={12} lg={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '26px 22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  boxShadow: '0 4px 16px -2px rgba(12, 13, 16, 0.03)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(37, 99, 235, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(12, 13, 16, 0.03)';
                }}
              >
                <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 16 }}>7-Day Free Trial</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0c0d10', margin: '8px 0 2px', letterSpacing: '-0.03em' }}>
                  {currency === 'INR' ? '₹0' : '$0'}{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ 7 days free</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 14, lineHeight: 1.45 }}>
                  Full access to all features free for 7 days. Test on your website with zero risk.
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 14px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>Full Access for 7 Days</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> 1 Active Store</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Unlimited Live Chats</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Live Visitor Tracking</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Works on Any Website</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Automated Sales Triggers</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Customizable Chat Widget</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Priority 24/7 Support</div>
                </div>
                <button
                  onClick={() => handleStartFree('pricing_free_trial')}
                  className="btn-brand-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: 42,
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                  }}
                >
                  <RollText text="Start 7-Day Free Trial" secondaryColor="#1d4ed8" />
                </button>
                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#9aa0ac', marginTop: 8 }}>
                  No credit card required
                </div>
              </div>
            </Col>

            {/* 2. Starter Growth Plan (Most Popular) */}
            <Col xs={24} md={12} lg={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '2px solid #2563eb',
                  borderRadius: 20,
                  padding: '26px 22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  position: 'relative',
                  boxShadow: '0 16px 36px -8px rgba(37, 99, 235, 0.22)',
                }}
              >
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                  <span
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '4px 14px',
                      borderRadius: 999,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                    }}
                  >
                    Most Popular
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 16 }}>Starter Growth</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0c0d10', margin: '8px 0 2px', letterSpacing: '-0.03em' }}>
                  {currency === 'INR'
                    ? (billingCycle === 'annual' ? `₹${Math.round(planPricing.STARTER.annualPriceINR / 12)}` : `₹${planPricing.STARTER.monthlyPriceINR}`)
                    : (billingCycle === 'annual' ? `$${Math.round(planPricing.STARTER.annualPriceUSD / 12)}` : `$${planPricing.STARTER.monthlyPriceUSD}`)}{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 14, lineHeight: 1.45 }}>
                  {billingCycle === 'annual'
                    ? (currency === 'INR' ? `Billed annually at ₹${planPricing.STARTER.annualPriceINR.toLocaleString('en-IN')}/yr (Save 15%). Multi-store with zero branding.` : `Billed annually at $${planPricing.STARTER.annualPriceUSD}/yr (Save 15%). Multi-store with zero branding.`)
                    : 'Everything you need to turn visitors into buyers with multi-store and no branding.'}
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 14px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>3 Active Stores</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>3 Team Agents</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Unlimited Live Chats</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Live Visitor Tracking</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Sound & Desktop Alerts</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Pre-Chat Visitor Form</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> File & Media Sharing</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Priority 24/7 Support</div>
                </div>
                <button
                  onClick={() => handlePurchasePlan('STARTER')}
                  className="btn-brand-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: 42,
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                  }}
                >
                  <RollText text="Buy Starter Growth" />
                </button>
                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#9aa0ac', marginTop: 8 }}>
                  Instant access • Cancel anytime
                </div>
              </div>
            </Col>

            {/* 3. Enterprise Plan (Custom Plan) */}
            <Col xs={24} md={12} lg={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '26px 22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  boxShadow: '0 4px 16px -2px rgba(12, 13, 16, 0.03)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(37, 99, 235, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(12, 13, 16, 0.03)';
                }}
              >
                <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 16 }}>Enterprise</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0c0d10', margin: '8px 0 2px', letterSpacing: '-0.03em' }}>
                  Custom{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ tailored plan</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 14, lineHeight: 1.45 }}>
                  Tailored for high-volume stores, custom features & scaling teams.
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 14px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>Custom Stores & Agent Seats</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Custom Features on Demand</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>1-on-1 Setup & Team Training</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Dedicated Account Manager</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Enterprise-Grade Security</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Early Access to New Features</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> No Contract Lock-in</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Priority 24/7 Support</div>
                </div>
                <button
                  onClick={() => window.open('https://wa.me/919978987181?text=' + encodeURIComponent('Hi Chatral team, I would like to inquire about the Enterprise Custom Plan for my business.'), '_blank')}
                  className="btn-brand-whatsapp"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: 42,
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                  }}
                >
                  <RollText text="Chat on WhatsApp" secondaryColor="#15803d" />
                </button>
                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#9aa0ac', marginTop: 8 }}>
                  Tailored onboarding • Dedicated support
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Competitor Comparison Table Section */}
      <section
        id="compare"
        style={{
          padding: isMobile ? '48px 16px' : '72px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                background: '#eff6ff',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                borderRadius: 999,
                marginBottom: 14,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
              <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Chatral vs Alternatives
              </span>
            </div>
            <Typography.Title
              level={2}
              style={{
                color: '#0c0d10',
                fontSize: isMobile ? 26 : 38,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                margin: '0 0 12px',
              }}
            >
              Why store owners switch to Chatral
            </Typography.Title>
            <Typography.Paragraph
              style={{
                color: '#5b5f6b',
                fontSize: isMobile ? 14 : 16,
                maxWidth: 620,
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              High-growth e-commerce brands choose Chatral for faster page load speed, multi-store support, and transparent pricing without seat penalties.
            </Typography.Paragraph>
          </div>

          {/* Responsive Comparison Table Container */}
          <div
            style={{
              overflowX: 'auto',
              borderRadius: 18,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.08)',
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: 640,
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '18px 22px', width: '34%', fontWeight: 700, color: '#475569' }}>
                    Feature / Capability
                  </th>
                  <th
                    style={{
                      padding: '18px 22px',
                      width: '26%',
                      fontWeight: 800,
                      color: '#2563eb',
                      background: '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16 }}>Chatral 🚀</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: '#2563eb',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                        }}
                      >
                        Recommended
                      </span>
                    </div>
                  </th>
                  <th style={{ padding: '18px 22px', width: '20%', fontWeight: 700, color: '#475569' }}>
                    Tidio
                  </th>
                  <th style={{ padding: '18px 22px', width: '20%', fontWeight: 700, color: '#475569' }}>
                    Crisp
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Monthly Price */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 22px', fontWeight: 600, color: '#0f172a' }}>
                    Starting Price
                  </td>
                  <td
                    style={{
                      padding: '16px 22px',
                      background: '#f0fdf4',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#15803d' }}>
                      {currency === 'INR' ? '₹508 / mo' : '$6 / mo'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      Starter Growth (Annual)
                    </div>
                  </td>
                  <td style={{ padding: '16px 22px', color: '#475569' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {currency === 'INR' ? '₹2,450 / mo' : '$29 / mo'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {currency === 'INR' ? 'Starter ($29/mo)' : 'Starter tier'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 22px', color: '#475569' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {currency === 'INR' ? '₹2,100 / mo' : '$25 / mo'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {currency === 'INR' ? 'Pro ($25/mo)' : 'Pro tier'}
                    </div>
                  </td>
                </tr>

                {/* 2. Active Stores */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 22px', fontWeight: 600, color: '#0f172a' }}>
                    Active Stores Included
                  </td>
                  <td
                    style={{
                      padding: '16px 22px',
                      fontWeight: 700,
                      color: '#2563eb',
                      background: '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    3 Stores included
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    1 Store only
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    1 Store only
                  </td>
                </tr>

                {/* 3. Team Member Seats */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 22px', fontWeight: 600, color: '#0f172a' }}>
                    Team Member Seats
                  </td>
                  <td
                    style={{
                      padding: '16px 22px',
                      fontWeight: 700,
                      color: '#2563eb',
                      background: '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    3 Team Agents
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    1-2 Seats max
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    2 Seats max
                  </td>
                </tr>

                {/* 4. Live Chat Conversations */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 22px', fontWeight: 600, color: '#0f172a' }}>
                    Live Chat Conversations
                  </td>
                  <td
                    style={{
                      padding: '16px 22px',
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    <CheckOutlined style={{ color: '#2563eb', marginRight: 6 }} /> Unlimited
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    Capped / Pay per chat
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    <CheckOutlined style={{ color: '#64748b', marginRight: 6 }} /> Unlimited
                  </td>
                </tr>

                {/* 5. Widget Page Load Impact (Speed) */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 22px', fontWeight: 600, color: '#0f172a' }}>
                    Widget Speed & Size
                  </td>
                  <td
                    style={{
                      padding: '16px 22px',
                      fontWeight: 700,
                      color: '#15803d',
                      background: '#f0fdf4',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    ⚡ ~67 KB <span style={{ fontSize: 11, fontWeight: 500 }}>(Zero store slowdown)</span>
                  </td>
                  <td style={{ padding: '16px 22px', color: '#dc2626' }}>
                    ⚠️ ~1,200 KB (Heavy)
                  </td>
                  <td style={{ padding: '16px 22px', color: '#d97706' }}>
                    ⚠️ ~400 KB
                  </td>
                </tr>

                {/* 6. Automated Sales Triggers */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 22px', fontWeight: 600, color: '#0f172a' }}>
                    Automated Sales Triggers
                  </td>
                  <td
                    style={{
                      padding: '16px 22px',
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    <CheckOutlined style={{ color: '#2563eb', marginRight: 6 }} /> Included
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    Paid Add-on
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    Paid Plus tier ($95/mo)
                  </td>
                </tr>

                {/* 7. Live Visitor Tracking */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 22px', fontWeight: 600, color: '#0f172a' }}>
                    Real-Time Visitor Tracking
                  </td>
                  <td
                    style={{
                      padding: '16px 22px',
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    <CheckOutlined style={{ color: '#2563eb', marginRight: 6 }} /> Real-time active cart view
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    Limited
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    Included
                  </td>
                </tr>

                {/* 8. Free Trial */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 22px', fontWeight: 600, color: '#0f172a' }}>
                    Free Trial
                  </td>
                  <td
                    style={{
                      padding: '16px 22px',
                      fontWeight: 700,
                      color: '#2563eb',
                      background: '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    7 Days Full Access <span style={{ fontSize: 11, fontWeight: 500 }}>(No card required)</span>
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    7 Days Limited
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    14 Days Basic
                  </td>
                </tr>

                {/* 9. Support & Onboarding */}
                <tr>
                  <td style={{ padding: '16px 22px', fontWeight: 600, color: '#0f172a' }}>
                    Support Channel
                  </td>
                  <td
                    style={{
                      padding: '16px 22px',
                      fontWeight: 700,
                      color: '#2563eb',
                      background: '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                      borderBottom: '2px solid #2563eb',
                    }}
                  >
                    Priority 24/7 WhatsApp & Email
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    Email Queue
                  </td>
                  <td style={{ padding: '16px 22px', color: '#64748b' }}>
                    Chat & Email
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* High-Converting CTA Card below Comparison Table */}
          <div
            style={{
              marginTop: 32,
              background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
              border: '1.5px solid #bfdbfe',
              borderRadius: 18,
              padding: isMobile ? '24px 18px' : '26px 30px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              boxShadow: '0 10px 28px -6px rgba(37, 99, 235, 0.12)',
            }}
          >
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: '#0c0d10', letterSpacing: '-0.02em', marginBottom: 6 }}>
                Switch to Chatral and save up to 80% on live chat
              </div>
              <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <CheckOutlined style={{ color: '#16a34a', fontSize: 12 }} /> 7-Day Free Trial
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <CheckOutlined style={{ color: '#16a34a', fontSize: 12 }} /> No credit card required
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <CheckOutlined style={{ color: '#16a34a', fontSize: 12 }} /> Cancel anytime
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => handleStartFree('comparison_cta')}
                className="btn-brand-primary"
                style={{
                  height: 44,
                  padding: '0 24px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxShadow: '0 8px 18px -4px rgba(37, 99, 235, 0.35)',
                }}
              >
                <RollText text="Start Free Trial" />
                <svg className="btn-arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => window.open('https://wa.me/919978987181?text=' + encodeURIComponent('Hi Chatral team, I would like to learn more about switching to Chatral.'), '_blank')}
                className="btn-brand-whatsapp"
                style={{
                  height: 44,
                  padding: '0 20px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontFamily: 'inherit',
                }}
              >
                <RollText text="Chat on WhatsApp" secondaryColor="#15803d" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section (Centered, Clean & Spacious with Hero Blue Ambient Glow) */}
      <section
        id="faq"
        style={{
          padding: isMobile ? '48px 16px' : '72px 24px',
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(219, 234, 254, 0.4) 0%, rgba(240, 247, 255, 0.2) 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              background: '#eaf2ff',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              FAQ
            </span>
          </div>

          {/* Title */}
          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 28 : 42,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              margin: '0 0 14px',
            }}
          >
            Frequently asked questions
          </Typography.Title>

          {/* Description */}
          <Typography.Paragraph
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 14.5 : 16,
              lineHeight: 1.6,
              maxWidth: 540,
              margin: '0 auto 40px',
              fontWeight: 400,
            }}
          >
            Everything you need to know about Chatral and getting started.
          </Typography.Paragraph>

          {/* Accordion Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {[
              {
                q: 'What is Chatral?',
                a: 'Chatral is a calm, fast live chat and customer messaging platform designed to help e-commerce stores and modern teams engage visitors, track active shoppers, and close more deals in real time.',
              },
              {
                q: 'Who is Chatral for?',
                a: 'Chatral is built for online store owners, SaaS founders, sales leaders, and customer support teams who want a simple, clutter-free workspace that their entire team will actually enjoy using.',
              },
              {
                q: 'Do I need technical skills to use it?',
                a: 'No technical skills required at all. Setup takes less than 2 minutes: simply paste the 1-line lightweight script tag into your Shopify theme, WordPress site, or HTML header.',
              },
              {
                q: 'What features does Chatral offer?',
                a: 'Chatral provides real-time visitor tracking, unified operator inboxes, multi-store management, automated sales trigger greetings, canned replies, sound notifications, and fast analytics.',
              },
              {
                q: 'Can I try Chatral for free?',
                a: 'Yes! Every plan starts with a full-access 7-day free trial — no credit card required. Cancel anytime with a single click.',
              },
            ].map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid',
                    borderColor: isOpen ? '#93c5fd' : '#e2e8f0',
                    borderRadius: 16,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    boxShadow: isOpen
                      ? '0 8px 24px -4px rgba(37, 99, 235, 0.1)'
                      : '0 2px 8px -2px rgba(12, 13, 16, 0.03)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) e.currentTarget.style.borderColor = '#93c5fd';
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <span
                      style={{
                        color: isOpen ? '#2563eb' : '#0c0d10',
                        fontWeight: 600,
                        fontSize: 15.5,
                        letterSpacing: '-0.01em',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {item.q}
                    </span>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isOpen ? '#eff6ff' : '#f1f5f9',
                        color: isOpen ? '#2563eb' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 500,
                        flexShrink: 0,
                        transform: isOpen ? 'rotate(45deg)' : 'none',
                        transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      +
                    </div>
                  </div>

                  {/* Smooth animated accordion drawer using CSS Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                      transition: 'grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 14,
                          borderTop: '1px solid #f1f5f9',
                          color: '#5b5f6b',
                          fontSize: 14,
                          lineHeight: 1.65,
                          fontWeight: 400,
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                          transition: 'opacity 0.25s ease, transform 0.25s ease',
                        }}
                      >
                        {item.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Contact Us Form Section */}
      <section
        id="contact"
        style={{
          padding: isMobile ? '56px 20px 64px' : '88px 32px 96px',
          background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(219, 234, 254, 0.45) 0%, rgba(240, 247, 255, 0.25) 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <Row gutter={[isMobile ? 32 : 56, 32]} align="top">
            {/* Left Column: Context, Reassurance & Direct Contacts */}
            <Col xs={24} lg={11}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 14px',
                  background: '#eaf2ff',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  borderRadius: 999,
                  marginBottom: 18,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Get in touch
                </span>
              </div>

              <Typography.Title
                level={2}
                style={{
                  color: '#0c0d10',
                  fontSize: isMobile ? 30 : 42,
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.15,
                  margin: '0 0 16px',
                }}
              >
                Let’s talk about growing your customer conversations.
              </Typography.Title>

              <Typography.Paragraph
                style={{
                  color: '#5b5f6b',
                  fontSize: isMobile ? 15 : 16,
                  lineHeight: 1.6,
                  margin: '0 0 32px',
                  fontWeight: 400,
                }}
              >
                Have questions about custom plans, installation, or high-volume stores?
                Send us a note and our team will get back to you within a few hours.
              </Typography.Paragraph>

              {/* Direct Info without boxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 18 }}>
                {/* 1. Direct Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      Direct Email
                    </div>
                    <a
                      href="mailto:chatral.official@gmail.com"
                      style={{ fontSize: 15.5, fontWeight: 600, color: '#0f172a', textDecoration: 'none', transition: 'color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                    >
                      chatral.official@gmail.com
                    </a>
                  </div>
                </div>

                {/* 2. Response Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      Response Time
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: '#0f172a' }}>
                      24/7 Priority Support
                    </div>
                  </div>
                </div>

                {/* 3. Setup Support */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      Setup Support
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: '#0f172a' }}>
                      1-on-1 Setup Support
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right Column: Clean, Interactive Contact Form Card */}
            <Col xs={24} lg={13}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #dbeafe',
                  borderRadius: 24,
                  padding: isMobile ? '32px 20px' : '44px 38px',
                  boxShadow: '0 20px 48px -12px rgba(37, 99, 235, 0.14)',
                  position: 'relative',
                }}
              >
                {contactSubmitted ? (
                  <div style={{ textAlign: 'center', padding: '36px 12px' }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#dcfce7',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 26,
                        margin: '0 auto 18px',
                      }}
                    >
                      ✓
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0c0d10', marginBottom: 8 }}>
                      Message sent successfully!
                    </h3>
                    <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.5, maxWidth: 380, margin: '0 auto 24px' }}>
                      Thank you for reaching out. A Chatral team member will get back to you at your email address shortly.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="btn-brand-secondary"
                      style={{ padding: '10px 22px', fontSize: 14, height: 40 }}
                    >
                      <RollText text="Send another message" secondaryColor="#1d4ed8" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit}>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Full Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        id="contact-name-input"
                        type="text"
                        required
                        placeholder="John Doe"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: 14,
                          fontFamily: 'inherit',
                          outline: 'none',
                          transition: 'all 0.18s ease',
                          color: '#0f172a',
                        }}
                        onFocus={(e) => {
                          e.target.style.background = '#ffffff';
                          e.target.style.borderColor = '#2563eb';
                          e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = '#f8fafc';
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                          Email Address <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="john@example.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: 10,
                            border: '1.5px solid #e2e8f0',
                            background: '#f8fafc',
                            fontSize: 14,
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'all 0.18s ease',
                            color: '#0f172a',
                          }}
                          onFocus={(e) => {
                            e.target.style.background = '#ffffff';
                            e.target.style.borderColor = '#2563eb';
                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                          Company / Website (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="acme.com"
                          value={contactForm.company}
                          onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: 10,
                            border: '1.5px solid #e2e8f0',
                            background: '#f8fafc',
                            fontSize: 14,
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'all 0.18s ease',
                            color: '#0f172a',
                          }}
                          onFocus={(e) => {
                            e.target.style.background = '#ffffff';
                            e.target.style.borderColor = '#2563eb';
                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Topic / Purpose Selection using CustomSelect */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        What can we help you with?
                      </label>
                      <CustomSelect
                        value={contactForm.topic}
                        onChange={(val) => setContactForm({ ...contactForm, topic: val })}
                        options={[
                          'Schedule a Live Demo',
                          'Custom Plan & Pricing',
                          'Shopify & Integration Setup',
                          'General Support',
                        ]}
                      />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Your Message <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Tell us what you need help with..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: 14,
                          fontFamily: 'inherit',
                          outline: 'none',
                          transition: 'all 0.18s ease',
                          color: '#0f172a',
                          resize: 'vertical',
                        }}
                        onFocus={(e) => {
                          e.target.style.background = '#ffffff';
                          e.target.style.borderColor = '#2563eb';
                          e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = '#f8fafc';
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contactSubmitting}
                      className="btn-brand-primary"
                      style={{
                        width: '100%',
                        padding: '13px 28px',
                        height: 48,
                        fontSize: 15,
                        borderRadius: 12,
                        fontFamily: 'inherit',
                      }}
                    >
                      <RollText text={contactSubmitting ? 'Sending...' : 'Send Message'} />
                      <svg className="btn-arrow-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  </form>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 10. Relatik Signature Footer with Official Chatral Logo - Spacious & Interactive */}
      <footer
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
          borderTop: '1px solid #eef2f6',
          padding: isMobile ? '64px 20px 40px' : '96px 32px 52px',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          {/* Top Row: Brand on Left, 3 Nav Columns on Right */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: isMobile ? 40 : 64,
            }}
          >
            {/* Left Column: Official Chatral Brand Logo + Tagline + Live System Status */}
            <div style={{ maxWidth: 360 }}>
              <a href="/" onClick={handleLogoClick} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}>
                <ChatralFullLogo height={isMobile ? 32 : 38} dark={false} />
              </a>
              <div style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.6, marginTop: 18 }}>
                The calm, fast customer messaging and live chat platform built for teams that care about relationships.
              </div>
            </div>

            {/* Right Group: Product, Company, Legal Columns */}
            <div
              style={{
                display: 'flex',
                gap: isMobile ? 40 : 96,
                flexWrap: 'wrap',
              }}
            >
              {/* Product */}
              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>
                  Product
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <a onClick={() => scrollTo('features')} className="footer-nav-link">
                    Features
                  </a>
                  <a onClick={() => scrollTo('how-it-works')} className="footer-nav-link">
                    How it works
                  </a>
                  <a onClick={() => scrollTo('pricing')} className="footer-nav-link">
                    Pricing
                  </a>
                </div>
              </div>

              {/* Company */}
              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>
                  Company
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <a onClick={() => scrollTo('testimonials')} className="footer-nav-link">
                    Testimonials
                  </a>
                  <a onClick={() => scrollTo('faq')} className="footer-nav-link">
                    FAQ
                  </a>
                  <a onClick={() => scrollTo('contact')} className="footer-nav-link">
                    Contact us
                  </a>
                </div>
              </div>

              {/* Legal */}
              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>
                  Legal
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <Link to="/privacy" className="footer-nav-link">
                    Privacy policy
                  </Link>
                  <Link to="/terms" className="footer-nav-link">
                    Terms of service
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Divider */}
          <div style={{ borderTop: '1px solid #eef2f6', margin: '52px 0 28px' }} />

          {/* Bottom Copyright, Back to Top, and Social Icons */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: 18,
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 400 }}>
              &copy; {new Date().getFullYear()} Chatral. All rights reserved. • Built for high-growth modern teams.
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              {/* Back to top button */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.15s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                Back to top ↑
              </button>

              {/* Social Icons (Instagram and LinkedIn) - Perfectly Matched Size & Stroke */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  style={{
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#f1f5f9',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#e1306c';
                    e.currentTarget.style.background = '#fdf2f8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>

                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  style={{
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#f1f5f9',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0a66c2';
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Callout Pill pointing to the Chatral Live Chat Widget (Desktop Only) */}
      {!isMobile && showWidgetPill && !isWidgetOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={handleOpenLiveWidget}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenLiveWidget()}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 88,
            zIndex: 2147482990,
            background: '#ffffff',
            border: '1.5px solid #2563eb',
            borderRadius: 999,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 10px 28px -4px rgba(15, 23, 42, 0.2), 0 2px 6px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'chatralFloat 3s ease-in-out infinite, pillFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(37, 99, 235, 0.28)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 28px -4px rgba(15, 23, 42, 0.2), 0 2px 6px rgba(0, 0, 0, 0.05)';
          }}
        >
          {/* Pill text */}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
            💬 See Chatral live in action!
          </span>

          {/* Pointing Arrow (Desktop) */}
          {!isMobile && (
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 13, marginLeft: 2 }}>
              →
            </span>
          )}

          {/* Dismiss ✕ Button */}
          <button
            onClick={handleDismissPill}
            aria-label="Dismiss"
            title="Dismiss"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 12,
              padding: '2px 4px',
              marginLeft: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            ✕
          </button>
        </div>,
        document.body
      )}


      {/* Global subtle float, pulse & smooth entrance keyframes */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        section[id] {
          scroll-margin-top: 86px;
        }
        .hero-fade-item-1 {
          animation: heroFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.04s both;
        }
        .hero-fade-item-2 {
          animation: heroFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .hero-fade-item-3 {
          animation: heroFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
        }
        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pillFadeIn {
          from {
            opacity: 0;
            transform: translateX(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes chatralFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes chatralPing {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
