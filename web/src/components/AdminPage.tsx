"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import "./style/AdminPage.css";

type Role = "admin" | "annotator1" | "annotator2" | "annotator3" | "viewer";

const ROLE_COLORS: Record<Role, string> = {
  admin: "#3a6ad6",
  annotator1: "#f0ad4e",
  annotator2: "#8b5cf6",
  annotator3: "#10b981",
  viewer: "#6b7280",
};

export function AdminPage({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<{ id: string; email: string; role: Role }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("annotator1");
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase.from("user_roles").select("*").order("email");
    if (error) { console.error("loadUsers error:", error); return; }
    if (data) setUsers(data);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateRole = useCallback(async (email: string, role: Role) => {
    setOpError(null);
    setSaving(email);
    const { error } = await supabase.from("user_roles").update({ role }).eq("email", email);
    if (error) { console.error("updateRole error:", error); setOpError(error.message); }
    await loadUsers();
    setSaving(null);
  }, [loadUsers]);

  const addUser = useCallback(async () => {
    if (!newEmail.trim()) return;
    setOpError(null);
    setAdding(true);
    const { error } = await supabase
      .from("user_roles")
      .upsert({ email: newEmail.trim().toLowerCase(), role: newRole }, { onConflict: "email" });
    if (error) { console.error("addUser error:", error); setOpError(error.message); }
    else setNewEmail("");
    await loadUsers();
    setAdding(false);
  }, [newEmail, newRole, loadUsers]);

  const removeUser = useCallback(async (email: string) => {
    setOpError(null);
    const { error } = await supabase.from("user_roles").delete().eq("email", email);
    if (error) { console.error("removeUser error:", error); setOpError(error.message); return; }
    await loadUsers();
  }, [loadUsers]);

  return (
    <>
      <div className="admin-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="admin-panel">
          {/* Header */}
          <div className="admin-header">
            <div>
              <h2 className="admin-title">User Management</h2>
              <p className="admin-subtitle">Manage roles for annotators</p>
            </div>
            <button className="admin-close-btn" onClick={onClose}>✕</button>
          </div>

          {opError && (
            <div style={{ padding: "10px 14px", background: "rgba(163,43,43,0.15)", border: "1px solid rgba(163,43,43,0.4)", borderRadius: "8px", fontSize: "13px", color: "#f87171", marginBottom: "12px" }}>
              {opError}
            </div>
          )}

          {/* Users table */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Email</th>
                  <th className="admin-th">Role</th>
                  <th className="admin-th">Change Role</th>
                  <th className="admin-th admin-th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="admin-td">{u.email}</td>
                    <td className="admin-td">
                      <span
                        className="admin-role-badge"
                        style={{ background: ROLE_COLORS[u.role] }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="admin-td">
                      <select
                        className="admin-role-select"
                        defaultValue={u.role}
                        onChange={(e) => updateRole(u.email, e.target.value as Role)}
                        disabled={saving === u.email}
                      >
                        <option value="admin">admin</option>
                        <option value="annotator1">annotator1</option>
                        <option value="annotator2">annotator2</option>
                        <option value="annotator3">annotator3</option>
                        <option value="viewer">viewer</option>
                      </select>
                    </td>
                    <td className="admin-td admin-td-right">
                      <button
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
          <div className="admin-add-row">
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
              <option value="annotator3">annotator3</option>
              <option value="admin">admin</option>
              <option value="viewer">viewer</option>
            </select>
            <button
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

