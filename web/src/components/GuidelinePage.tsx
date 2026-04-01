"use client";

import type { CSSProperties } from "react";

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

// ── guideline starts here ──────────────────────────────────────────────────

export const L2 = `
# LEVEL 2: Quantitative Facts & Relations
## L2 Rules
1. Only report values that are explicitly shown, labelled, or directly readable from the chart image.
2. Do not compute values that are not displayed in the chart unless they are explicitly rendered as part of the visualisation, including percentage changes, averages, or ratios.
3. If a chart is not labelled, do not approximate its height; note only that it is visually higher or lower if that comparison is applicable.
> This rule exists because the VLMs being evaluated only see the image, not the underlying dataset. If your annotation contains arithmetic that the model cannot perform from the image alone, the evaluation is unfair. This level evaluation assesses VLM's ability to see the factual numbers displayed on the dashboard.

## L2 Categories & Examples
When describing a chart with L2 content, consider applying one of the categories below along with the examples.

1. **Extrema**: identify the single highest or lowest value visible in the chart.
> ✅ Total sales are 745.6K, total profit is 95.9K, order count is 1,723, and customer count is 704.
> ❌ Total sales fluctuated a lot. *(no value, no relation)*

2. **Outliers**: identify a value that visibly deviates from the surrounding data points in the chart.
> ✅ The lowest recorded values across the KPI sparklines are 20.3K for Sales, 2.6% for Profit Ratio, 53 for Orders, and 53 for Customers.
> ❌ Sales with 20.3K, 53 for both Orders and Customers are dipped in February, while the profit ratio dipped in April to only 2.6%. *(describing trend, "dipped" is L3 language)*

3. **Point-wise comparison**: state the relationship between two specific data points.
> ✅ Canon imageCLASS 2200, with sales of 35,700, outsold other products.
> ❌ Canon imageCLASS 2200 sold much more than the rest. *(no value)*

4. **Ranking**: order of multiple items by a metric when all items are visible.
> ✅ Among the four regional managers, Sadie Pawthrone led in sales at 258,241, followed by Chuck Magee at 216,567, Roxanne Rodriguez at 147,854, and lastly Fred Suzuki at 122,906.
> ❌ Sadie Pawthrone led in sales positioned her as the top manager. *(no value, no relation)*

5. **Share or proportion**: describe a part-to-whole relationship when explicitly shown.
> ✅ Low-value customers account for 79.24% of total customer sales of 745,568, making them the dominant segment.
> ❌ The highest share of sales is dominantly from the low-value customer segment. *(no value)*
`;

export const L3 = `
# LEVEL 3: Perceptual & Visual Phenomena
## L3 Rules
1. Describe what you visually observe across the chart: a direction, a shape, a gap, or an exception, not a specific labelled value.
2. Use natural-sounding language referencing commonplace concepts: "fluctuate", "volatile", "falling below", "wider margin", "considerably far", "concentrated", "dipped", "spread".
3. Use hedging language when the pattern is not perfectly clear: "appears to", "seems to", "suggesting".
4. Do not report specific labelled values as the main content; they may only appear to anchor a pattern observation.
5. If the chart contains no temporal sequence, no comparable segments, and no distribution to observe, write exactly: **NOT APPLICABLE**.

   Chart examples that are not applicable:
1. **Ranked tables** (top products, top customers): static ordered list with no pattern to observe.
2. **Single KPI cards/scoreboard with no line chart**: no temporal or comparative context.
3. **Doughnut/pie charts**: showing a single time point composition; belong in L2 content.
4. **Gauge charts**: showing a single current value against a target that has no sequence, no segments, and no distributions.

> This level exists because visualisations surface trends, exceptions, and patterns that are not apparent from numbers alone. This level evaluates the VLM's capability to visually comprehend the behaviour of data across the chart, not just read its labels.

## L3 Categories & Examples
When describing a chart with L3 content, consider applying one of the categories below along with the examples.
If none is applicable, remember to write **NOT APPLICABLE**.

1. **Complex trends**: describe the general direction or trajectory of values across a continuous or discrete axis.
> ✅ Sales, Orders, and Customers all show a general upward trajectory and above the average toward the end of the year, with the highest peak in November, while Profit Ratio shows a volatile pattern peaking in March and falling below average toward the end.
> ❌ Total sales went up toward the end. *(too vague, ignores the other three KPIs)*

2. **Pattern synthesis**: synthesise observations across multiple metrics, categories, or segments visible in the same chart to identify a unified or contrasting pattern.
> ✅ Across all three categories, the right whisker appears to extend further than the IQR box, suggesting that top-performing products consistently outsell low-performing products by a wider margin.
> ❌ The right whisker is longer than the left whisker in all three categories. *(describes the shape mechanically without synthesising what the pattern means across categories)*

3. **Exceptions**: identify a data point, period, or segment that visibly deviates from the surrounding.
> ✅ Both the Technology and Office Supplies categories show visible red dot outliers sitting considerably far to the left of their respective boxes, indicating both contain at least one severely underperforming product, while Furniture shows no such outlier.
> ❌ There is an outlier in both Technology and Office Supplies. *(too generic)*
`;

export const L4 = `
# LEVEL 4: Contextual & Domain-Specific Insights
## L4 Rules
1. Connect the observed data pattern from L2 and L3 content to a broader context, domain knowledge, or real-world explanation that goes beyond what is visible in the chart alone.
2. Use hedging language to signal that insights are interpretive, not factual: "suggesting", "may indicate", "likely due to", "could reflect".
3. Do not simply restate what is visible in the chart, as the L4 sentence must add meaning that cannot be read directly from the visualisation.
4. Avoid overly prescriptive or speculative claims that are not grounded in what the data show; they must be traceable to an observable pattern in the chart.
5. Contextual insight at this level is always applicable for every chart type in this study.

> This level evaluates the VLM's capability to generate business insights by synthesising visual observations with domain knowledge and contextual reasoning, which is the core definition of analytical insight in business intelligence.

## L4 Categories & Examples
When describing a chart with L4 content, consider applying one of the categories below along with the examples.

1. **Performance explanation**: provide a domain-grounded explanation for why a metric or segment performs the way it does.
> ✅ Sadie Pawthrone's significantly higher product return ratio of 13% compared to other managers suggests a potential issue with product-market fit or customer expectation management in her region, which may ruin her long-term profitability despite leading sales figures.
> ❌ Sadie Pawthrone has a high return ratio despite her leading sales figure. *(no domain-grounded explanation, no business consequence)*

2. **Trend explanation**: provide a contextual or domain-specific reason for an observed trend or pattern.
> ✅ The profit ratio dips in November despite the highest Sales, Orders, and customers, likely reflecting a holiday season discount strategy, where volume is prioritised over margin, which requires more strategic pricing to protect profitability during peak demand periods, to be at least above the average of the year.
> ❌ Sales peak in November while profit dips, which is interesting. *(acknowledges the pattern but adds no contextual explanation, no business implication)*

3. **Segment insight**: provide a domain-grounded interpretation of why a particular segment or group behaves differently from others.
> ✅ The low-value customers segment dominance at 79.24% of total sales suggests the business may be over-reliant on high-volume, low-margin transactions, indicating a strategic opportunity to invest in customer development to move low-value customers toward the medium and high-value segments.
> ❌ Most customers are a low-value segment, which is not ideal for the business in the long run. *(too vague, no domain reasoning, no actionable direction grounded in the data)*
`;

export const Eg = `
# Expected Output
- Insight generation can be entered on this page.
- The writing format is expected to be the same as the model's output intended from a fixed single prompt.
- Analyze chart-by-chart in Z-order (left→right, top→bottom).
- Treat the top scoreboard, if any (e.g., sales, profit, returns, quantity, customers), as a single Scoreboard Overview chart.
- For **EACH dashboard**, for **EACH chart**, write **EXACTLY 3 sentences** with labels of L2, L3, and L4:
\`\`\`
Chart 1: [Title]
L2: [Sentence 1]
L3: [Sentence 2]
L4: [Sentence 3]
\`\`\`

- For example, one dashboard has six charts, then the factorial design would be 6 charts x 3 levels = 18 sentences. For the 10 dashboards overall, it would be approximately 180 sentences.
- Expected output per dashboard (limited to 3,500 characters).

## Example
Chart 1: Scoreboard Overview
L2: Total sales are 745.6K, total profit is 95.9K, order count is 1,723, and customer count is 704.
L3: Sales, Orders, and Customers all show a general upward trajectory and above the average toward the end of the year, with the highest peak in November, while Profit Ratio shows a volatile pattern peaking in March and falling below average toward the end.
L4: The profit ratio dips in November despite the highest Sales, Orders, and customers, likely reflecting a holiday season discount strategy, where volume is prioritised over margin, which requires more strategic pricing to protect profitability during peak demand periods, to be at least above the average of the year.

Chart 2: Sales Performance by Category
L2: Top performer Technology product with sales of 105,668, with the shares of 38.79%.
L3: Both the Technology and Office Supplies categories show visible red dot outliers sitting considerably far to the left of their respective boxes, indicating both contain at least one severely underperforming product, while Furniture shows no such outlier.
L4: The presence of underperforming products in both Technology and Office Supplies, but not in Furniture, suggests that a wider product variety is exposed to inventory risk and may need to be reviewed as needed to reallocate shelf space toward proven performers.

Chart 3: Regional Manager Performance
L2: Among the four regional managers, Sadie Pawthrone led in sales at 258,241, followed by Chuck Magee at 216,567, Roxanne Rodriguez at 147,854, and lastly Fred Suzuki at 122,906.
L3: While the sales order shows a consistent drop-off from Sadie Pawthrone, the profit ratio does not, with Fred Suzuki ranked last in sales, but shows his performance in making a profit higher than that of Roxanne Rodriguez in third.
L4: Sadie Pawthrone's significantly higher product return ratio of 13% compared to other managers suggests a potential issue with product-market fit or customer expectation management in her region, which may ruin her long-term profitability despite leading sales figures.

Chart 4: Customer Value by Sales
L2: Low-value customers account for 79.24% of total customer sales of 745,568, making them the dominant segment.
L3: NOT APPLICABLE
L4: The low-value customers segment dominance at 79.24% of total sales suggests the business may be over-reliant on high-volume, low-margin transactions, indicating a strategic opportunity to invest in customer development to move low-value customers toward the medium and high-value segments.

Chart 5: Top Product by Sales
L2: Canon imageCLASS 2200, with sales of 35,700, outsold other products.
L3: NOT APPLICABLE
L4: Canon ImageCLASS 2200 outperforms other listed products, suggesting a strong market fit, indicating the business could benefit from prioritising its stock availability and marketing focus on this product to sustain its demand.

Chart 6: Top Customer by Sales
L2: Raymond Buch is the highest customer by sales with 14,203, followed by Tom Ashbrook with 13,723 sales.
L3: NOT APPLICABLE
L4: The narrow gap between the two top customers suggests no single customer dominates revenue, indicating a relatively healthy customer concentration risk.
`;

// ── Component ─────────────────────────────────────────────────────────────────

export function GuidelinePage({ onClose }: { onClose: () => void }) {
  return (
    <>
      <style>{`
        .guideline-close-btn:hover {
          background: rgba(255,255,255,0.08) !important;
        }
      `}</style>

      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>

          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 style={styles.title}>Insight Generation Guideline</h2>
              <a
                href="https://public.tableau.com/app/profile/prdn/viz/SuperstoreOverviewDashboard_17708894383950/db"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.dashboardLink}
              >
                ➤
              </a>
            </div>
            <button className="guideline-close-btn" style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>

          <div style={styles.body}>
            <div
              style={styles.preview}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(Eg) }}
            />
          </div>

        </div>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(12px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    zIndex: 900,
  },
  modal: {
    width: "100%",
    maxWidth: "900px",
    height: "85vh",
    background: "linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 100%)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 28px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "-0.4px",
    background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  dashboardLink: {
    padding: "8px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#fff",
    textDecoration: "none",
    background: "#333333",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    whiteSpace: "nowrap" as const,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    fontSize: "18px",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
  },
  preview: {
    flex: 1,
    overflow: "auto",
    padding: "24px 28px",
    fontSize: "14px",
    lineHeight: "1.6",
  },
};
