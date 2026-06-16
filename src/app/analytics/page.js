"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";

export default function AdminAnalyticsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterType, setFilterType] = useState("all"); // 'all', 'auth', 'anon'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load sessions from API
  const fetchSessions = async (currentPage, currentFilter) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/sessions?page=${currentPage}&limit=10&type=${currentFilter}`,
        { 
          credentials: "include",
          headers: {
            "x-admin-authorization": "romeoPistol",
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load admin sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(page, filterType);
  }, [page, filterType]);

  // Smooth scroll to visualizer on mobile when a session is selected
  useEffect(() => {
    if (selectedSession && typeof window !== "undefined" && window.innerWidth <= 900) {
      setTimeout(() => {
        const visualizer = document.querySelector(".visualizer-panel");
        if (visualizer) {
          visualizer.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [selectedSession]);

  const handleFilterChange = (type) => {
    setFilterType(type);
    setPage(1);
    setSelectedSession(null);
  };

  // Helper to format duration in MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Helper to format timestamps
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Detect browser from User Agent
  const getBrowserName = (ua) => {
    if (!ua) return "Unknown Browser";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("SamsungBrowser")) return "Samsung Browser";
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
    if (ua.includes("Trident")) return "Internet Explorer";
    if (ua.includes("Edge")) return "Microsoft Edge";
    if (ua.includes("Chrome")) return "Google Chrome";
    if (ua.includes("Safari")) return "Apple Safari";
    return "Generic Browser";
  };

  return (
    <div className="analytics-container">
      {/* 🚀 Header */}
      <header className="analytics-header">
        <div className="header-info">
          <h1>User Flow Journey & Interactions</h1>
          <p>Analyze live guest journeys, navigation flows, and conversion metrics in real time.</p>
        </div>
        <div className="analytics-filters">
          <button 
            className={`filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => handleFilterChange("all")}
          >
            👥 All Visitors
          </button>
          <button 
            className={`filter-btn ${filterType === "auth" ? "active" : ""}`}
            onClick={() => handleFilterChange("auth")}
          >
            🔑 Logged In Only
          </button>
          <button 
            className={`filter-btn ${filterType === "anon" ? "active" : ""}`}
            onClick={() => handleFilterChange("anon")}
          >
            🕵️ Anonymous Guests
          </button>
        </div>
      </header>

      {/* 🧩 Dashboard Body */}
      <main className="analytics-body">
        
        {/* 📋 Left Panel: Session Stream */}
        <section className="session-panel">
          <div className="panel-title">
            <h2>Recent Activity Sessions</h2>
            <span className="live-indicator">LIVE</span>
          </div>

          {loading && sessions.length === 0 ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching visitor logs...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <p>No active sessions found matching this filter.</p>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map((session) => {
                const isSelected = selectedSession?.sessionId === session.sessionId;
                const isAuth = !!session.userId;
                return (
                  <div 
                    key={session.sessionId}
                    className={`session-card ${isSelected ? "selected" : ""} ${isAuth ? "auth-card" : "anon-card"}`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="card-top">
                      <div className="user-profile">
                        {isAuth ? (
                          <>
                            <img 
                              src={session.userId.image || "https://avatar.iran.liara.run/public/30"} 
                              alt="Avatar" 
                              className="user-avatar"
                            />
                            <div className="user-details">
                              <span className="user-name">{session.userId.name}</span>
                              <span className="user-email">{session.userId.email}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="guest-avatar">🕵️</div>
                            <div className="user-details">
                              <span className="guest-name">Guest Browser</span>
                              <span className="guest-id">ID: ...{session.deviceId.slice(-8)}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <span className={`badge ${isAuth ? "badge-auth" : "badge-anon"}`}>
                        {isAuth ? "Registered" : "Guest"}
                      </span>
                    </div>

                    <div className="card-meta">
                      <span className="meta-item">⏱️ {formatDuration(session.totalDuration)}</span>
                      <span className="meta-item">🌐 {getBrowserName(session.userAgent)}</span>
                      <span className="meta-item">🎯 {session.events?.length || 0} events</span>
                    </div>

                    <div className="card-footer">
                      <span>{formatDate(session.startedAt)} at {formatTime(session.startedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 🔘 Pagination */}
          <div className="pagination">
            <button 
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
              className="page-btn"
            >
              ◀ Prev
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button 
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
              className="page-btn"
            >
              Next ▶
            </button>
          </div>
        </section>

        {/* 🧭 Right Panel: Flow Visualizer */}
        <section className="visualizer-panel">
          {selectedSession ? (
            <div className="timeline-container">
              
              {/* Timeline Header */}
              <div className="timeline-header">
                <div className="timeline-title-area">
                  <h3>Session Journey Flow</h3>
                  <span className="timeline-session-id">Session: {selectedSession.sessionId}</span>
                </div>
                <div className="timeline-summary-metrics">
                  <div className="metric">
                    <span className="metric-val">{formatDuration(selectedSession.totalDuration)}</span>
                    <span className="metric-lbl">Total Time</span>
                  </div>
                  <div className="metric">
                    <span className="metric-val">{selectedSession.events?.filter(e => e.type === "nav").length || 0}</span>
                    <span className="metric-lbl">Pages Opened</span>
                  </div>
                  <div className="metric">
                    <span className="metric-val">{selectedSession.events?.filter(e => e.type === "click").length || 0}</span>
                    <span className="metric-lbl">Action Clicks</span>
                  </div>
                </div>
              </div>

              {/* Chronological Vertical Trail */}
              <div className="timeline-trail">
                
                {/* Session Start Node */}
                <div className="trail-start">
                  <div className="start-pulse"></div>
                  <div className="trail-header-text">
                    <span className="text-primary">Session Initiated</span>
                    <span className="text-secondary">{formatTime(selectedSession.startedAt)}</span>
                  </div>
                </div>

                {/* Trail Steps */}
                <div className="trail-steps">
                  {selectedSession.events && selectedSession.events.length > 0 ? (
                    selectedSession.events.map((event, index) => {
                      const isNav = event.type === "nav";
                      const isAuthConversion = isNav && index > 0 && event.path.includes("google") || (event.label && event.label.includes("Google"));
                      return (
                        <div key={event._id || index} className={`trail-node-container ${isNav ? "node-nav" : "node-click"}`}>
                          
                          {/* Left: Clock */}
                          <div className="node-time">
                            <span>{formatTime(event.timestamp)}</span>
                          </div>

                          {/* Center: Line & Icon */}
                          <div className="node-connector">
                            <div className="connector-line"></div>
                            <div className="node-icon">
                              {isNav ? "🧭" : "🖱️"}
                            </div>
                          </div>

                          {/* Right: Content Card */}
                          <div className="node-content-card">
                            {isNav ? (
                              <>
                                <div className="card-header">
                                  <span className="action-type-badge nav-badge">Page View</span>
                                  {event.duration > 0 && (
                                    <span className="duration-tag">⏱️ Spent {formatDuration(event.duration)}</span>
                                  )}
                                </div>
                                <div className="card-body">
                                  <p className="route-path">{event.path}</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="card-header">
                                  <span className="action-type-badge click-badge">Button / Link Clicked</span>
                                </div>
                                <div className="card-body">
                                  <p className="click-label">“{event.label}”</p>
                                  <span className="click-subtext">on page {event.path}</span>
                                </div>
                              </>
                            )}

                            {/* Milestone Marker for login transitions */}
                            {event.label === "Login with Google" && (
                              <div className="milestone-badge">
                                🔑 <span>Initiated Smart Redirect Authentication flow</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-events">No recorded tracking events in this session.</div>
                  )}

                  {/* Session End Node */}
                  <div className="trail-end-node">
                    <div className="node-time"></div>
                    <div className="node-connector">
                      <div className="connector-line dashed"></div>
                      <div className="end-pulse-node"></div>
                    </div>
                    <div className="node-content-card end-card">
                      <span className="text-primary">Last Updated / Exit Location</span>
                      <span className="text-secondary">Sync complete</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="visualizer-placeholder">
              <div className="pulsing-radar">
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="radar-icon">🌿</div>
              </div>
              <h3>Select a Visitor Session</h3>
              <p>Explore real-time user flow trees, page timing sequences, and action timelines.</p>
            </div>
          )}
        </section>

      </main>

      {/* 🎨 CSS Styles Block (Premium Glassmorphic Design System) */}
      <style jsx global>{`
        .analytics-container {
          background: #0b1511;
          background: radial-gradient(circle at top right, #112d20 0%, #070d0a 70%);
          min-height: 100vh;
          padding: 2.5rem;
          color: #e2f0e9;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          --time-width: 80px;
          --connector-width: 40px;
        }

        /* 🚀 Header styles */
        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(18, 38, 29, 0.45);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(46, 117, 81, 0.2);
          border-radius: 16px;
          padding: 1.5rem 2rem;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .header-info h1 {
          font-size: 1.8rem;
          font-weight: 800;
          color: #4ade80;
          margin: 0 0 0.4rem 0;
          letter-spacing: -0.025em;
        }
        .header-info p {
          color: #92bfa6;
          margin: 0;
          font-size: 0.95rem;
        }
        .analytics-filters {
          display: flex;
          gap: 0.75rem;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.4rem;
          border-radius: 12px;
          border: 1px solid rgba(46, 117, 81, 0.15);
        }
        .filter-btn {
          background: transparent;
          border: none;
          color: #92bfa6;
          padding: 0.6rem 1.1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .filter-btn:hover {
          color: #4ade80;
          background: rgba(46, 117, 81, 0.1);
        }
        .filter-btn.active {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        }

        /* 🧩 Body Layout */
        .analytics-body {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 2rem;
          height: calc(100vh - 180px);
          min-height: 500px;
        }

        /* 📋 Left Panel Stream */
        .session-panel {
          background: rgba(18, 38, 29, 0.35);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(46, 117, 81, 0.15);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        .panel-title {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(46, 117, 81, 0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .panel-title h2 {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          color: #e2f0e9;
        }
        .live-indicator {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          letter-spacing: 0.1em;
          border: 1px solid rgba(239, 68, 68, 0.3);
          animation: blink 2s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .sessions-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .sessions-list::-webkit-scrollbar {
          width: 6px;
        }
        .sessions-list::-webkit-scrollbar-thumb {
          background: rgba(46, 117, 81, 0.3);
          border-radius: 3px;
        }

        /* Card styles */
        .session-card {
          background: rgba(10, 20, 15, 0.5);
          border: 1px solid rgba(46, 117, 81, 0.1);
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .session-card:hover {
          transform: translateY(-2px);
          border-color: rgba(74, 222, 128, 0.4);
          background: rgba(18, 38, 29, 0.5);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .session-card.selected {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          overflow: hidden;
        }
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(74, 222, 128, 0.4);
          object-fit: cover;
        }
        .guest-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(46, 117, 81, 0.2);
          border: 1px solid rgba(46, 117, 81, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .user-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .user-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #e2f0e9;
        }
        .user-email {
          font-size: 0.75rem;
          color: #8dae9b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .guest-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #92bfa6;
        }
        .guest-id {
          font-size: 0.75rem;
          color: #6d937d;
          font-family: monospace;
        }
        .badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .badge-auth {
          background: rgba(52, 211, 153, 0.1);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.2);
        }
        .badge-anon {
          background: rgba(156, 163, 175, 0.1);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.2);
        }
        .card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .meta-item {
          font-size: 0.75rem;
          color: #92bfa6;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          border: 1px solid rgba(46, 117, 81, 0.1);
        }
        .card-footer {
          font-size: 0.7rem;
          color: #6d937d;
          text-align: right;
          border-top: 1px solid rgba(46, 117, 81, 0.08);
          padding-top: 0.5rem;
        }

        /* Pagination style */
        .pagination {
          padding: 1rem;
          border-top: 1px solid rgba(46, 117, 81, 0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0,0,0,0.15);
        }
        .page-btn {
          background: rgba(46, 117, 81, 0.15);
          color: #92bfa6;
          border: 1px solid rgba(46, 117, 81, 0.25);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) {
          background: rgba(46, 117, 81, 0.35);
          color: #4ade80;
        }
        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-info {
          font-size: 0.8rem;
          color: #92bfa6;
        }

        /* 🧭 Right Panel Flow Visualizer */
        .visualizer-panel {
          background: rgba(18, 38, 29, 0.25);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(46, 117, 81, 0.15);
          border-radius: 16px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        /* Radar placeholder */
        .visualizer-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }
        .pulsing-radar {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .radar-icon {
          font-size: 2.2rem;
          z-index: 2;
        }
        .ring {
          position: absolute;
          border: 2px solid #10b981;
          border-radius: 50%;
          animation: pulse-ring 3s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
          opacity: 0;
        }
        .ring-1 {
          width: 100%;
          height: 100%;
          animation-delay: 0s;
        }
        .ring-2 {
          width: 100%;
          height: 100%;
          animation-delay: 1s;
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        .visualizer-placeholder h3 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #4ade80;
          margin: 0 0 0.5rem 0;
        }
        .visualizer-placeholder p {
          color: #92bfa6;
          max-width: 320px;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        /* Active Timeline Layout */
        .timeline-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .timeline-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(46, 117, 81, 0.15);
          background: rgba(0,0,0,0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .timeline-title-area h3 {
          margin: 0 0 0.2rem 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: #4ade80;
        }
        .timeline-session-id {
          font-size: 0.75rem;
          color: #6d937d;
          font-family: monospace;
        }
        .timeline-summary-metrics {
          display: flex;
          gap: 1.5rem;
        }
        .metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(0,0,0,0.25);
          padding: 0.4rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(46, 117, 81, 0.15);
          min-width: 90px;
        }
        .metric-val {
          font-size: 1.05rem;
          font-weight: 700;
          color: #e2f0e9;
        }
        .metric-lbl {
          font-size: 0.65rem;
          color: #8dae9b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.1rem;
        }

        .timeline-trail {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }
        .timeline-trail::-webkit-scrollbar {
          width: 6px;
        }
        .timeline-trail::-webkit-scrollbar-thumb {
          background: rgba(46, 117, 81, 0.3);
          border-radius: 3px;
        }

        /* Vertical Chronology Line Draw */
        .trail-start {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-left: calc(var(--time-width) + var(--connector-width) + 0.75rem);
          position: relative;
        }
        .start-pulse {
          width: 14px;
          height: 14px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.25);
          position: absolute;
          left: calc(var(--time-width) + var(--connector-width) / 2);
          transform: translateX(-50%);
          z-index: 2;
        }
        .trail-header-text {
          display: flex;
          flex-direction: column;
        }
        .text-primary {
          font-weight: 700;
          font-size: 0.95rem;
          color: #4ade80;
        }
        .text-secondary {
          font-size: 0.75rem;
          color: #6d937d;
        }

        .trail-steps {
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .trail-node-container {
          display: grid;
          grid-template-columns: var(--time-width) var(--connector-width) 1fr;
          margin-bottom: 0.25rem;
        }
        .node-time {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          font-size: 0.75rem;
          color: #6d937d;
          font-family: monospace;
          padding-right: 0.75rem;
        }
        .node-connector {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .connector-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(46, 117, 81, 0.3);
          z-index: 1;
        }
        .connector-line.dashed {
          background: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 4px,
            rgba(46, 117, 81, 0.4) 4px,
            rgba(46, 117, 81, 0.4) 8px
          );
        }
        .node-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          z-index: 2;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }

        /* Color profiles based on interaction */
        .node-nav .node-icon {
          background: rgba(16, 185, 129, 0.2);
          border: 2px solid #10b981;
          color: #10b981;
        }
        .node-click .node-icon {
          background: rgba(245, 158, 11, 0.2);
          border: 2px solid #f59e0b;
          color: #f59e0b;
        }

        .node-content-card {
          background: rgba(18, 38, 29, 0.3);
          border: 1px solid rgba(46, 117, 81, 0.15);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          margin-left: 0.75rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .action-type-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .nav-badge {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }
        .click-badge {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }
        .duration-tag {
          font-size: 0.75rem;
          color: #4ade80;
          font-weight: 600;
        }
        .route-path {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          font-family: monospace;
          margin: 0;
          word-break: break-all;
        }
        .click-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: #fca5a5;
          margin: 0;
        }
        .click-subtext {
          font-size: 0.75rem;
          color: #8dae9b;
        }

        .milestone-badge {
          margin-top: 0.5rem;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.25);
          color: #fbbf24;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        /* Exit trail details */
        .trail-end-node {
          display: grid;
          grid-template-columns: var(--time-width) var(--connector-width) 1fr;
          margin-top: -0.5rem;
        }
        .end-pulse-node {
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          z-index: 2;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25);
        }
        .end-card {
          background: rgba(30, 20, 20, 0.3);
          border-color: rgba(239, 68, 68, 0.2);
          margin-left: 0.75rem;
        }
        .end-card .text-primary {
          color: #f87171;
          font-weight: 700;
          font-size: 0.85rem;
        }
        .loading-state, .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #92bfa6;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(74, 222, 128, 0.1);
          border-radius: 50%;
          border-top-color: #10b981;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ==========================================================================
           📱 PREMIUM RESPONSIVE MEDIA QUERIES (WOW FACTOR SCREEN ADAPTIVITY)
           ========================================================================= */

        @media (max-width: 1024px) {
          .analytics-container {
            padding: 1.5rem;
            gap: 1.5rem;
          }
          .analytics-body {
            gap: 1.5rem;
          }
        }

        @media (max-width: 900px) {
          .analytics-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1.25rem;
            padding: 1.25rem;
          }
          .header-info {
            text-align: center;
          }
          .header-info h1 {
            font-size: 1.6rem;
          }
          .header-info p {
            font-size: 0.88rem;
          }
          .analytics-filters {
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.5rem;
          }
          .filter-btn {
            flex: 1 1 calc(50% - 0.5rem);
            font-size: 0.8rem;
            padding: 0.5rem 0.75rem;
            justify-content: center;
          }
          .analytics-body {
            grid-template-columns: 1fr;
            height: auto;
            min-height: auto;
          }
          .session-panel {
            height: 480px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }
          .visualizer-panel {
            height: 600px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }
        }

        @media (max-width: 600px) {
          .analytics-container {
            padding: 1rem;
            gap: 1rem;
          }
          .filter-btn {
            flex: 1 1 100%;
          }
          .timeline-header {
            flex-direction: column;
            align-items: stretch;
            padding: 1rem;
            gap: 1rem;
          }
          .timeline-title-area {
            text-align: center;
          }
          .timeline-summary-metrics {
            width: 100%;
            justify-content: space-between;
            gap: 0.5rem;
          }
          .metric {
            flex: 1;
            min-width: 0;
            padding: 0.4rem 0.25rem;
          }
          .metric-val {
            font-size: 0.9rem;
          }
          .metric-lbl {
            font-size: 0.55rem;
          }
          .visualizer-placeholder {
            padding: 2rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .analytics-container {
            --time-width: 65px;
            --connector-width: 30px;
          }
          .node-time {
            font-size: 0.65rem;
            padding-right: 0.4rem;
          }
          .node-content-card {
            padding: 0.75rem 1rem;
            margin-left: 0.4rem;
          }
          .timeline-trail {
            padding: 1rem;
          }
          .trail-start {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
