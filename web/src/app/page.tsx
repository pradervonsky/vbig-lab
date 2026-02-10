"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { InsightModal } from "@/components/InsightModal";
import { LandingPage } from "@/components/LandingPage";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const itemsPerPage = 10;

  // Check for existing session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setShowLanding(false);
      }
      setIsCheckingAuth(false);
    });
  }, []);

  useEffect(() => {
    loadDashboards();
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    // Wait for fade-out animation to complete
    setTimeout(() => {
      setShowLanding(true);
      setIsSigningOut(false);
    }, 400);
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
        human_insights(id, created_at, updated_at, expected_dataset, insight_part_1, insight_part_2, insight_part_3)
      `);

    if (!data) return;

    const sorted = [...data].sort((a, b) => {
      const aDone = a.human_insights?.length > 0;
      const bDone = b.human_insights?.length > 0;

      // unfinished first
      if (aDone !== bDone) return aDone ? 1 : -1;

      // oldest first
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    setDashboards(sorted);
  }

  // Filter dashboards by status
  const filteredDashboards = dashboards.filter(d => {
    if (statusFilter === "all") return true;
    const done = d.human_insights?.length > 0;
    return statusFilter === "completed" ? done : !done;
  });

  // Calculate stats
  const completedCount = dashboards.filter(d => d.human_insights?.length > 0).length;
  const totalCount = dashboards.length;

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
    return <LandingPage onStart={() => setShowLanding(false)} />;
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

        .dashboard-table button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .dashboard-table button:active {
          transform: translateY(0);
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

        .footer-link:hover {
          color: rgba(255, 255, 255, 0.9);
          border-bottom-color: rgba(255, 255, 255, 0.5);
        }

        .filter-button:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.9);
        }

        .signout-btn:hover {
          background: rgba(220, 53, 69, 0.2) !important;
          border-color: rgba(220, 53, 69, 0.4) !important;
          color: #ff6b6b !important;
        }
      `}</style>

      <div style={styles.container}>
        <div style={styles.card} className={`dashboard-card${isSigningOut ? " signing-out" : ""}`}>
          <div style={styles.header}>
            <h1 style={styles.title}>Insight Generation Platform</h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={styles.filterContainer}>
                <button
                  className="filter-button"
                  style={{
                    ...styles.filterButton,
                    background: statusFilter === "all" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                    fontWeight: statusFilter === "all" ? 600 : 400,
                  }}
                  onClick={() => {
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  All
                </button>
                <button
                  className="filter-button"
                  style={{
                    ...styles.filterButton,
                    background: statusFilter === "pending" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                    fontWeight: statusFilter === "pending" ? 600 : 400,
                  }}
                  onClick={() => {
                    setStatusFilter("pending");
                    setCurrentPage(1);
                  }}
                >
                  Pending
                </button>
                <button
                  className="filter-button"
                  style={{
                    ...styles.filterButton,
                    background: statusFilter === "completed" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                    fontWeight: statusFilter === "completed" ? 600 : 400,
                  }}
                  onClick={() => {
                    setStatusFilter("completed");
                    setCurrentPage(1);
                  }}
                >
                  Completed
                </button>
              </div>
              <div style={styles.counter}>
                <span style={{ fontSize: "16px", fontWeight: 600 }}>{completedCount}</span>
                <span style={{ fontSize: "12px", opacity: 0.5, margin: "0 3px" }}>/</span>
                <span style={{ fontSize: "16px", opacity: 0.7 }}>{totalCount}</span>
                <span style={{ fontSize: "12px", opacity: 0.5, marginLeft: "6px" }}>completed</span>
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

          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <table style={styles.table} className="dashboard-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Dashboard Title</th>
                <th>Author</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentDashboards.map((d, idx) => {
                const done = d.human_insights?.length > 0;
                const globalIndex = startIndex + idx + 1;

                return (
                  <tr key={d.id}>
                    <td>{globalIndex}</td>
                    <td>{d.dashboard_name}</td>
                    <td>{d.dashboard_author}</td>
                    <td>
                      {new Date(d.created_at).toLocaleDateString()}{" "}
                      {new Date(d.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          ...styles.badge,
                          background: done ? "#1ebb81" : "#a32b2b",
                        }}
                      >
                        {done ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          style={{
                            ...styles.iconButton,
                            background: done ? "#f0ad4e" : "#3a6ad6",
                          }}
                          onClick={() => setSelected(d)}
                          title={done ? "Edit" : "Process"}
                        >
                          {done ? "✎" : "✓"}
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
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
                Page {currentPage} of {totalPages}
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

          <div style={styles.footer}>
            <a
              href="https://github.com/pradervonsky/vbig-lab"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.footerLink}
              className="footer-link"
            >
            &nbsp;M. Pradana Aditya
            </a>
            &nbsp;| 2026
          </div>
        </div>

        {selected && (
          <InsightModal
            dashboard={selected}
            onClose={() => {
              setSelected(null);
              loadDashboards();
            }}
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
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: 500,
    letterSpacing: "1px",
    flexShrink: 0,
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
};