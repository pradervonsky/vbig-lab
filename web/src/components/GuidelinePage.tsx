"use client";

import "./style/GuidelinePage.css";

// ── Inline markdown renderer ──────────────────────────────────────────────────

function inline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#3a6ad6;text-decoration:underline">$1</a>');
}

export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inUL = false;
  let inOL = false;
  let inCode = false;
  let inTable = false;
  const codeLines: string[] = [];
  const tableLines: string[] = [];

  const closeList = () => {
    if (inUL) { out.push("</ul>"); inUL = false; }
    if (inOL) { out.push("</ol>"); inOL = false; }
  };

  const closeTable = () => {
    if (!inTable) return;
    inTable = false;
    const rows = tableLines.splice(0);
    if (rows.length < 2) return;
    const parseCells = (row: string) => row.split("|").slice(1, -1).map(c => c.trim());
    const headers = parseCells(rows[0]);
    const bodyRows = rows.slice(2).filter(r => r.trim());
    out.push(`<div style="overflow-x:auto;margin:12px 0"><table style="width:100%;border-collapse:collapse;font-size:13px">`);
    out.push(`<thead><tr>${headers.map(h => `<th style="padding:8px 12px;text-align:left;border-bottom:2px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.9);font-weight:600;background:rgba(255,255,255,0.05);white-space:nowrap">${inline(h)}</th>`).join("")}</tr></thead>`);
    if (bodyRows.length > 0) {
      out.push(`<tbody>`);
      for (const row of bodyRows) {
        const cells = parseCells(row);
        out.push(`<tr>${cells.map(c => `<td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.75);vertical-align:top">${inline(c)}</td>`).join("")}</tr>`);
      }
      out.push(`</tbody>`);
    }
    out.push(`</table></div>`);
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inTable) closeTable();
      if (inCode) {
        const escaped = codeLines.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        out.push(`<pre style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);padding:14px 16px;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:12px;line-height:1.6;margin:12px 0"><code>${escaped}</code></pre>`);
        codeLines.length = 0;
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.trimStart().startsWith("|")) {
      closeList();
      inTable = true;
      tableLines.push(line);
      continue;
    }
    if (inTable) closeTable();

    if (line.startsWith("# ")) {
      closeList();
      out.push(`<h1 style="font-size:22px;font-weight:700;margin:0px 0 8px;color:#fff;letter-spacing:-0.5px">${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      closeList();
      out.push(`<h2 style="font-size:17px;font-weight:600;margin:16px 0 6px;color:#fff">${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("#### ")) {
      closeList();
      out.push(`<h4 style="font-size:13px;font-weight:600;margin:10px 0 4px;color:rgba(255,255,255,0.7)">${inline(line.slice(5))}</h4>`);
    } else if (line.startsWith("### ")) {
      closeList();
      out.push(`<h3 style="font-size:14px;font-weight:600;margin:12px 0 4px;color:rgba(255,255,255,0.85)">${inline(line.slice(4))}</h3>`);
    } else if (line.trimStart().startsWith("- ") || line.trimStart().startsWith("* ")) {
      if (!inUL) { closeList(); out.push('<ul style="margin:8px 0;padding-left:20px;list-style-type:disc">'); inUL = true; }
      out.push(`<li style="margin:4px 0;color:rgba(255,255,255,0.8)">${inline(line.trimStart().slice(2))}</li>`);
    } else if (/^\s*\d+\. /.test(line)) {
      const num = parseInt(line.match(/^\s*(\d+)\. /)?.[1] ?? "1", 10);
      if (!inOL) { closeList(); out.push(`<ol start="${num}" style="margin:8px 0;padding-left:20px;list-style-type:decimal">`); inOL = true; }
      out.push(`<li style="margin:4px 0;color:rgba(255,255,255,0.8)">${inline(line.replace(/^\s*\d+\. /, ""))}</li>`);
    } else if (line.startsWith("> ")) {
      closeList();
      out.push(`<blockquote style="border-left:3px solid rgba(58,106,214,0.6);margin:8px 0;padding:4px 12px;color:rgba(255,255,255,0.6)">${inline(line.slice(2))}</blockquote>`);
    } else if (line === "---" || line === "***" || line === "___") {
      closeList();
      out.push('<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0" />');
    } else if (line.trim() === "") {
      closeList();
      out.push('<div style="height:8px"></div>');
    } else {
      closeList();
      out.push(`<p style="margin:4px 0;line-height:1.6;color:rgba(255,255,255,0.8)">${inline(line)}</p>`);
    }
  }
  closeList();
  closeTable();
  return out.join("");
}

import { Eg } from "./guidelines/Eg";

// Pre-render once at module load — Eg is a static constant, never changes
const EG_HTML = renderMarkdown(Eg);

// ── Component ─────────────────────────────────────────────────────────────────

export function GuidelinePage({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="guideline-overlay" onClick={onClose}>
        <div className="guideline-modal" onClick={e => e.stopPropagation()}>

          <div className="guideline-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 className="guideline-title">Insight Generation Guideline</h2>
              <a
                href="https://public.tableau.com/app/profile/prdn/viz/SuperstoreOverviewDashboard_17708894383950/db"
                target="_blank"
                rel="noopener noreferrer"
                className="guideline-dashboard-link"
              >
                ➤
              </a>
            </div>
            <button className="guideline-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="guideline-body">
            <div
              className="guideline-preview"
              dangerouslySetInnerHTML={{ __html: EG_HTML }}
            />
          </div>

        </div>
      </div>
    </>
  );
}

