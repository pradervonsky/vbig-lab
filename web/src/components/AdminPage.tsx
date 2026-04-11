"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import "./style/AdminPage.css";

type Role = "admin" | "annotator1" | "annotator2" | "viewer";

const ROLE_COLORS: Record<Role, string> = {
  admin: "#3a6ad6",
  annotator1: "#f0ad4e",
  annotator2: "#8b5cf6",
  viewer: "#6b7280",
};

export function AdminPage({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<{ id: string; email: string; role: Role }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("annotator1");
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from("user_roles").select("*").order("email");
    if (data) setUsers(data);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateRole = useCallback(async (email: string, role: Role) => {
    setSaving(email);
    await supabase.from("user_roles").update({ role }).eq("email", email);
    await loadUsers();
    setSaving(null);
  }, [loadUsers]);

  const addUser = useCallback(async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    await supabase.from("user_roles").upsert({ email: newEmail.trim().toLowerCase(), role: newRole });
    setNewEmail("");
    await loadUsers();
    setAdding(false);
  }, [newEmail, newRole, loadUsers]);

  const removeUser = useCallback(async (email: string) => {
    await supabase.from("user_roles").delete().eq("email", email);
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

