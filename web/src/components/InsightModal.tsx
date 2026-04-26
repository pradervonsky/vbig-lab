"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { renderMarkdown } from "@/components/GuidelinePage";
import "./style/InsightModal.css";

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

  // Cache rendered HTML per tab — dynamically load each guideline only when first opened
  const guidelineCache = useRef<Partial<Record<"L2" | "L3" | "L4" | "Eg", string>>>({});
  const [guidelineHtml, setGuidelineHtml] = useState("");

  useEffect(() => {
    if (!activeTab) { setGuidelineHtml(""); return; }
    if (guidelineCache.current[activeTab]) {
      setGuidelineHtml(guidelineCache.current[activeTab]!);
      return;
    }
    const loaders: Record<string, () => Promise<{ [k: string]: string }>> = {
      L2: () => import("./guidelines/L2"),
      L3: () => import("./guidelines/L3"),
      L4: () => import("./guidelines/L4"),
      Eg: () => import("./guidelines/Eg"),
    };
    loaders[activeTab]().then((mod) => {
      const html = renderMarkdown(mod[activeTab]);
      guidelineCache.current[activeTab] = html;
      setGuidelineHtml(html);
    });
  }, [activeTab]);

  // Memoize the "Completed" timestamp shown in the header
  const completedTimestamp = useMemo(() => {
    const row = dashboard.human_insights?.[0];
    const ts = userRole === "annotator1" ? row?.updated_at_2
             : userRole === "annotator2" ? row?.updated_at_3
             : row?.updated_at;
    if (!ts) return null;
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  }, [dashboard.human_insights, userRole]);

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/superstore/${dashboard.bucket_path}`;

  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 100);
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

    setTimeout(() => {
      handleClose();
    }, 1500);
  }

  const insightLength = insight.length;
  const charLimit = isAnnotator ? 3500 : 5000;

  return (
    <>
      <div className="insight-overlay">
        {showSuccess && (
          <div className="success-toast">
            <span style={{ fontSize: "15px", fontWeight: 600 }}>
              Insights saved successfully!
            </span>
          </div>
        )}
        <div className={`insight-modal insight-modal-wrapper${isClosing ? " closing" : ""}`}>
        <div className="insight-header">
          <div className="insight-header-content">
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
            {completedTimestamp && (
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>
                Completed: {completedTimestamp}
              </span>
            )}
            <button
              className="modal-close-button"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className={`insight-content-wrapper${focusMode ? " focus-mode" : ""}`}>
          <div
            className={`insight-image-container${focusMode ? " focus-mode" : ""}`}
          >
            {/* Unmount the image in focus mode to free GPU texture memory */}
            {!focusMode && (
              <img
                src={imageUrl}
                alt={dashboard.dashboard_name}
                className="insight-image"
                onError={(e) => {
                  console.error("Image failed to load:", imageUrl, e);
                }}
              />
            )}
          </div>

          <div className="insight-form-section">
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
              <div className="insight-checkbox-container" style={{ flex: 5, justifyContent: "flex-start", overflow: "hidden" }}>
                <div style={{
                  maxWidth: approval === "reject" ? "0" : "120px",
                  overflow: "hidden",
                  flexShrink: 0,
                  transition: "max-width 0.3s ease",
                }}>
                  <span className="insight-checkbox-label" style={{
                    display: "block",
                    opacity: approval === "reject" ? 0 : 1,
                    whiteSpace: "nowrap",
                    transition: "opacity 0.2s ease",
                  }}>
                    Approve?
                  </span>
                </div>

                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "8px",
                  minWidth: 0,
                }}>
                  <div style={{
                    flexGrow: approval !== "reject" ? 1 : 0,
                    flexShrink: 1,
                    flexBasis: 0,
                    overflow: "hidden",
                    transition: "flex-grow 0.3s ease",
                  }} />
                  <button
                    className="yes-button insight-yesno-btn"
                    style={{
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
                    className="no-button insight-yesno-btn"
                    style={{
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

              <div className="insight-checkbox-container" style={{ flex: 2 }}>
                <span className="insight-checkbox-label">IAA?</span>
                <button
                  className="irr-button insight-yesno-btn"
                  style={{
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

          <div className="insight-grid">
            <div className="insight-textarea-wrapper">
              <div className="insight-label-row">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label className="insight-label">Insight</label>
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
                <span className="insight-char-counter" style={{ color: insightLength > charLimit ? "#e53e3e" : "rgba(255, 255, 255, 0.4)" }}>{insightLength} / {charLimit.toLocaleString()} charaters</span>
              </div>
              <textarea
                placeholder={`Annotate this dashboard based on the guideline.\nClick one of four buttons above (L2, L3, L4, Eg) to see the guideline.\n\nExpected format:\n\nChart 1: [Title]\nL2: [Sentence 1]\nL3: [Sentence 2]\nL4: [Sentence 3]\n\nChart 2: [Title]\nL2: [Sentence 1]\nL3: [Sentence 2]\nL4: [Sentence 3]\n\nChart n: [Title]\nL2: [Sentence 1]\nL3: [Sentence 2]\nL4: [Sentence 3]`}
                value={insight}
                onChange={(e) => !readOnly && setInsight(e.target.value)}
                style={readOnly ? { cursor: "default", opacity: 0.75 } : undefined}
                className="insight-textarea"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="insight-guideline-panel" style={{
            maxHeight: activeTab ? "340px" : "0",
            opacity: activeTab ? 1 : 0,
            paddingTop: activeTab ? "16px" : "0",
            paddingBottom: activeTab ? "16px" : "0",
          }}>
            <div
              style={{ maxHeight: "308px", overflowY: "auto", fontSize: "14px" }}
              dangerouslySetInnerHTML={{ __html: guidelineHtml }}
            />
          </div>

          {!readOnly && (
            <div className="insight-actions">
              <button
                className="save-button"
                style={(insightLength > charLimit || (!isAnnotator && approval === "reject" && !rejectionReason))
                  ? { background: "#444", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" }
                  : undefined}
                onClick={save}
                disabled={insightLength > charLimit || (!isAnnotator && approval === "reject" && !rejectionReason)}
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

