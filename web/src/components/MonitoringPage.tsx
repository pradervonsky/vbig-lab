"use client";

import { useState } from "react";
import { InsightModal } from "./InsightModal";
import type { CSSProperties } from "react";

type AnnotatorRole = "annotator1" | "annotator2";

export function MonitoringPage({
  dashboards,
  onClose,
}: {
  dashboards: any[];
  onClose: () => void;
}) {
  const [viewingRole, setViewingRole] = useState<AnnotatorRole>("annotator1");
  const [selected, setSelected] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const irrRows = dashboards.filter(d => d.human_insights?.[0]?.irr_flag);

  function isDone(d: any) {
    return viewingRole === "annotator1"
      ? !!d.human_insights?.[0]?.insight_part_2
      : !!d.human_insights?.[0]?.insight_part_3;
  }

  const totalPages = Math.ceil(irrRows.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentRows = irrRows.slice(start, start + itemsPerPage);
  const completedCount = irrRows.filter(d => isDone(d)).length;

  return (
    <>
      <style>{`
        .monitor-table {
          border-spacing: 0 4px;
          border-collapse: separate;
        }

        .monitor-table thead th {
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

        .monitor-table tbody td {
          padding: 16px 20px;
          font-size: 13px;
          color: #e0e0e0;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        .monitor-table tbody td:first-child {
          border-left: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 10px 0 0 10px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 600;
        }

        .monitor-table tbody td:last-child {
          border-right: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 0 10px 10px 0;
          text-align: center;
          width: 60px;
        }

        .monitor-table thead th:last-child {
          text-align: center;
        }

        .monitor-table tbody td:nth-child(2) {
          font-weight: 600;
          color: #fff;
        }

        .monitor-table tbody tr:hover td {
          background: rgba(255, 255, 255, 0.05);
        }

        .monitor-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .monitor-eye-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .monitor-pagination-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1) !important;
          transform: translateY(-1px);
        }
      `}</style>

      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={styles.header}>
            <h2 style={styles.title}>Insight Generation Monitoring</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={styles.toggleContainer}>
                <button
                  className="monitor-toggle-btn"
                  style={{
                    ...styles.toggleButton,
                    background: viewingRole === "annotator1" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  }}
                  onClick={() => { setViewingRole("annotator1"); setCurrentPage(1); }}
                >
                  Annotator 1
                </button>
                <button
                  className="monitor-toggle-btn"
                  style={{
                    ...styles.toggleButton,
                    background: viewingRole === "annotator2" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  }}
                  onClick={() => { setViewingRole("annotator2"); setCurrentPage(1); }}
                >
                  Annotator 2
                </button>
              </div>
              <div style={styles.counter}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{completedCount}</span>
                <span style={{ fontSize: "12px", opacity: 0.5, margin: "0 3px" }}>/</span>
                <span style={{ fontSize: "14px", opacity: 0.7 }}>{irrRows.length}</span>
                <span style={{ fontSize: "11px", opacity: 0.5, marginLeft: "6px" }}>completed</span>
              </div>
              <button style={styles.closeButton} onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <table style={{ width: "100%" }} className="monitor-table">
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
                {currentRows.map((d, idx) => {
                  const done = isDone(d);
                  const row = d.human_insights?.[0];
                  const timestamp = viewingRole === "annotator1" ? row?.updated_at_2 : row?.updated_at_3;
                  const globalIndex = start + idx + 1;

                  return (
                    <tr key={d.id}>
                      <td>{globalIndex}</td>
                      <td>{d.dashboard_name}</td>
                      <td>{d.dashboard_author}</td>
                      <td>
                        {timestamp ? (
                          <>
                            {new Date(timestamp).toLocaleDateString()}{" "}
                            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                          </>
                        ) : (
                          <span style={{ opacity: 0.3 }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          ...styles.badge,
                          background: done ? "#1ebb81" : "#a32b2b",
                        }}>
                          {done ? "Completed" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="monitor-eye-btn"
                          style={styles.eyeButton}
                          onClick={() => setSelected(d)}
                          title="View insight"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {irrRows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", opacity: 0.4, padding: "40px" }}>
                      No IRR-flagged dashboards yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                className="monitor-pagination-btn"
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
              <div style={styles.pageInfo}>Page {currentPage} of {totalPages}</div>
              <button
                className="monitor-pagination-btn"
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

        </div>
      </div>

      {selected && (
        <InsightModal
          dashboard={selected}
          userRole={viewingRole}
          readOnly={true}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(12px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    zIndex: 900,
  },
  modal: {
    width: "100%",
    maxWidth: "1400px",
    height: "90vh",
    background: "linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 100%)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: "28px 32px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "-0.5px",
    background: "linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  toggleContainer: {
    display: "flex",
    gap: "4px",
    padding: "4px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  toggleButton: {
    padding: "6px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.7)",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "transparent",
  },
  counter: {
    display: "flex",
    alignItems: "baseline",
    padding: "6px 14px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "18px",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },
  badge: {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  eyeButton: {
    padding: "8px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#fff",
    background: "#3a6ad6",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "inline-flex",
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
};
