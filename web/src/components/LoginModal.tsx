"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

interface LoginModalProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function LoginModal({ onSuccess, onBack }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>

        <h2 style={styles.title}>Sign In</h2>
        <p style={styles.subtitle}>Enter your credentials to continue</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 100%)",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: "16px",
    left: "16px",
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "14px",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 8px 0",
    letterSpacing: "-1px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.5)",
    margin: "0 0 32px 0",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: "0.5px",
  },
  input: {
    padding: "14px 16px",
    fontSize: "15px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    color: "#fff",
    outline: "none",
    transition: "all 0.2s ease",
  },
  error: {
    padding: "12px 16px",
    background: "rgba(220, 53, 69, 0.15)",
    border: "1px solid rgba(220, 53, 69, 0.3)",
    borderRadius: "10px",
    color: "#ff6b6b",
    fontSize: "13px",
    textAlign: "center",
  },
  submitButton: {
    padding: "16px 32px",
    fontSize: "16px",
    fontWeight: 600,
    background: "linear-gradient(135deg, #3a6ad6 0%, #2a5ac6 100%)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "8px",
  },
};
