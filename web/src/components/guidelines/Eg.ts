export const Eg = `
# Expected Output
- Insight generation can be entered on this page.
- The writing format is expected to be the same as the model's output intended from a fixed single prompt.
- Analyze chart-by-chart in Z-pattern (left→right, top→bottom).
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

Chart 2: Regional Manager Performance
L2: Among the four regional managers, Sadie Pawthrone led in sales at 258,241, followed by Chuck Magee at 216,567, Roxanne Rodriguez at 147,854, and lastly Fred Suzuki at 122,906.
L3: While the sales order shows a consistent drop-off from Sadie Pawthrone, the profit ratio does not, with Fred Suzuki ranked last in sales, but shows his performance in making a profit higher than that of Roxanne Rodriguez in third.
L4: Sadie Pawthrone's significantly higher product return ratio of 13% compared to other managers suggests a potential issue with product-market fit or customer expectation management in her region, which may ruin her long-term profitability despite leading sales figures.

Chart 3: Sales by Location
L2: The highest sale is located in California with sales of 146,388.
L3: Overall, the highest sales are clustered in coastal areas, with East dominated by several locations and West dominated by a single location in California.
L4: This finding may suggest the problems either in the distribution infrastructure, sales coverage, or the population itself, compared to the coastal areas that need to be investigated further.

Chart 4: Customer Value by Sales
L2: Low-value customers account for 79.24% of total customer sales of 745,568, making them the dominant segment.
L3: NOT APPLICABLE
L4: The low-value customers segment dominance at 79.24% of total sales suggests the business may be over-reliant on high-volume, low-margin transactions, indicating a strategic opportunity to invest in customer development to move low-value customers toward the medium and high-value segments.

Chart 5: Sales Performance by Category
L2: Top performer Technology product with sales of 105,668, with the shares of 38.79%.
L3: Both the Technology and Office Supplies categories show visible red dot outliers sitting considerably far to the left of their respective boxes, indicating both contain at least one severely underperforming product, while Furniture shows no such outlier.
L4: The presence of underperforming products in both Technology and Office Supplies, but not in Furniture, suggests that a wider product variety is exposed to inventory risk and may need to be reviewed as needed to reallocate shelf space toward proven performers.

Chart 6: Top Product by Sales
L2: Canon imageCLASS 2200, with sales of 35,700, outsold other products.
L3: NOT APPLICABLE
L4: Canon ImageCLASS 2200 outperforms other listed products, suggesting a strong market fit, indicating the business could benefit from prioritising its stock availability and marketing focus on this product to sustain its demand.

Chart 7: Top Customer by Sales
L2: Raymond Buch is the highest customer by sales with 14,203, followed by Tom Ashbrook with 13,723 sales.
L3: NOT APPLICABLE
L4: The narrow gap between the two top customers suggests no single customer dominates revenue, indicating a relatively healthy customer concentration risk.
`;
