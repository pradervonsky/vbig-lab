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
