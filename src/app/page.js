"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AddProductsForm from "@/components/Products/AddProductsForm";
import Inventory from "@/components/ProductList/Inventory";
import AdminOrdersPage from "@/components/Admin/AdminOrderPage";
import AddBlogs from "@/components/Admin/blog/AddBlogs";
import AdminCommentsDashboard from "@/components/Admin/AdminCommentsDashboard";
import AdminShippingSettings from "@/components/Admin/AdminShippingSettings";
import CheckoutAnalytics from "@/components/Admin/CheckoutAnalytics";
import AdminAnalyticsPage from "./analytics/page";
import {
  FiShoppingBag, FiPlusCircle, FiGrid, FiBarChart2,
  FiActivity, FiEdit3, FiMessageSquare, FiTruck,
  FiMenu, FiX, FiLogOut, FiUser,
} from "react-icons/fi";
import { MdSpa } from "react-icons/md";

/* ---------------------------------------------------------------
   TAB DEFINITIONS
--------------------------------------------------------------- */
const TABS = [
  { id: "orders",    Icon: FiShoppingBag,  label: "Orders" },
  { id: "products",  Icon: FiPlusCircle,   label: "Add Products" },
  { id: "inventory", Icon: FiGrid,         label: "Inventory" },
  { id: "analytics", Icon: FiBarChart2,    label: "Checkout Analytics" },
  { id: "sessions",  Icon: FiActivity,     label: "Session Journeys" },
  { id: "blogs",     Icon: FiEdit3,        label: "Blogs" },
  { id: "comments",  Icon: FiMessageSquare,label: "Comments" },
  { id: "shipping",  Icon: FiTruck,        label: "Shipping Config" },
];

const TAB_COMPONENTS = {
  orders:    AdminOrdersPage,
  products:  AddProductsForm,
  inventory: Inventory,
  analytics: CheckoutAnalytics,
  sessions:  AdminAnalyticsPage,
  blogs:     AddBlogs,
  comments:  AdminCommentsDashboard,
  shipping:  AdminShippingSettings,
};

/* ---------------------------------------------------------------
   AUDIO NOTIFICATION UTILITY (Web Audio API)
--------------------------------------------------------------- */
const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    // First tone (higher pitch, shorter decay)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.2);
    
    // Second tone (slightly delayed, lower pitch, longer decay)
    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1320, audioCtx.currentTime); // E6 note
        gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    }, 100);
  } catch (e) {
    console.error("AudioContext initialization failed:", e);
  }
};

/* ---------------------------------------------------------------
   ROOT COMPONENT
--------------------------------------------------------------- */
export default function AdminPortal() {
  const [password,     setPassword]     = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab,    setActiveTab]    = useState("orders");
  const [authError,    setAuthError]    = useState("");
  const [isClient,     setIsClient]     = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [tabLoading,   setTabLoading]   = useState(false);  // tab-switch shimmer

  // --- NOTIFICATION & TOAST STATES ---
  const [toasts, setToasts] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({
    orders: 0,
    analytics: 0,
    sessions: 0,
    comments: 0,
    inventory: 0
  });

  // Track baseline loaded status so we don't notify for existing data on load
  const [baselineLoaded, setBaselineLoaded] = useState(false);

  // Refs to store latest item identifiers or lists
  const lastOrderIdRef = useRef(null);
  const lastCheckoutIdRef = useRef(null);
  const lastSessionIdRef = useRef(null);
  const lastCommentIdRef = useRef(null);
  const lastProductIdRef = useRef(null);
  const lowStockProductIdsRef = useRef(new Set());

  /* ── init ── */
  useEffect(() => {
    setIsClient(true);
    if (sessionStorage.getItem("admin_auth") === "true") setIsAuthorized(true);

    // Read tab from query parameter first, then fallback to sessionStorage
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    let currentTab = "orders";
    if (urlTab && TABS.some((t) => t.id === urlTab)) {
      currentTab = urlTab;
      setActiveTab(urlTab);
      sessionStorage.setItem("admin_active_tab", urlTab);
    } else {
      const savedTab = sessionStorage.getItem("admin_active_tab");
      if (savedTab && TABS.some((t) => t.id === savedTab)) {
        currentTab = savedTab;
        setActiveTab(savedTab);
      }
    }
    // Clear unread count for the active tab on initial load
    setUnreadCounts(prev => ({
      ...prev,
      [currentTab]: 0
    }));
  }, []);

  /* ── Handle browser Back/Forward navigation ── */
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (urlTab && TABS.some((t) => t.id === urlTab)) {
        setActiveTab(urlTab);
        setUnreadCounts(prev => ({
          ...prev,
          [urlTab]: 0
        }));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /* ── BROWSER TITLE FLASHING ── */
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    if (totalUnread === 0) {
      document.title = "Happy Greenery Admin";
      return;
    }

    let isAlternate = false;
    const interval = setInterval(() => {
      if (isAlternate) {
        document.title = "Happy Greenery Admin";
      } else {
        document.title = `(${totalUnread}) New Activity | Happy Greenery`;
      }
      isAlternate = !isAlternate;
    }, 1500);

    return () => {
      clearInterval(interval);
      document.title = "Happy Greenery Admin";
    };
  }, [unreadCounts]);

  /* ── BACKGROUND POLLING FOR NEW UPDATES ── */
  useEffect(() => {
    if (!isAuthorized) return;

    let isMounted = true;
    let pollInterval = null;

    const triggerNotification = (type, message, tabId) => {
      if (activeTab === tabId) return;

      // Increment count
      setUnreadCounts(prev => ({
        ...prev,
        [tabId]: (prev[tabId] || 0) + 1
      }));

      // Play sound chime
      playChime();

      // Add to toasts list
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, type, message, tabId }]);

      // Auto remove toast after 8 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 8000);
    };

    const runPoll = async () => {
      try {
        const [ordersRes, sessionsRes, commentsRes, productsRes] = await Promise.all([
          fetch(`/api/admin/orders`, {
            credentials: "include",
            headers: { "x-admin-authorization": "romeoPistol" }
          }).then(r => r.json()).catch(() => ({ success: false, orders: [] })),
          
          fetch(`/api/analytics/sessions?page=1&limit=10&type=all`, {
            credentials: "include",
            headers: { "x-admin-authorization": "romeoPistol" }
          }).then(r => r.json()).catch(() => ({ success: false, sessions: [] })),

          fetch(`/api/comments/admin/all`, {
            credentials: "include"
          }).then(r => r.json()).catch(() => []),

          fetch(`/api/products/list?all=true`).then(r => r.json()).catch(() => ({ success: false, products: [] }))
        ]);

        if (!isMounted) return;

        // 1. Process Orders & Checkout Intents
        if (ordersRes && ordersRes.success && ordersRes.orders) {
          const orders = ordersRes.orders;
          if (orders.length > 0) {
            const paidOrders = orders.filter(o => o.status === "PAID");
            const pendingCheckouts = orders.filter(o => o.status === "PENDING" || o.status === "CANCELLED" || o.status === "FAILED");

            const latestPaid = paidOrders[0];
            const latestCheckout = pendingCheckouts[0];

            if (baselineLoaded) {
              // Check for new paid order
              if (latestPaid && lastOrderIdRef.current && latestPaid._id !== lastOrderIdRef.current) {
                const lastSeenIndex = paidOrders.findIndex(o => o._id === lastOrderIdRef.current);
                const newPaidCount = lastSeenIndex === -1 ? 1 : lastSeenIndex;
                for (let i = newPaidCount - 1; i >= 0; i--) {
                  const o = paidOrders[i];
                  triggerNotification(
                    "order",
                    `🛒 New Order! ${o.address?.fullName || "Customer"} placed an order of ₹${o.totalAmount}`,
                    "orders"
                  );
                }
              }

              // Check for new checkout intent
              if (latestCheckout && lastCheckoutIdRef.current && latestCheckout._id !== lastCheckoutIdRef.current) {
                const lastSeenIndex = pendingCheckouts.findIndex(o => o._id === lastCheckoutIdRef.current);
                const newCheckoutCount = lastSeenIndex === -1 ? 1 : lastSeenIndex;
                for (let i = newCheckoutCount - 1; i >= 0; i--) {
                  const o = pendingCheckouts[i];
                  triggerNotification(
                    "checkout",
                    `💳 New Checkout! ${o.address?.fullName || "Guest"} started checkout of ₹${o.totalAmount}`,
                    "analytics"
                  );
                }
              }
            }

            if (latestPaid) lastOrderIdRef.current = latestPaid._id;
            if (latestCheckout) lastCheckoutIdRef.current = latestCheckout._id;
          }
        }

        // 2. Process Sessions
        if (sessionsRes && sessionsRes.success && sessionsRes.sessions) {
          const sessions = sessionsRes.sessions;
          if (sessions.length > 0) {
            const latestSession = sessions[0];
            if (baselineLoaded) {
              if (latestSession && lastSessionIdRef.current && latestSession.sessionId !== lastSessionIdRef.current) {
                const lastSeenIndex = sessions.findIndex(s => s.sessionId === lastSessionIdRef.current);
                const newSessionCount = lastSeenIndex === -1 ? 1 : lastSeenIndex;
                for (let i = newSessionCount - 1; i >= 0; i--) {
                  const s = sessions[i];
                  const name = s.userId?.name || `Guest (...${s.deviceId.slice(-6)})`;
                  triggerNotification(
                    "session",
                    `🧭 Live Session! ${name} is browsing the store`,
                    "sessions"
                  );
                }
              }
            }
            if (latestSession) lastSessionIdRef.current = latestSession.sessionId;
          }
        }

        // 3. Process Comments
        if (commentsRes && Array.isArray(commentsRes)) {
          if (commentsRes.length > 0) {
            const latestComment = commentsRes[0];
            if (baselineLoaded) {
              if (latestComment && lastCommentIdRef.current && latestComment._id !== lastCommentIdRef.current) {
                const lastSeenIndex = commentsRes.findIndex(c => c._id === lastCommentIdRef.current);
                const newCommentCount = lastSeenIndex === -1 ? 1 : lastSeenIndex;
                for (let i = newCommentCount - 1; i >= 0; i--) {
                  const c = commentsRes[i];
                  const name = c.user?.name || "Someone";
                  triggerNotification(
                    "comment",
                    `💬 New Comment! ${name} commented on a blog post`,
                    "comments"
                  );
                }
              }
            }
            if (latestComment) lastCommentIdRef.current = latestComment._id;
          }
        }

        // 4. Process Products (Inventory)
        if (productsRes && productsRes.success && productsRes.products) {
          const products = productsRes.products;
          if (products.length > 0) {
            const latestProduct = products[0];

            if (baselineLoaded) {
              // Check for new product
              if (latestProduct && lastProductIdRef.current && latestProduct._id !== lastProductIdRef.current) {
                const lastSeenIndex = products.findIndex(p => p._id === lastProductIdRef.current);
                const newProductCount = lastSeenIndex === -1 ? 1 : lastSeenIndex;
                for (let i = newProductCount - 1; i >= 0; i--) {
                  const p = products[i];
                  triggerNotification(
                    "product",
                    `🌿 New Product! "${p.name}" has been added to catalog`,
                    "inventory"
                  );
                }
              }

              // Check low stock
              products.forEach(p => {
                const qty = Number(p.quantity || 0);
                const isLowStock = qty < 5 && p.inStock;
                const wasLowStock = lowStockProductIdsRef.current.has(p._id);

                if (isLowStock && !wasLowStock) {
                  triggerNotification(
                    "inventory_low",
                    `⚠️ Low Stock! "${p.name}" has only ${qty} left`,
                    "inventory"
                  );
                  lowStockProductIdsRef.current.add(p._id);
                } else if (!isLowStock && wasLowStock) {
                  lowStockProductIdsRef.current.delete(p._id);
                }
              });
            } else {
              products.forEach(p => {
                const qty = Number(p.quantity || 0);
                if (qty < 5 && p.inStock) {
                  lowStockProductIdsRef.current.add(p._id);
                }
              });
            }

            if (latestProduct) lastProductIdRef.current = latestProduct._id;
          }
        }

        if (!baselineLoaded) {
          setBaselineLoaded(true);
        }
      } catch (err) {
        console.error("Background polling error:", err);
      }
    };

    runPoll();
    pollInterval = setInterval(runPoll, 12000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isAuthorized, baselineLoaded, activeTab]);

  /* ── close sidebar when user picks a tab on mobile ── */
  const handleTabClick = useCallback((id) => {
    if (id === activeTab) return;          // same tab, skip
    setSidebarOpen(false);
    setTabLoading(true);

    // Clear unread count
    setUnreadCounts(prev => ({
      ...prev,
      [id]: 0
    }));

    // brief loading shimmer, then swap component
    setTimeout(() => {
      setActiveTab(id);
      sessionStorage.setItem("admin_active_tab", id);

      // Update URL search parameters
      const url = new URL(window.location.href);
      url.searchParams.set("tab", id);
      window.history.pushState({}, "", url.toString());

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

      // Set URL search parameter on successful login
      const url = new URL(window.location.href);
      url.searchParams.set("tab", activeTab);
      window.history.pushState({}, "", url.toString());
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_active_tab");

    // Clear URL search parameter on logout
    const url = new URL(window.location.href);
    url.searchParams.delete("tab");
    window.history.pushState({}, "", url.pathname);

    setActiveTab("orders");
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
          <div className="login-logo"><MdSpa style={{color:'#10b981',fontSize:'3.5rem'}} /></div>
          <h1 className="login-title">Happy Greenery</h1>
          <p className="login-subtitle">Admin Control Panel</p>

          <div className="login-field">
            <label className="field-label" htmlFor="admin-pw">
              Password
            </label>
            <div className="input-wrap">
              <span className="input-icon" style={{display:'flex',alignItems:'center',color:'#6b7280'}}>🔒</span>
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
              <span style={{display:'flex'}}>⚠️</span> {authError}
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
  const ActiveComponent = TAB_COMPONENTS[activeTab] || TAB_COMPONENTS.orders;

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
          <span className="sb-logo"><MdSpa /></span>
          <div className="sb-brand-text">
            <span className="sb-title">Happy Greenery</span>
            <span className="sb-role">Store Administration</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          <span className="sb-section-label">Navigation</span>
          {TABS.map((tab) => {
            const TabIcon = tab.Icon;
            const count = unreadCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`sb-item ${activeTab === tab.id ? "sb-item--active" : ""}`}
              >
                <span className="sb-item-icon"><TabIcon size={16} /></span>
                <span className="sb-item-label">{tab.label}</span>
                {count > 0 && <span className="sb-item-badge">{count}</span>}
                {activeTab === tab.id && <span className="sb-item-dot" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-user">
            <span className="sb-user-av"><FiUser size={20} /></span>
            <div className="sb-user-info">
              <span className="sb-user-name">Admin</span>
              <span className="sb-user-email">admin@greenworld.in</span>
            </div>
          </div>
          <button onClick={handleLogout} className="sb-logout">
            <FiLogOut size={15} /> Log Out
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
              style={{ position: "relative" }}
            >
              {sidebarOpen ? <FiX size={22} color="#10b981" /> : <FiMenu size={22} />}
              {!sidebarOpen && Object.values(unreadCounts).some(c => c > 0) && (
                <span className="hamburger-badge-dot" />
              )}
            </button>

            <div className="topbar-page-info">
              <span className="topbar-icon">
                {(() => { const I = activeTabDef?.Icon; return I ? <I size={22} /> : null; })()}
              </span>
              <div>
                <h1 className="topbar-title">{activeTabDef.label}</h1>
                <p className="topbar-subtitle">Direct MongoDB Access</p>
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <span className="topbar-badge">🟢 Live</span>
            <button className="topbar-logout-mobile" onClick={handleLogout} title="Log out"><FiLogOut size={17} /></button>
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

      {/* ══════════ FLOATING TOAST NOTIFICATIONS ══════════ */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast-card toast-${toast.type}`}
            onClick={() => {
              handleTabClick(toast.tabId);
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }}
          >
            <span className="toast-icon">
              {toast.type === "order" && "🛒"}
              {toast.type === "checkout" && "💳"}
              {toast.type === "session" && "🧭"}
              {toast.type === "comment" && "💬"}
              {toast.type === "product" && "🌿"}
              {toast.type === "inventory_low" && "⚠️"}
            </span>
            <div className="toast-content">
              <span className="toast-title">
                {toast.type === "order" && "New Paid Order"}
                {toast.type === "checkout" && "Checkout Attempt"}
                {toast.type === "session" && "Visitor Journey"}
                {toast.type === "comment" && "New Moderation Comment"}
                {toast.type === "product" && "New Inventory Product"}
                {toast.type === "inventory_low" && "Low Stock Alert"}
              </span>
              <p className="toast-msg">{toast.message}</p>
            </div>
            <button 
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

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
        .sb-logo {
          font-size: 1.6rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          background: rgba(16,185,129,0.12);
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }
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
        .topbar-icon {
          display: flex;
          align-items: center;
          color: #10b981;
          flex-shrink: 0;
        }
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
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s;
          flex-shrink: 0;
          color: #9ca3af;
        }
        .hamburger-btn:hover { background: rgba(255,255,255,0.05); color: #e5e7eb; }

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
          .topbar-logout-mobile { display: flex; align-items: center; justify-content: center; }
          .topbar-badge { display: none; }

          /* Main takes full width */
          .main { margin-left: 0; }
          .topbar { padding: 0 16px; }
          .main-body { padding: 20px 16px; }
        }

        @media (max-width: 480px) {
          .topbar-subtitle { display: none; }
          .topbar-title { font-size: 0.95rem; }
          .main-body { padding: 16px 12px; }
          .sb-user-email { display: none; }
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

        /* ══════ TOAST NOTIFICATIONS ══════ */
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 99999;
          width: 100%;
          max-width: 360px;
          pointer-events: none;
        }

        .toast-card {
          pointer-events: auto;
          background: rgba(17, 24, 39, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.05) inset;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .toast-card:hover {
          transform: translateY(-4px) scale(1.02);
          background: rgba(17, 24, 39, 0.95);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .toast-icon {
          font-size: 1.5rem;
          line-height: 1;
          padding: 8px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Border accents for toast types */
        .toast-order { border-left: 4px solid #10b981; }
        .toast-checkout { border-left: 4px solid #3b82f6; }
        .toast-session { border-left: 4px solid #8b5cf6; }
        .toast-comment { border-left: 4px solid #f59e0b; }
        .toast-product { border-left: 4px solid #06b6d4; }
        .toast-inventory_low { border-left: 4px solid #ef4444; }

        .toast-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .toast-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #f3f4f6;
        }

        .toast-msg {
          font-size: 0.8rem;
          color: #9ca3af;
          margin: 0;
          line-height: 1.4;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: #4b5563;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          line-height: 1;
          transition: all 0.2s;
        }

        .toast-close:hover {
          color: #e5e7eb;
          background: rgba(255, 255, 255, 0.05);
        }

        /* ══════ BADGES & DOTS ══════ */
        .sb-item-badge {
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
          margin-left: auto;
          margin-right: 4px;
          animation: badgePulse 2s infinite;
        }

        @keyframes badgePulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .hamburger-badge-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 1.5px solid var(--sidebar-bg, #0d1117);
        }
      `}</style>
    </div>
  );
}
