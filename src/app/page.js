"use client";

import { useState, useEffect, useCallback } from "react";
import AddProductsForm from "@/components/Products/AddProductsForm";
import Inventory from "@/components/ProductList/Inventory";
import AdminOrdersPage from "@/components/Admin/AdminOrderPage";
import AddBlogs from "@/components/Admin/blog/AddBlogs";
import AdminCommentsDashboard from "@/components/Admin/AdminCommentsDashboard";
import AdminShippingSettings from "@/components/Admin/AdminShippingSettings";
import CheckoutAnalytics from "@/components/Admin/CheckoutAnalytics";
import AdminAnalyticsPage from "./analytics/page";

/* ---------------------------------------------------------------
   TAB DEFINITIONS
--------------------------------------------------------------- */
const TABS = [
  { id: "orders",    icon: "📋", label: "Orders",             component: AdminOrdersPage },
  { id: "products",  icon: "🌱", label: "Add Products",       component: AddProductsForm },
  { id: "inventory", icon: "📦", label: "Dense Inventory",    component: Inventory },
  { id: "analytics", icon: "📊", label: "Checkout Analytics", component: CheckoutAnalytics },
  { id: "sessions",  icon: "👣", label: "Session Journeys",   component: AdminAnalyticsPage },
  { id: "blogs",     icon: "✍️", label: "Blogs",              component: AddBlogs },
  { id: "comments",  icon: "💬", label: "Comments",           component: AdminCommentsDashboard },
  { id: "shipping",  icon: "🚚", label: "Shipping Config",    component: AdminShippingSettings },
];

/* ---------------------------------------------------------------
   ROOT COMPONENT
--------------------------------------------------------------- */
export default function AdminPortal() {
  const [password,     setPassword]     = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab,    setActiveTab]    = useState("orders");
  const [authError,    setAuthError]    = useState("");
  const [isClient,     setIsClient]     = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false); // mobile drawer
  const [tabLoading,   setTabLoading]   = useState(false);  // tab-switch shimmer

  /* ── init ── */
  useEffect(() => {
    setIsClient(true);
    if (sessionStorage.getItem("admin_auth") === "true") setIsAuthorized(true);
  }, []);

  /* ── close sidebar when user picks a tab on mobile ── */
  const handleTabClick = useCallback((id) => {
    if (id === activeTab) return;          // same tab, skip
    setSidebarOpen(false);
    setTabLoading(true);
    // brief loading shimmer, then swap component
    setTimeout(() => {
      setActiveTab(id);
      setTabLoading(false);
    }, 280);
  }, [activeTab]);

  /* ── close drawer on outside click ── */
  useEffect(() => {
    if (!sidebarOpen) return;
    const close = (e) => {
      if (!e.target.closest(".sidebar") && !e.target.closest(".hamburger-btn")) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [sidebarOpen]);

  /* ── auth ── */
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "romeoPistol") {
      setIsAuthorized(true);
      setAuthError("");
      sessionStorage.setItem("admin_auth", "true");
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("admin_auth");
  };

  if (!isClient) return null;

  /* ================================================================
     LOGIN SCREEN
  ================================================================ */
  if (!isAuthorized) {
    return (
      <div className="login-bg">
        {/* Floating orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        <form onSubmit={handleLogin} className="login-card">
          <div className="login-logo">🌱</div>
          <h1 className="login-title">Happy Greenery</h1>
          <p className="login-subtitle">Admin Control Panel</p>

          <div className="login-field">
            <label className="field-label" htmlFor="admin-pw">
              Password
            </label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="admin-pw"
                type="password"
                placeholder="Enter admin password…"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
                autoFocus
              />
            </div>
          </div>

          {authError && (
            <div className="login-error">
              <span>⚠️</span> {authError}
            </div>
          )}

          <button type="submit" className="login-btn">
            Authenticate →
          </button>

          <p className="login-footer">Secure access — Green World Admin</p>
        </form>

        <style jsx>{`
          .login-bg {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(ellipse at 60% 40%, #0a1f14 0%, #050b07 70%, #000 100%);
            padding: 20px;
            position: relative;
            overflow: hidden;
          }
          .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
          }
          .orb-1 {
            width: 400px;
            height: 400px;
            background: rgba(16, 185, 129, 0.08);
            top: -100px;
            right: -80px;
          }
          .orb-2 {
            width: 300px;
            height: 300px;
            background: rgba(16, 185, 129, 0.05);
            bottom: -80px;
            left: -60px;
          }

          /* --- Card --- */
          .login-card {
            position: relative;
            z-index: 1;
            background: rgba(17, 24, 39, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            padding: 44px 40px 36px;
            border-radius: 24px;
            width: 100%;
            max-width: 420px;
            text-align: center;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.08) inset;
            animation: loginAppear 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes loginAppear {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)   scale(1); }
          }

          .login-logo {
            font-size: 3.2rem;
            margin-bottom: 16px;
            animation: pulse 2.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.07); }
          }

          .login-title {
            font-size: 1.9rem;
            font-weight: 800;
            color: #10b981;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
          }
          .login-subtitle {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 32px;
            letter-spacing: 0.02em;
          }

          /* --- Input --- */
          .login-field { margin-bottom: 16px; text-align: left; }
          .field-label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #9ca3af;
            margin-bottom: 8px;
          }
          .input-wrap {
            position: relative;
          }
          .input-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 15px;
            line-height: 1;
            pointer-events: none;
          }
          .login-input {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #f3f4f6;
            padding: 14px 14px 14px 44px;
            border-radius: 12px;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.25s, box-shadow 0.25s;
          }
          .login-input::placeholder { color: #4b5563; }
          .login-input:focus {
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
          }

          /* --- Error --- */
          .login-error {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            color: #f87171;
            font-size: 0.85rem;
            font-weight: 500;
            padding: 10px 14px;
            border-radius: 10px;
            margin-bottom: 16px;
            text-align: left;
          }

          /* --- Button --- */
          .login-btn {
            width: 100%;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #fff;
            border: none;
            padding: 15px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            letter-spacing: 0.02em;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
            margin-top: 8px;
          }
          .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
          }
          .login-btn:active { transform: translateY(0); }

          .login-footer {
            font-size: 0.75rem;
            color: #374151;
            margin-top: 20px;
            letter-spacing: 0.04em;
          }

          @media (max-width: 480px) {
            .login-card { padding: 32px 24px 28px; }
            .login-title { font-size: 1.6rem; }
          }
        `}</style>
      </div>
    );
  }

  /* ================================================================
     DASHBOARD LAYOUT
  ================================================================ */
  const activeTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];
  const ActiveComponent = activeTabDef.component;

  return (
    <div className="dash">
      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div className="mob-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        {/* Brand */}
        <div className="sb-brand">
          <span className="sb-logo">🌱</span>
          <div className="sb-brand-text">
            <span className="sb-title">Happy Greenery</span>
            <span className="sb-role">Store Administration</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          <span className="sb-section-label">Navigation</span>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`sb-item ${activeTab === tab.id ? "sb-item--active" : ""}`}
            >
              <span className="sb-item-icon">{tab.icon}</span>
              <span className="sb-item-label">{tab.label}</span>
              {activeTab === tab.id && <span className="sb-item-dot" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-user">
            <span className="sb-user-av">👤</span>
            <div className="sb-user-info">
              <span className="sb-user-name">Admin</span>
              <span className="sb-user-email">admin@greenworld.in</span>
            </div>
          </div>
          <button onClick={handleLogout} className="sb-logout">
            <span>🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="main">
        {/* Top header bar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Hamburger (mobile only) */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span className={`hb-line ${sidebarOpen ? "hb-line--open1" : ""}`} />
              <span className={`hb-line ${sidebarOpen ? "hb-line--open2" : ""}`} />
              <span className={`hb-line ${sidebarOpen ? "hb-line--open3" : ""}`} />
            </button>

            <div className="topbar-page-info">
              <span className="topbar-icon">{activeTabDef.icon}</span>
              <div>
                <h1 className="topbar-title">{activeTabDef.label}</h1>
                <p className="topbar-subtitle">Direct MongoDB Access</p>
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <span className="topbar-badge">🟢 Live</span>
            <button className="topbar-logout-mobile" onClick={handleLogout} title="Log out">🚪</button>
          </div>
        </header>

        {/* Page body */}
        <div className="main-body">
          {tabLoading ? (
            <div className="tab-loading-wrap">
              <div className="tab-spinner" />
              <p className="tab-loading-msg">Loading {activeTabDef.label}...</p>
            </div>
          ) : (
            <ActiveComponent />
          )}
        </div>
      </main>

      <style jsx>{`
        /* ── Layout Shell ── */
        .dash {
          display: flex;
          min-height: 100vh;
          background: var(--bg, #080d14);
          position: relative;
        }

        /* ── Backdrop (mobile) ── */
        .mob-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(3px);
          z-index: 39;
        }

        /* ══════ SIDEBAR ══════ */
        .sidebar {
          width: 260px;
          background: var(--sidebar-bg, #0d1117);
          border-right: 1px solid var(--border-color, rgba(255,255,255,0.07));
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 40;
          overflow-y: auto;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Brand */
        .sb-brand {
          padding: 22px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07));
          flex-shrink: 0;
        }
        .sb-logo { font-size: 2rem; flex-shrink: 0; }
        .sb-brand-text {
          display: flex;
          flex-direction: column;
        }
        .sb-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f3f4f6;
          line-height: 1.2;
        }
        .sb-role {
          font-size: 0.65rem;
          font-weight: 700;
          color: #10b981;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 2px;
        }

        /* Nav */
        .sb-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          overflow-y: auto;
        }
        .sb-section-label {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #4b5563;
          padding: 0 8px;
          margin-bottom: 8px;
          display: block;
        }
        .sb-item {
          position: relative;
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          color: #9ca3af;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sb-item:hover {
          background: rgba(255,255,255,0.05);
          color: #e5e7eb;
        }
        .sb-item--active {
          background: linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08));
          color: #10b981 !important;
          font-weight: 700;
          border: 1px solid rgba(16,185,129,0.25);
          box-shadow: 0 2px 10px rgba(16,185,129,0.1);
        }
        .sb-item-icon { font-size: 1rem; flex-shrink: 0; }
        .sb-item-label { flex: 1; }
        .sb-item-dot {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Footer */
        .sb-footer {
          padding: 16px 12px;
          border-top: 1px solid var(--border-color, rgba(255,255,255,0.07));
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-shrink: 0;
        }
        .sb-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          border: 1px solid var(--border-color, rgba(255,255,255,0.07));
        }
        .sb-user-av {
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .sb-user-info { display: flex; flex-direction: column; overflow: hidden; }
        .sb-user-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #e5e7eb;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-user-email {
          font-size: 0.7rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-logout {
          width: 100%;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }
        .sb-logout:hover {
          background: #ef4444;
          color: #fff;
          border-color: #ef4444;
        }

        /* ══════ TOPBAR ══════ */
        .topbar {
          background: var(--sidebar-bg, #0d1117);
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.07));
          padding: 0 28px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(12px);
        }
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .topbar-page-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .topbar-icon { font-size: 1.4rem; }
        .topbar-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #f3f4f6;
          margin: 0;
          line-height: 1.2;
        }
        .topbar-subtitle {
          font-size: 0.72rem;
          color: #6b7280;
          margin: 0;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .topbar-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.04em;
        }

        /* ── Hamburger ── */
        .hamburger-btn {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .hamburger-btn:hover { background: rgba(255,255,255,0.05); }
        .hb-line {
          display: block;
          width: 22px;
          height: 2px;
          background: #9ca3af;
          border-radius: 2px;
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center;
        }
        .hb-line--open1 { transform: translateY(7px) rotate(45deg); background: #10b981; }
        .hb-line--open2 { opacity: 0; transform: scaleX(0); }
        .hb-line--open3 { transform: translateY(-7px) rotate(-45deg); background: #10b981; }

        .topbar-logout-mobile {
          display: none;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }
        .topbar-logout-mobile:hover {
          background: #ef4444;
          color: #fff;
        }

        /* ══════ MAIN ══════ */
        .main {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 100vh;
        }
        .main-body {
          flex: 1;
          padding: 28px;
          overflow-y: auto;
        }

        /* ══════ RESPONSIVE ══════ */
        @media (max-width: 991px) {
          /* Sidebar becomes a drawer on mobile */
          .sidebar {
            transform: translateX(-100%);
            box-shadow: none;
          }
          .sidebar--open {
            transform: translateX(0);
            box-shadow: 4px 0 40px rgba(0,0,0,0.6);
          }
          .mob-backdrop { display: block; }
          .hamburger-btn { display: flex; }
          .topbar-logout-mobile { display: flex; align-items: center; }
          .topbar-badge { display: none; }

          /* Main takes full width */
          .main { margin-left: 0; }
          .topbar { padding: 0 16px; }
          .main-body { padding: 20px 16px; }
        }

        @media (max-width: 480px) {
          .topbar-subtitle { display: none; }
          .topbar-icon { font-size: 1.2rem; }
          .topbar-title { font-size: 0.95rem; }
          .main-body { padding: 16px 12px; }
        }

        /* ══════ TAB LOADING OVERLAY ══════ */
        .tab-loading-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 20px;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tab-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(16, 185, 129, 0.15);
          border-top: 3px solid #10b981;
          border-radius: 50%;
          animation: tab-spin 0.75s linear infinite;
        }
        @keyframes tab-spin {
          to { transform: rotate(360deg); }
        }
        .tab-loading-msg {
          color: #6b7280;
          font-size: 0.9rem;
          font-weight: 500;
          margin: 0;
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
}
