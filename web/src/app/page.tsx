"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { InsightModal } from "@/components/InsightModal";
import { LandingPage } from "@/components/LandingPage";
import { AdminPage } from "@/components/AdminPage";
import { MonitoringPage } from "@/components/MonitoringPage";
import type { CSSProperties } from "react";

/* =======================
   COMPONENT
======================= */

export default function HomePage() {
  const [showLanding, setShowLanding] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "excluded">("all");
  const [sessionWarning, setSessionWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(60);
  const [userRole, setUserRole] = useState<"admin" | "annotator1" | "annotator2" | "viewer">("annotator1");
  const [rejectionFilter, setRejectionFilter] = useState<string>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("");
  const [authorSearchOpen, setAuthorSearchOpen] = useState(false);
  const [maxFavorites, setMaxFavorites] = useState<number>(0);
  const [favFilterOpen, setFavFilterOpen] = useState(false);
  const [pageInputValue, setPageInputValue] = useState<string>("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const itemsPerPage = 10;

  const TIMEOUT_MS = 15 * 60 * 1000;   // 15 minutes
  const WARNING_MS = 14 * 60 * 1000;   // warn at 14 minutes (1 min before)
  const lastActivity = useRef(Date.now());
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionWarningRef = useRef(false);

  // Check for existing session on load
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setShowLanding(false);
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", session.user.email)
          .single();
        if (roleData) setUserRole(roleData.role);
      }
      setIsCheckingAuth(false);
    });
  }, []);

  useEffect(() => {
    loadDashboards();
  }, []);

  async function handleSignIn() {
    const { data: { session } } = await supabase.auth.getSession();
    setUserRole("annotator1");
    if (session) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", session.user.email)
        .single();
      if (roleData) setUserRole(roleData.role);
    }
    setShowLanding(false);
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    // Wait for fade-out animation to complete
    setTimeout(() => {
      setShowLanding(true);
      setIsSigningOut(false);
    }, 400);
  }

  const clearTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    warningTimer.current = setTimeout(() => {
      sessionWarningRef.current = true;
      setSessionWarning(true);
      setWarningCountdown(60);
      countdownInterval.current = setInterval(() => {
        setWarningCountdown(prev => prev - 1);
      }, 1000);
    }, WARNING_MS);

    logoutTimer.current = setTimeout(() => {
      clearTimers();
      sessionWarningRef.current = false;
      setSessionWarning(false);
      handleSignOut();
    }, TIMEOUT_MS);
  }, [clearTimers]);

  const resetActivity = useCallback(() => {
    lastActivity.current = Date.now();
    if (sessionWarningRef.current) {
      sessionWarningRef.current = false;
      setSessionWarning(false);
    }
    startTimers();
  }, [startTimers]);

  // Start inactivity tracking only while dashboard is shown
  useEffect(() => {
    if (showLanding) return;

    startTimers();
    const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));

    return () => {
      clearTimers();
      events.forEach(e => window.removeEventListener(e, resetActivity));
    };
  }, [showLanding, startTimers, resetActivity, clearTimers]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteDashboard(d: any) {
    if (!confirm(`Delete "${d.dashboard_name}"? This cannot be undone.`)) return;
    setDeletingId(d.id);
    // 1. Delete related human_insights rows
    await supabase.from("human_insights").delete().eq("metadata_id", d.id);
    // 2. Delete metadata row
    await supabase.from("metadata").delete().eq("id", d.id);
    // 3. Remove image from storage bucket
    if (d.bucket_path) {
      await supabase.storage.from("superstore").remove([d.bucket_path]);
    }
    setDeletingId(null);
    await loadDashboards();
  }

  async function loadDashboards() {
    const { data } = await supabase
      .from("metadata")
      .select(`
        id,
        dashboard_name,
        dashboard_author,
        bucket_path,
        dashboard_link,
        created_at,
        favorite_count,
        human_insights(id, created_at, updated_at, updated_at_2, updated_at_3, expected_dataset, rejection_reason, irr_flag, insight_part_1, insight_part_2, insight_part_3)
      `);

    if (!data) return;

    // Status rank: 0 = Pending, 1 = Completed, 2 = Excluded
    function statusRank(d: any) {
      if (!d.human_insights?.length) return 0;
      return d.human_insights[0].expected_dataset === true ? 1 : 2;
    }

    const sorted = [...data].sort((a, b) => {
      const rankDiff = statusRank(a) - statusRank(b);
      if (rankDiff !== 0) return rankDiff;

      // Within the same status: latest timestamp first
      const aTime = a.human_insights?.[0]?.updated_at ?? a.created_at;
      const bTime = b.human_insights?.[0]?.updated_at ?? b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setDashboards(sorted);
  }

  const isAnnotator = userRole === "annotator1" || userRole === "annotator2";

  function isDoneForRole(d: any) {
    if (userRole === "annotator1") return !!d.human_insights?.[0]?.insight_part_2;
    if (userRole === "annotator2") return !!d.human_insights?.[0]?.insight_part_3;
    return d.human_insights?.length > 0;
  }

  // Filter dashboards by status (and irr_flag for annotators)
  const filteredDashboards = dashboards.filter(d => {
    if (isAnnotator && !d.human_insights?.[0]?.irr_flag) return false;
    if (authorFilter && !d.dashboard_author?.toLowerCase().includes(authorFilter.toLowerCase())) return false;
    if (maxFavorites > 0 && (d.favorite_count ?? 0) > maxFavorites) return false;
    if (statusFilter === "all") return true;
    const done = isDoneForRole(d);
    if (statusFilter === "pending") return !done;
    if (statusFilter === "completed") {
      if (!done) return false;
      if (isAnnotator) return true;
      return d.human_insights?.[0]?.expected_dataset === true;
    }
    if (statusFilter === "excluded") {
      if (isAnnotator || !done) return false;
      if (d.human_insights?.[0]?.expected_dataset === true) return false;
      if (rejectionFilter !== "all") return d.human_insights?.[0]?.rejection_reason === rejectionFilter;
      return true;
    }
    return true;
  });

  // Calculate stats
  const baseDashboards = isAnnotator
    ? dashboards.filter(d => d.human_insights?.[0]?.irr_flag)
    : dashboards;
  const allCount = baseDashboards.length;
  const pendingCount = baseDashboards.filter(d => !isDoneForRole(d)).length;
  const completedCount = baseDashboards.filter(d => {
    if (!isDoneForRole(d)) return false;
    if (isAnnotator) return true;
    return d.human_insights?.[0]?.expected_dataset === true;
  }).length;
  const excludedCount = isAnnotator ? 0 : baseDashboards.filter(d =>
    isDoneForRole(d) && d.human_insights?.[0]?.expected_dataset !== true
  ).length;

  // Pagination
  const totalPages = Math.ceil(filteredDashboards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDashboards = filteredDashboards.slice(startIndex, endIndex);

  // Show nothing while checking auth to prevent flash
  if (isCheckingAuth) {
    return null;
  }

  if (showLanding) {
    return <LandingPage onStart={handleSignIn} />;
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }

        .dashboard-card {
          animation: fadeInUp 0.5s ease-out;
        }

        .dashboard-card.signing-out {
          animation: fadeOutDown 0.4s ease-in forwards;
        }

        .dashboard-table {
          border-spacing: 0 4px;
          border-collapse: separate;
        }

        .author-search-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          font-size: 11px;
          outline: none;
          padding: 1px 2px;
          width: 0;
          max-width: 0;
          opacity: 0;
          transition: width 0.25s ease, max-width 0.25s ease, opacity 0.2s ease;
          vertical-align: middle;
          font-family: inherit;
        }

        .author-search-input.open {
          width: 90px;
          max-width: 90px;
          opacity: 1;
        }

        .author-search-input::placeholder {
          color: rgba(255,255,255,0.3);
        }

        .author-search-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          padding: 2px 4px;
          vertical-align: middle;
          line-height: 1;
          transition: color 0.15s ease;
          border-radius: 4px;
        }

        .author-search-btn.active {
          color: rgba(255,255,255,0.9);
        }

        .dashboard-table thead th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .dashboard-table tbody td {
          padding: 20px 20px;
          font-size: 13px;
          color: #e0e0e0;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        .dashboard-table tbody td:first-child {
          border-left: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 10px 0 0 10px;
        }

        .dashboard-table tbody td:last-child {
          border-right: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 0 10px 10px 0;
        }

        .dashboard-table tbody tr {
          transition: all 0.2s ease;
        }

        .dashboard-table tbody tr:hover td {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .dashboard-table thead th:first-child,
        .dashboard-table tbody td:first-child {
          color: rgba(255, 255, 255, 0.4);
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .dashboard-table tbody td:nth-child(2) {
          font-weight: 600;
          color: #fff;
        }

        .dashboard-table button:not(.author-search-btn):not(.trash-btn):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .dashboard-table button:active {
          transform: translateY(0);
        }

        .trash-btn:hover:not(:disabled) {
          background: rgba(220,53,69,0.15) !important;
          border-color: rgba(220,53,69,0.7) !important;
          color: rgb(220,53,69) !important;
        }

        .dashboard-table td:last-child {
          text-align: right;
        }

        .status-badge {
          transition: all 0.2s ease;
        }
          
        .pagination-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .pagination-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .page-number-input::-webkit-outer-spin-button,
        .page-number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: -1px;
        }

        .footer-link:hover {
          color: rgba(255, 255, 255, 0.9);
          border-bottom-color: rgba(255, 255, 255, 0.5);
        }

        .filter-button:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.9);
        }

        .fav-filter-btn {
          display: flex;
          align-items: center;
          gap: 0px;
          padding: 6px 10px;
          border-radius: 6px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: color 0.15s ease, background 0.15s ease;
          font-size: 13px;
          white-space: nowrap;
        }

        .fav-filter-btn:hover, .fav-filter-btn.active {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.9);
        }

        .fav-filter-input {
          width: 0;
          max-width: 0;
          opacity: 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          padding: 0;
          transition: width 0.25s ease, max-width 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
          MozAppearance: textfield;
        }

        .fav-filter-input.open {
          width: 52px;
          max-width: 52px;
          opacity: 1;
          padding: 0 4px;
        }

        .fav-filter-input::-webkit-outer-spin-button,
        .fav-filter-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .admin-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .monitor-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .signout-btn:hover {
          background: rgba(220, 53, 69, 0.2) !important;
          border-color: rgba(220, 53, 69, 0.4) !important;
          color: #ff6b6b !important;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }


        .session-warning {
          animation: slideDown 0.3s ease-out;
        }

        .session-warning-stay:hover {
          background: rgba(255, 255, 255, 0.15) !important;
        }

        @media (max-width: 1024px) {
          .page-card {
            padding: 20px !important;
          }
          .page-header {
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .page-header-right {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
        }

        @media (max-width: 640px) {
          .page-container {
            padding: 0 !important;
            align-items: stretch !important;
          }
          .page-card {
            padding: 16px !important;
            border-radius: 0 !important;
            min-height: 100vh !important;
          }
          .page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .page-header-right {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .page-table-wrapper {
            overflow-x: auto !important;
          }
          .dashboard-table {
            min-width: 540px !important;
          }
          .dashboard-table thead th,
          .dashboard-table tbody td {
            padding: 10px 10px !important;
            font-size: 12px !important;
          }
          .page-footer {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .session-warning {
            width: calc(100% - 32px) !important;
            white-space: normal !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {sessionWarning && (
        <div
          className="session-warning"
          style={styles.sessionWarning}
        >
          <span style={{ fontSize: "14px" }}>⏱</span>
          <span style={{ fontSize: "13px", fontWeight: 500 }}>
            Session expiring in <strong>{warningCountdown}s</strong>
          </span>
          <button
            className="session-warning-stay"
            style={styles.sessionWarningBtn}
            onClick={resetActivity}
          >
            Stay signed in
          </button>
        </div>
      )}

      <div style={styles.container} className="page-container">
        <div style={styles.card} className={`dashboard-card page-card${isSigningOut ? " signing-out" : ""}`}>
          <div style={styles.header} className="page-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="page-header-left">
              <h1 style={styles.title}>Insight Generation Platform</h1>
              {(userRole === "admin" || userRole === "viewer") && (
                <button
                  style={styles.monitorButton}
                  className="monitor-btn"
                  onClick={() => setShowMonitoring(true)}
                  title="Monitoring"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }} className="page-header-right">
              {/* Favorite count filter */}
              <div style={styles.filterContainer}>
                <button
                  className={`fav-filter-btn${favFilterOpen || maxFavorites > 0 ? " active" : ""}`}
                  onClick={() => {
                    setFavFilterOpen(prev => {
                      if (prev) { setMaxFavorites(0); setCurrentPage(1); }
                      return !prev;
                    });
                  }}
                  title="Filter by max favorite count"
                >
                  ♥
                  <input
                    type="number"
                    className={`fav-filter-input${favFilterOpen ? " open" : ""}`}
                    min={0}
                    placeholder="favs"
                    value={maxFavorites > 0 ? maxFavorites : ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setMaxFavorites(isNaN(v) || v < 0 ? 0 : v);
                      setCurrentPage(1);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") { setFavFilterOpen(false); setMaxFavorites(0); setCurrentPage(1); }
                      e.stopPropagation();
                    }}
                  />
                </button>
              </div>
              <div style={styles.filterContainer}>
                <button
                  className="filter-button"
                  style={{
                    ...styles.filterButton,
                    background: statusFilter === "all" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  }}
                  onClick={() => { setStatusFilter("all"); setRejectionFilter("all"); setCurrentPage(1); }}
                >
                  All <span style={{ opacity: 0.5, fontSize: "11px", marginLeft: "3px" }}>{allCount}</span>
                </button>
                <button
                  className="filter-button"
                  style={{
                    ...styles.filterButton,
                    background: statusFilter === "pending" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  }}
                  onClick={() => { setStatusFilter("pending"); setRejectionFilter("all"); setCurrentPage(1); }}
                >
                  Pending <span style={{ opacity: 0.5, fontSize: "11px", marginLeft: "3px" }}>{pendingCount}</span>
                </button>
                <button
                  className="filter-button"
                  style={{
                    ...styles.filterButton,
                    background: statusFilter === "completed" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  }}
                  onClick={() => { setStatusFilter("completed"); setRejectionFilter("all"); setCurrentPage(1); }}
                >
                  Completed <span style={{ opacity: 0.5, fontSize: "11px", marginLeft: "3px" }}>{completedCount}</span>
                </button>
                {!isAnnotator && (
                  <div style={{ display: "flex", overflow: "hidden", alignItems: "center" }}>
                    {/* Excluded button — collapses when excluded filter is active */}
                    <button
                      className="filter-button"
                      style={{
                        ...styles.filterButton,
                        background: "transparent",
                        maxWidth: statusFilter === "excluded" ? "0" : "160px",
                        padding: statusFilter === "excluded" ? "6px 0" : "6px 16px",
                        opacity: statusFilter === "excluded" ? 0 : 1,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        pointerEvents: statusFilter === "excluded" ? "none" : "auto",
                        transition: "max-width 0.35s ease, opacity 0.25s ease, padding 0.35s ease",
                      }}
                      onClick={() => { setStatusFilter("excluded"); setCurrentPage(1); }}
                    >
                      Excluded <span style={{ opacity: 0.5, fontSize: "11px", marginLeft: "3px" }}>{excludedCount}</span>
                    </button>
                    {/* Reasons panel — expands when excluded filter is active */}
                    <div
                      style={{
                        ...styles.filterButton,
                        background: "rgba(255, 255, 255, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "default",
                        maxWidth: statusFilter === "excluded" ? "340px" : "0",
                        padding: statusFilter === "excluded" ? "6px 12px" : "6px 0",
                        opacity: statusFilter === "excluded" ? 1 : 0,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        pointerEvents: statusFilter !== "excluded" ? "none" : "auto",
                        transition: "max-width 0.35s ease, opacity 0.25s ease, padding 0.35s ease",
                      }}
                    >
                      <span style={{ fontSize: "12px", opacity: 0.6 }}>Reasons:</span>
                      <select
                        value={rejectionFilter}
                        onChange={(e) => { setRejectionFilter(e.target.value); setCurrentPage(1); }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#fff",
                          fontSize: "12px",
                          cursor: "pointer",
                          outline: "none",
                          appearance: "none",
                          WebkitAppearance: "none",
                        }}
                      >
                        <option value="all" style={{ background: "#1e1e1e" }}>All ({excludedCount})</option>
                        <option value="scraper_failure" style={{ background: "#1e1e1e" }}>Scraper failure</option>
                        <option value="incorrect_dataset" style={{ background: "#1e1e1e" }}>Incorrect dataset</option>
                        <option value="only_one_chart" style={{ background: "#1e1e1e" }}>Only one chart</option>
                        <option value="learning_template" style={{ background: "#1e1e1e" }}>Learning template</option>
                        <option value="require_interaction" style={{ background: "#1e1e1e" }}>Require interaction</option>
                        <option value="unlabelled_graphs" style={{ background: "#1e1e1e" }}>Unlabelled graphs</option>
                      </select>
                      <button
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "0 2px", fontSize: "12px", lineHeight: 1 }}
                        onClick={() => { setStatusFilter("all"); setRejectionFilter("all"); setCurrentPage(1); }}
                        title="Clear filter"
                      >✕</button>
                    </div>
                  </div>
                )}
              </div>
              <button
                className="signout-btn"
                style={styles.signOutButton}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }} className="page-table-wrapper">
            <table style={styles.table} className="dashboard-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Dashboard Title</th>
                <th style={{ whiteSpace: "nowrap" }}>
                  Author
                  <button
                    className={`author-search-btn${authorSearchOpen || authorFilter ? " active" : ""}`}
                    title="Filter by author"
                    onClick={() => {
                      setAuthorSearchOpen(prev => {
                        if (prev) { setAuthorFilter(""); setCurrentPage(1); }
                        return !prev;
                      });
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </button>
                  <input
                    className={`author-search-input${authorSearchOpen ? " open" : ""}`}
                    placeholder="Search…"
                    value={authorFilter}
                    onChange={(e) => { setAuthorFilter(e.target.value); setCurrentPage(1); }}
                    onKeyDown={(e) => { if (e.key === "Escape") { setAuthorSearchOpen(false); setAuthorFilter(""); setCurrentPage(1); } }}
                  />
                </th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentDashboards.map((d, idx) => {
                const done = isDoneForRole(d);
                const isCorrectDataset = !isAnnotator && done && d.human_insights[0].expected_dataset === true;
                const rejectionReason = !isAnnotator && done && !isCorrectDataset
                  ? d.human_insights[0].rejection_reason
                  : null;
                const rejectionLabels: Record<string, string> = {
                  scraper_failure: "Scraper failure",
                  incorrect_dataset: "Incorrect dataset",
                  only_one_chart: "Only one chart",
                  learning_template: "Learning template",
                  require_interaction: "Require interaction",
                  unlabelled_graphs: "Unlabelled graphs",
                };
                const globalIndex = startIndex + idx + 1;

                return (
                  <tr key={d.id}>
                    <td>{globalIndex}</td>
                    <td>
                      {d.dashboard_name}
                      {d.favorite_count > 0 && (
                        <span style={{
                          marginLeft: "8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.35)",
                          letterSpacing: "0.2px",
                          verticalAlign: "middle",
                        }}>
                          ♥ {d.favorite_count.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td>{d.dashboard_author}</td>
                    <td>
                      {(() => {
                        const row = d.human_insights?.[0];
                        const timestamp = isAnnotator
                          ? (userRole === "annotator1" ? row?.updated_at_2 : row?.updated_at_3)
                          : (done ? row?.updated_at : d.created_at);
                        if (!timestamp) return <span style={{ opacity: 0.3 }}>—</span>;
                        return (
                          <>
                            {new Date(timestamp).toLocaleDateString()}{" "}
                            {new Date(timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </>
                        );
                      })()}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          ...styles.badge,
                          background: !done ? "#a32b2b" : (isAnnotator || isCorrectDataset ? "#1ebb81" : "#6b7280"),
                        }}
                      >
                        {!done ? "Pending" : isAnnotator || isCorrectDataset ? "Completed" : (rejectionReason ? rejectionLabels[rejectionReason] ?? "Excluded" : "Excluded")}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          style={{
                            ...styles.iconButton,
                            background: userRole === "viewer" ? "#333333" : done ? "#f0ad4e" : "#3a6ad6",
                          }}
                          onClick={() => setSelected(d)}
                          title={userRole === "viewer" ? "View" : done ? "Edit" : "Process"}
                        >
                          {userRole === "viewer" ? "👁" : done ? "✎" : "✓"}
                        </button>
                        <button
                          style={{
                            ...styles.iconButton,
                            background: "#333333",
                          }}
                          onClick={() => {
                            console.log("Dashboard link:", d.dashboard_link);
                            if (d.dashboard_link) {
                              window.open(d.dashboard_link, "_blank");
                            } else {
                              alert("No dashboard link available");
                            }
                          }}
                          title="View Dashboard"
                        >
                          ➤
                        </button>
                        {userRole === "admin" && (
                          <button
                            className="trash-btn"
                            style={{
                              ...styles.iconButton,
                              background: "transparent",
                              border: "1px solid rgba(220,53,69,0.3)",
                              color: "rgba(220,53,69,0.6)",
                              opacity: deletingId === d.id ? 0.4 : 1,
                              cursor: deletingId === d.id ? "not-allowed" : "pointer",
                            }}
                            onClick={() => deleteDashboard(d)}
                            disabled={deletingId === d.id}
                            title="Delete dashboard"
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <div style={styles.footerRow} className="page-footer">
            {/* Left: Admin button */}
            <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center" }}>
              {userRole === "admin" && (
                <button
                  style={styles.adminButton}
                  className="admin-btn"
                  onClick={() => setShowAdmin(true)}
                >
                  ⚙ Admin
                </button>
              )}
            </div>

            {/* Center: Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                <button
                  className="pagination-btn"
                  style={{
                    ...styles.paginationButton,
                    opacity: currentPage === 1 ? 0.3 : 1,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                <div style={styles.pageInfo}>
                  Page{" "}
                  <input
                    type="number"
                    className="page-number-input"
                    min={1}
                    max={totalPages}
                    value={pageInputValue !== "" ? pageInputValue : currentPage}
                    onChange={(e) => setPageInputValue(e.target.value)}
                    onBlur={() => {
                      const val = parseInt(pageInputValue, 10);
                      if (!isNaN(val)) setCurrentPage(Math.min(totalPages, Math.max(1, val)));
                      setPageInputValue("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    style={{
                      width: `${Math.max(2, String(totalPages).length) + 1}ch`,
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.3)",
                      color: "inherit",
                      fontSize: "inherit",
                      fontFamily: "inherit",
                      textAlign: "center",
                      outline: "none",
                      padding: "0 4px",
                      MozAppearance: "textfield",
                    }}
                  />{" "}
                  of {totalPages}
                </div>
                <button
                  className="pagination-btn"
                  style={{
                    ...styles.paginationButton,
                    opacity: currentPage === totalPages ? 0.3 : 1,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Right: Name */}
            <div style={{ minWidth: 0, flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <span>
                <a
                  href="https://github.com/pradervonsky/vbig-lab"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.footerLink}
                  className="footer-link"
                >
                  M. Pradana Aditya
                </a>
                &nbsp;| 2026
              </span>
            </div>
          </div>
        </div>

        {selected && (
          <InsightModal
            dashboard={selected}
            userRole={userRole}
            readOnly={userRole === "viewer"}
            onClose={() => {
              setSelected(null);
              loadDashboards();
            }}
          />
        )}

        {showAdmin && <AdminPage onClose={() => setShowAdmin(false)} />}
        {showMonitoring && (
          <MonitoringPage
            dashboards={dashboards}
            onClose={() => setShowMonitoring(false)}
          />
        )}
      </div>
    </>
  );
}

/* =======================
   STYLES
======================= */

const styles: Record<string, CSSProperties> = {
  container: {
    height: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%)",
    padding: "24px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  card: {
    width: "100%",
    height: "100%",
    maxWidth: "1600px",
    background: "linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 100%)",
    padding: "32px",
    borderRadius: "24px",
    color: "#fff",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexShrink: 0,
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    margin: 0,
    color: "#fff",
    letterSpacing: "-0.8px",
    background: "linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  counter: {
    display: "flex",
    alignItems: "baseline",
    padding: "8px 16px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  filterContainer: {
    display: "flex",
    gap: "4px",
    padding: "4px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  filterButton: {
    padding: "6px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.7)",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    flex: 1,
    minHeight: 0,
  },
  badge: {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  iconButton: {
    padding: "8px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#fff",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "16px",
    padding: "0",
    flexShrink: 0,
  },
  paginationButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#fff",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  pageInfo: {
    fontSize: "13px",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.7)",
    padding: "8px 16px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "8px",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: 500,
    letterSpacing: "1px",
    flexShrink: 0,
    marginTop: "12px",
  },
  monitorButton: {
    padding: "6px 8px",
    borderRadius: "8px",
    color: "rgba(255, 255, 255, 0.5)",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  adminButton: {
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.5)",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  footerLink: {
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s ease",
    borderBottom: "1px solid transparent",
  },
  signOutButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.6)",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  sessionWarning: {
    position: "fixed",
    top: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #1e1e1e 0%, #1a1a1a 100%)",
    border: "1px solid rgba(220, 53, 69, 0.4)",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    zIndex: 2000,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(220, 53, 69, 0.15)",
    whiteSpace: "nowrap",
  },
  sessionWarningBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#fff",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};