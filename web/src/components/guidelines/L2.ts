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
