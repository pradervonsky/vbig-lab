"use client";

import { useState, useMemo, useCallback } from "react";
import { InsightModal } from "./InsightModal";
import "./style/MonitoringPage.css";

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

  const irrRows = useMemo(
    () => dashboards.filter(d => d.human_insights?.[0]?.irr_flag),
    [dashboards]
  );

  const isDone = useCallback((d: any) => {
    return viewingRole === "annotator1"
      ? !!d.human_insights?.[0]?.insight_part_2
      : !!d.human_insights?.[0]?.insight_part_3;
  }, [viewingRole]);

  const totalPages = useMemo(() => Math.ceil(irrRows.length / itemsPerPage), [irrRows]);
  const start = (currentPage - 1) * itemsPerPage;
  const currentRows = useMemo(() => irrRows.slice(start, start + itemsPerPage), [irrRows, start]);
  const completedCount = useMemo(() => irrRows.filter(d => isDone(d)).length, [irrRows, isDone]);

  return (
    <>
      <div className="monitor-overlay" onClick={onClose}>
        <div className="monitor-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="monitor-header">
            <h2 className="monitor-title">Insight Generation Monitoring</h2>
            <div className="monitor-header-controls">
              <div className="monitor-toggle-container">
                <button
                  className={`monitor-toggle-btn${viewingRole === "annotator1" ? " active" : ""}`}
                  onClick={() => { setViewingRole("annotator1"); setCurrentPage(1); }}
                >
                  Annotator 1
                </button>
                <button
                  className={`monitor-toggle-btn${viewingRole === "annotator2" ? " active" : ""}`}
                  onClick={() => { setViewingRole("annotator2"); setCurrentPage(1); }}
                >
                  Annotator 2
                </button>
              </div>
              <div className="monitor-counter">
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{completedCount}</span>
                <span style={{ fontSize: "12px", opacity: 0.5, margin: "0 3px" }}>/</span>
                <span style={{ fontSize: "14px", opacity: 0.7 }}>{irrRows.length}</span>
                <span style={{ fontSize: "11px", opacity: 0.5, marginLeft: "6px" }}>completed</span>
              </div>
              <button className="monitor-close-btn" onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Table */}
          <div className="monitor-table-wrapper">
            <table className="monitor-table">
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
                        <span className={`monitor-badge ${done ? "completed" : "pending"}`}>
                          {done ? "Completed" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="monitor-eye-btn"
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
            <div className="monitor-pagination">
              <button
                className="monitor-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <div className="monitor-page-info">Page {currentPage} of {totalPages}</div>
              <button
                className="monitor-pagination-btn"
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
