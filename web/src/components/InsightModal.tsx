"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CSSProperties } from "react";

export function InsightModal({
  dashboard,
  onClose,
}: {
  dashboard: any;
  onClose: () => void;
}) {
  const [expected, setExpected] = useState<boolean | null>(null);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Pre-fill form if editing an existing insight
  useEffect(() => {
    if (dashboard.human_insights && dashboard.human_insights.length > 0) {
      const insight = dashboard.human_insights[0];
      setExpected(insight.expected_dataset);
      setP1(insight.insight_part_1 || "");
      setP2(insight.insight_part_2 || "");
      setP3(insight.insight_part_3 || "");
    }
  }, [dashboard]);

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
    const insightData = {
      expected_dataset: expected,
      insight_part_1: p1,
      insight_part_2: p2,
      insight_part_3: p3,
      updated_at: new Date().toISOString(),
    };

    // Check if an insight already exists for this dashboard
    if (dashboard.human_insights && dashboard.human_insights.length > 0) {
      // Update existing insight (preserves created_at, updates updated_at)
      await supabase
        .from("human_insights")
        .update(insightData)
        .eq("metadata_id", dashboard.id);
    } else {
      // Insert new insight
      await supabase.from("human_insights").insert({
        metadata_id: dashboard.id,
        ...insightData,
      });
    }

    // Show success notification
    setShowSuccess(true);

    // Close modal after showing success
    setTimeout(() => {
      handleClose();
    }, 1500);
  }

  return (
    <>
      <style>{`
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

        .save-button {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-button:hover {
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
      `}</style>
      <div style={styles.overlay}>
        {showSuccess && (
          <div style={styles.successToast} className="success-toast">
            <span style={{ fontSize: "15px", fontWeight: 600 }}>
              Insights saved successfully!
            </span>
          </div>
        )}
        <div style={styles.modal} className={`insight-modal${isClosing ? ' closing' : ''}`}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
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
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {dashboard.human_insights && dashboard.human_insights.length > 0 && (
              <span style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.5)",
                fontWeight: 500
              }}>
                Completed: {new Date(dashboard.human_insights[0].updated_at).toLocaleDateString()}{" "}
                {new Date(dashboard.human_insights[0].updated_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </span>
            )}
            <button
              style={styles.closeButton}
              className="modal-close-button"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={styles.contentWrapper}>
          <div style={styles.imageContainer}>
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

          <div style={styles.formSection}>
          <div style={styles.checkboxContainer}>
            <span style={styles.checkboxLabel}>Uses correct Superstore dataset</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="yes-button"
                style={{
                  ...styles.yesNoButton,
                  background: expected === true ? "#1ebb81" : "rgba(255, 255, 255, 0.05)",
                  border: expected === true ? "1px solid #1ebb81" : "1px solid rgba(255, 255, 255, 0.1)",
                }}
                onClick={() => setExpected(true)}
              >
                Yes
              </button>
              <button
                className="no-button"
                style={{
                  ...styles.yesNoButton,
                  background: expected === false ? "#a32b2b" : "rgba(255, 255, 255, 0.05)",
                  border: expected === false ? "1px solid #a32b2b" : "1px solid rgba(255, 255, 255, 0.1)",
                }}
                onClick={() => setExpected(false)}
              >
                No
              </button>
            </div>
          </div>

          <div style={styles.insightGrid}>
            <div style={styles.textareaWrapper}>
              <label style={styles.label}>Insight Part 1</label>
              <textarea
                placeholder="Describe the first key insight..."
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                style={styles.textarea}
                className="insight-textarea"
              />
            </div>
            <div style={styles.textareaWrapper}>
              <label style={styles.label}>Insight Part 2</label>
              <textarea
                placeholder="Describe the second key insight..."
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                style={styles.textarea}
                className="insight-textarea"
              />
            </div>
            <div style={styles.textareaWrapper}>
              <label style={styles.label}>Insight Part 3</label>
              <textarea
                placeholder="Describe the third key insight..."
                value={p3}
                onChange={(e) => setP3(e.target.value)}
                style={styles.textarea}
                className="insight-textarea"
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.primary} className="save-button" onClick={save}>
              Save Insights
            </button>
          </div>
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
    backdropFilter: "blur(12px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modal: {
    width: "90%",
    maxWidth: "1600px",
    height: "90vh",
    background: "linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 100%)",
    borderRadius: "20px",
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
    padding: "24px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
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