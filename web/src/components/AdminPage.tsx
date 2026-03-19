"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CSSProperties } from "react";

type Role = "admin" | "annotator1" | "annotator2";

const ROLE_COLORS: Record<Role, string> = {
  admin: "#3a6ad6",
  annotator1: "#f0ad4e",
  annotator2: "#8b5cf6",
};

export function AdminPage({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<{ id: string; email: string; role: Role }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("annotator1");
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data } = await supabase.from("user_roles").select("*").order("email");
    if (data) setUsers(data);
  }

  async function updateRole(email: string, role: Role) {
    setSaving(email);
    await supabase.from("user_roles").update({ role }).eq("email", email);
    await loadUsers();
    setSaving(null);
  }

  async function addUser() {
    if (!newEmail.trim()) return;
    setAdding(true);
    await supabase.from("user_roles").upsert({ email: newEmail.trim().toLowerCase(), role: newRole });
    setNewEmail("");
    await loadUsers();
    setAdding(false);
  }

  async function removeUser(email: string) {
    await supabase.from("user_roles").delete().eq("email", email);
    await loadUsers();
  }

  return (
    <>
      <style>{`
        .admin-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(12px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          padding: 24px;
          animation: adminFadeIn 0.2s ease-out;
        }

        @keyframes adminFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }

        .admin-close-btn:hover {
          background: rgba(255,255,255,0.1) !important;
        }

        .admin-table tbody tr:hover td {
          background: rgba(255,255,255,0.04);
        }

        .admin-remove-btn:hover {
          background: rgba(220,53,69,0.25) !important;
          border-color: rgba(220,53,69,0.5) !important;
          color: #ff6b6b !important;
        }

        .admin-add-btn:hover:not(:disabled) {
          background: #4a7ae6 !important;
          transform: translateY(-1px);
        }

        .admin-add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .admin-role-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          outline: none;
        }

        .admin-role-select:focus {
          border-color: rgba(58,106,214,0.6);
        }

        .admin-email-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          flex: 1;
        }

        .admin-email-input:focus {
          border-color: rgba(58,106,214,0.6);
        }

        .admin-email-input::placeholder {
          color: rgba(255,255,255,0.3);
        }
      `}</style>

      <div className="admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>User Management</h2>
              <p style={styles.subtitle}>Manage roles for annotators</p>
            </div>
            <button style={styles.closeBtn} className="admin-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Users table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table} className="admin-table">
              <thead>
                <tr>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Change Role</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: ROLE_COLORS[u.role],
                        color: "#fff",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <select
                        className="admin-role-select"
                        defaultValue={u.role}
                        onChange={(e) => updateRole(u.email, e.target.value as Role)}
                        disabled={saving === u.email}
                      >
                        <option value="admin">admin</option>
                        <option value="annotator1">annotator1</option>
                        <option value="annotator2">annotator2</option>
                      </select>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button
                        style={styles.removeBtn}
                        className="admin-remove-btn"
                        onClick={() => removeUser(u.email)}
                        title="Remove user"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add user */}
          <div style={styles.addRow}>
            <input
              className="admin-email-input"
              type="email"
              placeholder="user@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addUser(); }}
            />
            <select
              className="admin-role-select"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
            >
              <option value="annotator1">annotator1</option>
              <option value="annotator2">annotator2</option>
              <option value="admin">admin</option>
            </select>
            <button
              style={styles.addBtn}
              className="admin-add-btn"
              onClick={addUser}
              disabled={adding || !newEmail.trim()}
            >
              {adding ? "Adding..." : "+ Add User"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    width: "100%",
    maxWidth: "680px",
    background: "linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 100%)",
    borderRadius: "20px",
    color: "#fff",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "24px 28px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "-0.4px",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "rgba(255,255,255,0.4)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    lineHeight: 1,
    fontWeight: 600,
  },
  tableWrapper: {
    overflowX: "auto",
    padding: "8px 0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px 20px",
    textAlign: "left" as const,
    fontSize: "11px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  td: {
    padding: "14px 20px",
    fontSize: "13px",
    color: "#e0e0e0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "background 0.15s ease",
  },
  removeBtn: {
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 500,
    color: "rgba(255,255,255,0.5)",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  addRow: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  addBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#fff",
    background: "#3a6ad6",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
  },
};
