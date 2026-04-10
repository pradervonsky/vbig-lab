"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { CSSProperties } from "react";
import { renderMarkdown, L2, L3, L4, Eg } from "@/components/GuidelinePage";

export function InsightModal({
  dashboard,
  userRole = "admin",
  readOnly = false,
  onClose,
}: {
  dashboard: any;
  userRole?: "admin" | "annotator1" | "annotator2" | "viewer";
  readOnly?: boolean;
  onClose: () => void;
}) {
  const isAnnotator = userRole === "annotator1" || userRole === "annotator2";
  const [focusMode, setFocusMode] = useState(false);
  const [approval, setApproval] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [irrFlag, setIrrFlag] = useState(false);
  const [insight, setInsight] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"L2" | "L3" | "L4" | "Eg" | null>(null);
  const [draftRestoreAvailable, setDraftRestoreAvailable] = useState(false);
  const draftKey = `vbig_draft_${dashboard.id}_${userRole}`;
  const insightRef = useRef(insight);
  const draftPendingRef = useRef(false);

  // Keep refs in sync so intervals always read the latest values
  useEffect(() => { insightRef.current = insight; }, [insight]);
  useEffect(() => { draftPendingRef.current = draftRestoreAvailable; }, [draftRestoreAvailable]);

  // Pre-fill form if editing an existing insight
  useEffect(() => {
    if (dashboard.human_insights && dashboard.human_insights.length > 0) {
      const row = dashboard.human_insights[0];
      if (userRole === "annotator1") {
        setInsight(row.insight_part_2 || "");
      } else if (userRole === "annotator2") {
        setInsight(row.insight_part_3 || "");
      } else {
        setApproval(row.expected_dataset === true ? "approve" : row.expected_dataset === false ? "reject" : null);
        setRejectionReason(row.rejection_reason ?? "");
        setIrrFlag(row.irr_flag ?? false);
        setInsight(row.insight_part_1 || "");
      }
    }
  }, [dashboard, userRole]);

  // Check for a saved draft on mount
  useEffect(() => {
    if (readOnly) return;
    const draft = localStorage.getItem(draftKey);
    if (draft) setDraftRestoreAvailable(true);
  }, [draftKey, readOnly]);

  // Auto-save insight to localStorage every 30 seconds
  useEffect(() => {
    if (readOnly) return;
    const id = setInterval(() => {
      if (insightRef.current && !draftPendingRef.current) {
        localStorage.setItem(draftKey, insightRef.current);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [draftKey, readOnly]);

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/superstore/${dashboard.bucket_path}`;
  console.log("Image URL:", imageUrl);
  console.log("Bucket path:", dashboard.bucket_path);

  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 100); // Match animation duration
  }

  async function save() {
    let insightData: Record<string, any>;

    if (userRole === "annotator1") {
      insightData = { insight_part_2: insight, updated_at_2: new Date().toISOString() };
    } else if (userRole === "annotator2") {
      insightData = { insight_part_3: insight, updated_at_3: new Date().toISOString() };
    } else {
      insightData = {
        expected_dataset: approval === "approve" ? true : approval === "reject" ? false : null,
        rejection_reason: approval === "reject" ? (rejectionReason || null) : null,
        irr_flag: irrFlag,
        insight_part_1: insight,
        updated_at: new Date().toISOString(),
      };
    }

    if (dashboard.human_insights && dashboard.human_insights.length > 0) {
      await supabase
        .from("human_insights")
        .update(insightData)
        .eq("metadata_id", dashboard.id);
    } else {
      await supabase.from("human_insights").insert({
        metadata_id: dashboard.id,
        ...insightData,
      });
    }

    localStorage.removeItem(draftKey);
    setDraftRestoreAvailable(false);
    setShowSuccess(true);

    // Close modal after showing success
    setTimeout(() => {
      handleClose();
    }, 1500);
  }

  return (
    <>
      <style>{`
        .blur-overlay {
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        @supports (-moz-appearance: none) {
          .blur-overlay {
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            background: rgba(0, 0, 0, 0.82) !important;
          }
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes modalFadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }

        .insight-modal {
          animation: modalFadeIn 0.2s ease-out;
        }

        .insight-modal.closing {
          animation: modalFadeOut 0.2s ease-out;
        }

        .modal-close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .insight-textarea:focus {
          outline: none;
          border-color: #3a6ad6;
          box-shadow: 0 0 0 3px rgba(58, 106, 214, 0.1);
        }

        .yes-button:hover { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .yes-button:active {
          transform: translateY(0);
        }

        .no-button:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .no-button:active {
          transform: translateY(0);
        }

        .irr-button:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .irr-button:active {
          transform: translateY(0);
        }

        .save-button {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-button:hover:not(:disabled) {
          background: #4a7ae6 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(58, 106, 214, 0.3);
        }

        .save-button:active {
          transform: translateY(0);
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translate(-50%, -100%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .success-toast {
          animation: slideInFromTop 0.4s ease-out;
        }

        .view-dashboard-btn:hover {
          filter: brightness(1.2);
        }

        .draft-restore-btn:hover {
          background: rgba(240,173,78,0.35) !important;
        }

        .draft-discard-btn:hover {
          border-color: rgba(255,255,255,0.3) !important;
          color: rgba(255,255,255,0.7) !important;
        }

        .review-select option {
          background: #1e1e1e;
          color: #fff;
        }

        .review-select:focus {
          outline: none;
        }

        @media (max-width: 1024px) {
          .insight-content-wrapper {
            flex-direction: column !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          .insight-image-container {
            flex: none !important;
            height: 40vh !important;
            min-height: 200px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
          .insight-form-section {
            flex: none !important;
            min-width: 0 !important;
          }
        }

        @media (max-width: 640px) {
          .insight-modal-wrapper {
            width: 100% !important;
            height: 100dvh !important;
            border-radius: 0 !important;
          }
          .insight-header {
            padding: 12px 16px !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .insight-header-content {
            flex-wrap: wrap !important;
          }
          .insight-image-container {
            height: 35vh !important;
            padding: 12px !important;
          }
          .insight-form-section {
            padding: 16px !important;
          }
        }
      `}</style>
      <div style={styles.overlay} className="blur-overlay">
        {showSuccess && (
          <div style={styles.successToast} className="success-toast">
            <span style={{ fontSize: "15px", fontWeight: 600 }}>
              Insights saved successfully!
            </span>
          </div>
        )}
        <div style={styles.modal} className={`insight-modal insight-modal-wrapper${isClosing ? ' closing' : ''}`}>
        <div style={styles.header} className="insight-header">
          <div style={styles.headerContent} className="insight-header-content">
            <h2 style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "-0.3px"
            }}>
              {dashboard.dashboard_name}
            </h2>
            <span style={{
              margin: "0 4px",
              opacity: 0.5,
              fontSize: "20px"
            }}>
              |
            </span>
            <p style={{
              opacity: 0.5,
              margin: 0,
              fontSize: "16px",
              fontWeight: 500
            }}>
              {dashboard.dashboard_author}
            </p>
            {dashboard.dashboard_link && (
              <button
                className="view-dashboard-btn"
                style={{
                  background: focusMode ? "rgba(58,106,214,0.2)" : "#333333",
                  border: focusMode ? "1px solid rgba(58,106,214,0.4)" : "1px solid transparent",
                  color: "#fff",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  marginLeft: "8px",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "33px",
                  height: "23px",
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
                onClick={() => {
                  if (!focusMode) {
                    window.open(dashboard.dashboard_link, "_blank");
                    setFocusMode(true);
                  } else {
                    setFocusMode(false);
                  }
                }}
                title={focusMode ? "Show dashboard image" : "View Dashboard (enters focus mode)"}
              >
                {focusMode ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : "➤"}
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {(() => {
              const row = dashboard.human_insights?.[0];
              const ts = userRole === "annotator1" ? row?.updated_at_2
                       : userRole === "annotator2" ? row?.updated_at_3
                       : row?.updated_at;
              if (!ts) return null;
              const d = new Date(ts);
              return (
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>
                  Completed: {d.toLocaleDateString()}{" "}
                  {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              );
            })()}
            <button
              style={styles.closeButton}
              className="modal-close-button"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={styles.contentWrapper} className="insight-content-wrapper">
          <div
            style={{
              ...styles.imageContainer,
              maxWidth: focusMode ? "0" : "9999px",
              padding: focusMode ? "0" : "24px",
              opacity: focusMode ? 0 : 1,
              overflow: "hidden",
              transition: "max-width 0.4s ease, opacity 0.3s ease, padding 0.4s ease",
            }}
            className="insight-image-container"
          >
            <img
              src={imageUrl}
              alt={dashboard.dashboard_name}
              style={styles.image}
              onError={(e) => {
                console.error("Image failed to load:", imageUrl);
                console.error("Error:", e);
              }}
            />
          </div>

          <div style={styles.formSection} className="insight-form-section">
          {draftRestoreAvailable && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "rgba(240,173,78,0.1)",
              border: "1px solid rgba(240,173,78,0.3)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.8)",
              flexShrink: 0,
              gap: "12px",
            }}>
              <span>⚠ Unsaved draft found from a previous session.</span>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button
                  onClick={() => {
                    const draft = localStorage.getItem(draftKey);
                    if (draft) setInsight(draft);
                    setDraftRestoreAvailable(false);
                  }}
                  className="draft-restore-btn"
                  style={{ background: "rgba(240,173,78,0.2)", border: "1px solid rgba(240,173,78,0.5)", color: "#f0ad4e", borderRadius: "6px", padding: "4px 12px", fontSize: "12px", cursor: "pointer", fontWeight: 600, transition: "background 0.15s ease" }}
                >
                  Restore
                </button>
                <button
                  onClick={() => { localStorage.removeItem(draftKey); setDraftRestoreAvailable(false); }}
                  className="draft-discard-btn"
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)", borderRadius: "6px", padding: "4px 12px", fontSize: "12px", cursor: "pointer", transition: "all 0.15s ease" }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}
          {!isAnnotator && (
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ ...styles.checkboxContainer, flex: 5, justifyContent: "flex-start", overflow: "hidden" }}>
                {/* Label: collapses via maxWidth */}
                <div style={{
                  maxWidth: approval === "reject" ? "0" : "120px",
                  overflow: "hidden",
                  flexShrink: 0,
                  transition: "max-width 0.3s ease",
                }}>
                  <span style={{
                    ...styles.checkboxLabel,
                    display: "block",
                    opacity: approval === "reject" ? 0 : 1,
                    whiteSpace: "nowrap",
                    transition: "opacity 0.2s ease",
                  }}>
                    Approve?
                  </span>
                </div>

                {/* Button group: always flex-start, inner spacer slides buttons in sync */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "8px",
                  minWidth: 0,
                }}>
                  {/* Spacer: collapses at same rate as label — buttons slide left together */}
                  <div style={{
                    flexGrow: approval !== "reject" ? 1 : 0,
                    flexShrink: 1,
                    flexBasis: 0,
                    overflow: "hidden",
                    transition: "flex-grow 0.3s ease",
                  }} />
                  <button
                    className="yes-button"
                    style={{
                      ...styles.yesNoButton,
                      background: approval === "approve" ? "#1ebb81" : "rgba(255,255,255,0.05)",
                      border: approval === "approve" ? "1px solid #1ebb81" : "1px solid rgba(255,255,255,0.08)",
                      flexShrink: 0,
                      ...(readOnly ? { cursor: "default", opacity: 0.8 } : {}),
                    }}
                    onClick={() => { if (!readOnly) { setApproval(approval === "approve" ? null : "approve"); setRejectionReason(""); } }}
                  >
                    Yes
                  </button>
                  <button
                    className="no-button"
                    style={{
                      ...styles.yesNoButton,
                      background: approval === "reject" ? "#a32b2b" : "rgba(255,255,255,0.05)",
                      border: approval === "reject" ? "1px solid #a32b2b" : "1px solid rgba(255,255,255,0.1)",
                      flexShrink: 0,
                      ...(readOnly ? { cursor: "default", opacity: 0.8 } : {}),
                    }}
                    onClick={() => !readOnly && setApproval("reject")}
                  >
                    No
                  </button>
                  <select
                    className="review-select"
                    value={rejectionReason}
                    onChange={(e) => !readOnly && setRejectionReason(e.target.value)}
                    disabled={readOnly || approval !== "reject"}
                    style={{
                      flex: approval === "reject" ? 1 : 0,
                      minWidth: 0,
                      maxWidth: approval === "reject" ? "9999px" : "0",
                      opacity: approval === "reject" ? 1 : 0,
                      height: "36px",
                      boxSizing: "border-box",
                      padding: approval === "reject" ? "0 10px" : "0",
                      pointerEvents: approval === "reject" ? "auto" : "none",
                      background: rejectionReason ? "rgba(163,43,43,0.08)" : "rgba(255,255,255,0.05)",
                      border: rejectionReason ? "1px solid rgba(163,43,43,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      color: rejectionReason ? "#fff" : "rgba(255,255,255,0.4)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: readOnly ? "default" : "pointer",
                      outline: "none",
                      appearance: "none",
                      WebkitAppearance: "none",
                      overflow: "hidden",
                      transition: "flex 0.3s ease, opacity 0.25s ease, padding 0.3s ease",
                    }}
                  >
                    <option value="" style={{ background: "#1e1e1e" }}>Reason? </option>
                    <option value="scraper_failure" style={{ background: "#1e1e1e" }}>0. Scraper failure</option>
                    <option value="incorrect_dataset" style={{ background: "#1e1e1e" }}>1. Incorrect dataset</option>
                    <option value="only_one_chart" style={{ background: "#1e1e1e" }}>2. Only one chart</option>
                    <option value="learning_template" style={{ background: "#1e1e1e" }}>3. Learning template</option>
                    <option value="require_interaction" style={{ background: "#1e1e1e" }}>4. Require interaction</option>
                    <option value="unlabelled_graphs" style={{ background: "#1e1e1e" }}>5. Unlabelled graphs</option>
                  </select>
                </div>
              </div>

              <div style={{ ...styles.checkboxContainer, flex: 2 }}>
                <span style={styles.checkboxLabel}>IAA?</span>
                <button
                  className="irr-button"
                  style={{
                    ...styles.yesNoButton,
                    background: irrFlag ? "#3a6ad6" : "rgba(255, 255, 255, 0.05)",
                    border: irrFlag ? "1px solid #3a6ad6" : "1px solid rgba(255, 255, 255, 0.1)",
                    ...(readOnly ? { cursor: "default", opacity: 0.8 } : {}),
                  }}
                  onClick={() => !readOnly && setIrrFlag(prev => !prev)}
                  title="Flag for inter-annotator agreement review"
                >
                  {irrFlag ? "Yes" : "No"}
                </button>
              </div>
            </div>
          )}

          <div style={styles.insightGrid}>
            <div style={styles.textareaWrapper}>
              <div style={styles.labelRow}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={styles.label}>Insight</label>
                  {(["L2", "L3", "L4", "Eg"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(prev => prev === tab ? null : tab)}
                      title={`Show ${tab} guideline`}
                      style={{
                        background: activeTab === tab ? "rgba(58,106,214,0.2)" : "transparent",
                        border: "1px solid " + (activeTab === tab ? "rgba(58,106,214,0.5)" : "rgba(255,255,255,0.1)"),
                        color: activeTab === tab ? "#3a6ad6" : "rgba(255,255,255,0.4)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 700,
                        letterSpacing: "0.3px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <span style={{ ...styles.charCounter, color: insight.length > 3500 ? "#e53e3e" : "rgba(255, 255, 255, 0.4)" }}>{insight.length} / 3,500 charaters</span>
              </div>
              <textarea
                placeholder={`Annotate this dashboard based on the guideline.\nClick one of four buttons above (L2, L3, L4, Eg) to see the guideline.\n\nExpected format:\n\nChart 1: [Title]\nL2: [Sentence 1]\nL3: [Sentence 2]\nL4: [Sentence 3]\n\nChart 2: [Title]\nL2: [Sentence 1]\nL3: [Sentence 2]\nL4: [Sentence 3]\n\nChart n: [Title]\nL2: [Sentence 1]\nL3: [Sentence 2]\nL4: [Sentence 3]`}
                value={insight}
                onChange={(e) => !readOnly && setInsight(e.target.value)}
                style={{ ...styles.textarea, ...(readOnly ? { cursor: "default", opacity: 0.75 } : {}) }}
                className="insight-textarea"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div style={{
            ...styles.guidelinePanel,
            maxHeight: activeTab ? "340px" : "0",
            opacity: activeTab ? 1 : 0,
            paddingTop: activeTab ? "16px" : "0",
            paddingBottom: activeTab ? "16px" : "0",
          }}>
            <div
              style={{ maxHeight: "308px", overflowY: "auto", fontSize: "14px" }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(
                activeTab === "L2" ? L2 :
                activeTab === "L3" ? L3 :
                activeTab === "L4" ? L4 :
                activeTab === "Eg" ? Eg : ""
              ) }}
            />
          </div>

          {!readOnly && (
            <div style={styles.actions}>
              <button
                style={{
                  ...styles.primary,
                  ...((insight.length > 3500 || (!isAnnotator && approval === "reject" && !rejectionReason))
                    ? { background: "#444", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" }
                    : {}),
                }}
                className="save-button"
                onClick={save}
                disabled={insight.length > 3500 || (!isAnnotator && approval === "reject" && !rejectionReason)}
              >
                Save
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#c4c4c4",
    padding: "40px",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "1100px",
    background: "#1c1c1c",
    padding: "32px",
    borderRadius: "16px",
    color: "#fff",
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
  },
  button: {
    padding: "8px 14px",
    borderRadius: "8px",
    background: "#3a6ad6",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },

  /* Modal */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.37)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: "1600px",
    height: "100%",
    background: "linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 100%)",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
  },
  header: {
    padding: "16px 32px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.02)",
    flexShrink: 0,
  },
  headerContent: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    lineHeight: 1,
    fontWeight: 600,
  },
  contentWrapper: {
    display: "flex",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  imageContainer: {
    flex: 2,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: "12px",
  },
  formSection: {
    flex: 1,
    minWidth: 0,
    padding: "16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
    background: "rgba(0, 0, 0, 0.1)",
  },
  insightGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    flex: 1,
  },
  textareaWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  labelRow: {
    display: "flex",
    paddingLeft: "4px",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCounter: {
    fontSize: "12px",
    fontWeight: 500,
    paddingRight: "4px",
    color: "rgba(255, 255, 255, 0.4)",
    fontVariantNumeric: "tabular-nums",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: "0.3px",
    textTransform: "uppercase",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  checkboxLabel: {
    fontSize: "14px",
    fontWeight: 500,
  },
  yesNoButton: {
    padding: "8px 24px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  textarea: {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    padding: "14px 16px",
    color: "#fff",
    minHeight: "160px",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: "1.6",
    transition: "all 0.2s ease",
    flex: 1,
  },
  guidelinePanel: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
    paddingLeft: "20px",
    paddingRight: "20px",
    overflow: "hidden" as const,
    flexShrink: 0,
    transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease, padding 0.1s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexShrink: 0,
    paddingTop: "8px",
  },
  primary: {
    background: "#3a6ad6",
    color: "#fff",
    padding: "14px 32px",
    borderRadius: "10px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
  secondary: {
    background: "#333",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
  },
  successToast: {
    position: "fixed",
    top: "32px",
    left: "50%",
    transform: "translate(-50%, 0)",
    background: "linear-gradient(135deg, #1ebb81 0%, #17a06d 100%)",
    color: "#fff",
    padding: "16px 32px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
};