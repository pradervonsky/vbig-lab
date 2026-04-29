export const L3 = `
# LEVEL 3: Perceptual & Visual Phenomena
## L3 Rules
1. Describe what you visually observe across the chart: a direction, a shape, a gap, or an exception, not a specific labelled value.
2. Use natural-sounding language referencing commonplace concepts: "fluctuate", "volatile", "falling below", "wider margin", "considerably far", "concentrated", "dipped", "spread".
3. Use hedging language when the pattern is not perfectly clear: "appears to", "seems to", "suggesting".
4. Do not report specific labelled values as the main content; they may only appear to anchor a pattern observation.
5. If the chart contains no temporal sequence, no comparable segments, and no distribution to observe, write exactly: **NOT APPLICABLE**.

   Chart examples that are not applicable:
1. **Ranked tables** (top products, top customers): top-N ordered list with no sign of distribution/shares to the total, no pattern to observe.
2. **Single KPI cards/scoreboard with no line chart**: no temporal or comparative context.
3. **Gauge charts**: showing a single current value against a target that has no sequence, no segments, and no distributions.

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
